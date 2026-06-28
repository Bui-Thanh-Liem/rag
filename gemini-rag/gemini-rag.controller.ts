import { Controller, Post, Body } from '@nestjs/common';
import { GeminiRagService } from './gemini-rag.service';
import { GenerateProductEmbedDto } from './dto/generate-product-embed.dto';
import { GenerateQuestionEmbedDto } from './dto/generate-question-embed.dto';

@Controller('gemini-rag')
export class GeminiRagController {
  constructor(private readonly geminiRagService: GeminiRagService) {}

  // FOR TESTING PURPOSES ONLY, REMOVE THIS ENDPOINT IN PRODUCTION
  @Post('product-embedding')
  generateProductEmbedding(@Body() dto: GenerateProductEmbedDto) {
    return this.geminiRagService.generateProductEmbedding(dto);
  }

  // FOR TESTING PURPOSES ONLY, REMOVE THIS ENDPOINT IN PRODUCTION
  @Post('question-embedding')
  generateQuestionEmbedding(@Body() dto: GenerateQuestionEmbedDto) {
    return this.geminiRagService.generateQuestionEmbedding(dto.question);
  }

  // FOR TESTING PURPOSES ONLY, REMOVE THIS ENDPOINT IN PRODUCTION
  @Post('chatbot-response')
  generateChatbotResponse(@Body() dto: { question: string; matchedProducts: any[] }) {
    return this.geminiRagService.generateChatbotResponse(dto.question, dto.matchedProducts);
  }
}
