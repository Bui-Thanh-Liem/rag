import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GenerateProductEmbedDto } from './dto/generate-product-embed.dto';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { ProductVariantEntity } from '@/modules/catalog/product-variants-SKU/entities/product-variant.entity';
import { retryWithBackoff } from '@/utils/retry-with-backoff.util';

@Injectable()
export class GeminiRagService {
  private ai: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not defined in the environment variables.');
    }

    this.ai = new GoogleGenAI({ apiKey: apiKey });
  }

  async generateProductEmbedding(dto: GenerateProductEmbedDto): Promise<number[]> {
    const { productName, brandName, categoryName, salesAttributes, desc } = dto;

    const salesAttributesText = salesAttributes?.length
      ? salesAttributes.map((attr) => `${attr.label}: ${attr.desc}`).join(', ')
      : '';

    // Ghép thành đoạn text có cấu trúc, bỏ qua field nào trống (không để lại "undefined")
    // Lưu ý: KHÔNG đưa price vào đây — giá là dữ liệu định lượng, nên filter bằng SQL
    // trên cột price thật, không cần (và không nên) đưa vào vector.
    const textToEmbed = [
      `Tên: ${productName}`,
      `Danh mục: ${categoryName}`,
      `Thương hiệu: ${brandName}`,
      salesAttributesText && `Thuộc tính: ${salesAttributesText}`,
      desc && `Mô tả: ${desc}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await retryWithBackoff(
        () =>
          this.ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: textToEmbed,
            config: {
              outputDimensionality: 768,
              taskType: 'RETRIEVAL_DOCUMENT',
            },
          }),
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (error, attempt, delay) => {
            console.warn(`[Embedding] Gemini đang quá tải (lần ${attempt}), thử lại sau ${Math.round(delay)}ms`, error);
          },
        },
      );

      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) {
        throw new Error('Gemini không trả về embedding hợp lệ');
      }

      return embedding;
    } catch (error) {
      console.error('Lỗi khi gọi Gemini Embedding API:', error);
      throw new InternalServerErrorException('Không thể tạo embedding cho sản phẩm');
    }
  }

  async generateQuestionEmbedding(question: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: question,
        config: {
          outputDimensionality: 768,
          taskType: 'RETRIEVAL_QUERY',
        },
      });

      const embedding = response.embeddings?.[0]?.values;

      if (!embedding) {
        throw new InternalServerErrorException('Không nhận được embedding từ Gemini');
      }

      return embedding;
    } catch (error) {
      console.error('Lỗi khi embed câu hỏi:', error);
      throw new InternalServerErrorException('Không thể tạo embedding cho câu hỏi');
    }
  }

  async generateChatbotResponse(question: string, matchedProducts: ProductVariantEntity[]) {
    // 1. Định dạng danh sách sản phẩm tìm được từ DB thành văn bản context
    const contextProducts = matchedProducts
      .map((pv, index) => {
        const productName = pv?.product?.name;
        const saleAttributes = pv?.salesAttributes?.map((attr) => `${attr.label}: ${attr.desc}`).join(', ');
        return `${index + 1}. ${productName} - Giá: ${pv.price}đ - Mô tả: ${saleAttributes}`;
      })
      .join('\n');

    // 2. Gọi Gemini sinh câu trả lời
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `
                    Bạn là trợ lý ảo bán hàng thông minh, thân thiện và chuyên nghiệp.
                    Hãy dùng danh sách sản phẩm sau để tư vấn và trả lời câu hỏi của khách hàng một cách tự nhiên. 
                    Tuyệt đối không tự bịa thông tin sản phẩm nếu không có trong danh sách.
                    
                    Danh sách sản phẩm phù hợp:
                    ${contextProducts || 'Không tìm thấy sản phẩm nào phù hợp.'}
                      
                    Câu hỏi của khách hàng: "${question}"`,
            },
          ],
        },
      ],
    });

    return response.text;
  }

  async *generateChatbotResponseStream(question: string, matchedProducts: ProductVariantEntity[]) {
    const contextProducts = matchedProducts
      .map((pv, index) => {
        const productName = pv?.product?.name;
        const saleAttributes = pv?.salesAttributes?.map((attr) => `${attr.label}: ${attr.desc}`).join(', ');
        return `${index + 1}. ${productName} - Giá: ${pv.price}đ - Mô tả: ${saleAttributes}`;
      })
      .join('\n');

    const prompt = `
                      Bạn là trợ lý ảo bán hàng thông minh, thân thiện và chuyên nghiệp.
                      Hãy dùng danh sách sản phẩm sau để tư vấn và trả lời câu hỏi của khách hàng một cách tự nhiên. 
                      Tuyệt đối không tự bịa thông tin sản phẩm nếu không có trong danh sách.

                      Danh sách sản phẩm phù hợp:
                      ${contextProducts || 'Không tìm thấy sản phẩm nào phù hợp.'}

                      Câu hỏi của khách hàng: "${question}"
                    `;

    const stream = await this.ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }
}

/**
 * 1. Tạo sản phẩm (SKU)
 * 2. Lưu sản phẩm vào DB
 * 3. Gọi Gemini Embedding API để tạo embedding vector
 * 4. Lưu embedding vector vào DB (ProductVariantEmbedEntity)
 *
 * Khi cần tìm kiếm sản phẩm tương tự:
 * 1. Gọi Gemini Embedding API để tạo embedding vector cho câu hỏi của khách hàng
 * 2. Dùng embedding vector này để truy vấn DB tìm các sản phẩm có embedding vector gần nhất
 * 3. Trả về danh sách sản phẩm phù hợp cho chatbot tư vấn
 *
 * Khi cần trả lời câu hỏi của khách hàng:
 * 1. Dùng danh sách sản phẩm tìm được từ bước trên làm context
 * 2. Gọi Gemini Chat API để sinh câu trả lời dựa trên context và câu hỏi của khách hàng
 */
