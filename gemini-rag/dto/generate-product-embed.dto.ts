import { VariantAttributeDto } from '@/modules/catalog/product-variants-SKU/dto/create-product-variant.dto';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateProductEmbedDto {
  @IsNotEmpty()
  @IsString()
  brandName: string;

  @IsNotEmpty()
  @IsString()
  categoryName: string;

  @IsNotEmpty()
  @IsString()
  productName: string;

  @IsArray()
  @Type(() => VariantAttributeDto)
  salesAttributes: VariantAttributeDto[];

  @IsOptional()
  @IsString()
  desc: string;
}
