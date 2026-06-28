import { Controller, Post, Body, Header, Res } from '@nestjs/common';
import { type Response } from 'express';
import { GeminiRagService } from '@/common/gemini-rag/gemini-rag.service';
import { ProductVariantsService } from '@/modules/catalog/product-variants-SKU/product-variants.service';
import { Public } from '@/decorators/public.decorator';
import {
  retryWithBackoff,
  retryStreamOnFirstChunk,
  isGeminiOverloadedError,
  isGeminiDailyQuotaExceeded,
} from '@/utils/retry-with-backoff.util';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly geminiRagService: GeminiRagService,
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Public()
  @Post('chat')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async streamChat(@Body('question') question: string, @Res() res: Response) {
    const sendEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      // Bước 0: Gửi headers để bắt đầu SSE
      res.flushHeaders();

      // Bước 1: Trả về chunk "Đang suy nghĩ"
      sendEvent({
        type: 'thinking',
        content: '...',
      });

      // Bước 2: Tìm sản phẩm liên quan - tự động retry nếu Gemini (embedding) bị 503
      const matchedProducts = await retryWithBackoff(
        () => this.productVariantsService.findSimilarProductEmbeddings(question, 5),
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (error, attempt, delay) => {
            console.warn(`[Chatbot] Tìm sản phẩm thất bại (lần ${attempt}), thử lại sau ${Math.round(delay)}ms`, error);
            sendEvent({
              type: 'thinking',
              content: 'Hệ thống đang quá tải, đang thử lại...',
            });
          },
        },
      );

      // Bước 3: Trả về Sources
      sendEvent({
        type: 'sources',
        content: 'Sản phẩm tham chiếu:',
        data: matchedProducts.map((pv, i) => ({
          rank: i + 1,
          sku: pv.sku,
          price: pv.price,
          name: pv.product?.name,
        })),
      });

      // Bước 4: Stream câu trả lời từ Gemini - tự động retry NẾU CHƯA gửi chunk nào
      sendEvent({ type: 'start_answer' });

      const answerStream = retryStreamOnFirstChunk(
        () => this.geminiRagService.generateChatbotResponseStream(question, matchedProducts),
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (error, attempt, delay) => {
            console.warn(`[Chatbot] Gemini đang quá tải (lần ${attempt}), thử lại sau ${Math.round(delay)}ms`, error);
            sendEvent({
              type: 'thinking',
              content: 'Mô hình đang quá tải, đang thử lại...',
            });
          },
        },
      );

      for await (const chunk of answerStream) {
        console.log('SEND:', chunk);

        sendEvent({ type: 'answer_chunk', content: chunk });

        // Flush the response to ensure the client receives the chunk immediately
        if (res.flush) {
          res.flush();
        }
      }

      sendEvent({ type: 'end' });
      res.end();
    } catch (error) {
      console.error(error);
      let content = 'Có lỗi xảy ra, vui lòng thử lại sau.';
      if (isGeminiDailyQuotaExceeded(error)) {
        content =
          'Trợ lý AI đã đạt giới hạn sử dụng hôm nay, vui lòng thử lại vào ngày mai hoặc liên hệ shop trực tiếp.';
      } else if (isGeminiOverloadedError(error)) {
        content = 'Hệ thống đang quá tải, vui lòng thử lại sau ít phút.';
      }
      sendEvent({ type: 'error', content });
      res.end();
    }
  }
}
