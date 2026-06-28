import { Trim } from '@/decorators/trim.decorator';
import { CreateProductImageDto } from '@/modules/catalog/product-images/dto/create-product-image.dto';
import { ProductVariantCondition } from '@/shared/enums/product-variant-condition.enum';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { SpecificationItemDto } from '../../products-SPU/dto/product-SPU.dto';
import { ProductVariantStatus } from '@/shared/enums/product-variant-status.enum';

export class VariantAttributeDto extends SpecificationItemDto {
  @IsOptional()
  @IsBoolean()
  isSKU?: boolean;
}

export class CreateProductVariantDto {
  @IsUUID()
  @IsNotEmpty()
  product: string;

  @IsNumber()
  @IsNotEmpty()
  vat: number;

  @IsString()
  @IsNotEmpty()
  @Trim()
  barcode: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  costPrice: number;

  @IsNumber()
  @IsNotEmpty()
  discountPercent: number;

  @IsEnum(ProductVariantCondition)
  conditions: ProductVariantCondition;

  @IsEnum(ProductVariantStatus)
  status: ProductVariantStatus;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => VariantAttributeDto)
  salesAttributes: VariantAttributeDto[];

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  productImages: CreateProductImageDto[];
}
