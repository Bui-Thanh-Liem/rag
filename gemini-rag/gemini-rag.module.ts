import { Global, Module } from '@nestjs/common';
import { GeminiRagService } from './gemini-rag.service';
import { GeminiRagController } from './gemini-rag.controller';

@Global()
@Module({
  controllers: [GeminiRagController],
  providers: [GeminiRagService],
  exports: [GeminiRagService],
})
export class GeminiRagModule {}
