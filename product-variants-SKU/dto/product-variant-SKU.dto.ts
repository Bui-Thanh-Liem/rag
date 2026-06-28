import { ProductImageDto } from '@/modules/catalog/product-images/dto/product-image.dto';
import { ProductSPUDto, SpecificationItemDto } from '@/modules/catalog/products-SPU/dto/product-SPU.dto';
import { SerializerDto } from '@/shared/dtos/res/serializer.dto';
import { ProductVariantCondition } from '@/shared/enums/product-variant-condition.enum';
import { ProductVariantStatus } from '@/shared/enums/product-variant-status.enum';
import { IVariantAttribute } from '@/shared/interfaces/models/catalog/product-variant.interface';
import { Expose, Type } from 'class-transformer';

class SpecificationDto extends SpecificationItemDto implements IVariantAttribute {
  @Expose()
  isSKU: boolean;
}
export class ProductVariantSKUDto extends SerializerDto {
  @Expose()
  product: ProductSPUDto;

  @Expose()
  sku: string;

  @Expose()
  slug: string;

  @Expose()
  barcode: string;

  @Expose()
  price: number;

  @Expose()
  costPrice: number;

  @Expose()
  vat: number;

  @Expose()
  soldCount: number;

  @Expose()
  discountPercent: number;

  @Expose()
  conditions: ProductVariantCondition;

  @Expose()
  status: ProductVariantStatus;

  @Expose()
  @Type(() => SpecificationDto)
  salesAttributes: SpecificationDto[];

  @Expose()
  @Type(() => ProductImageDto)
  productImages: ProductImageDto[];

  //
  @Expose()
  count: number;
}
