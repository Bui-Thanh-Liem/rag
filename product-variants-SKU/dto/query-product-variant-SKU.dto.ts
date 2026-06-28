import { Trim } from '@/decorators/trim.decorator';
import { SORT_OPTIONS } from '@/shared/constants/sort-option.constant';
import { createQueryDto } from '@/shared/dtos/req/query.dto';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

class ProductVariantFilterDto {
  @IsOptional()
  @IsString()
  @Trim()
  b?: string; // Brand slug

  @IsOptional()
  @Trim()
  @IsString()
  @IsIn(SORT_OPTIONS, { message: 'Sort invalid' })
  s: (typeof SORT_OPTIONS)[number]; // Sort option

  @IsOptional()
  @Trim()
  @IsString()
  fa?: string; // JSON string of { key: value } (key is attribute key, value is attribute value)

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class ProductVariantQueryDto extends createQueryDto(ProductVariantFilterDto) {}
