import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateQuestionEmbedDto {
  @IsNotEmpty()
  @IsString()
  question: string;
}
