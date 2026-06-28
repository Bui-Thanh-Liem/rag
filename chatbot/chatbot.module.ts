import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ProductVariantsModule } from '@/modules/catalog/product-variants-SKU/product-variants.module';

@Module({
  imports: [ProductVariantsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
