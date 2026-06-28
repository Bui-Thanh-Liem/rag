import { BaseMetadataDto } from '@/shared/dtos/res/base-metadata.dto';
import { Expose, Type } from 'class-transformer';
import { IMetadata } from '@/shared/interfaces/common/metadata.interface';
import { ProductVariantSKUDto } from './product-variant-SKU.dto';

export class ProductVariantMetadataDto extends BaseMetadataDto implements IMetadata<ProductVariantSKUDto> {
  @Expose()
  @Type(() => ProductVariantSKUDto)
  data: ProductVariantSKUDto[];
}
