import { ProductVariantEntity } from '@/modules/catalog/product-variants-SKU/entities/product-variant.entity';
import { BaseEntity } from '@/shared/entities/base.entity';
import { IProductVariantEmbed } from '@/shared/interfaces/common/product-variant-embed.interface';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('product_variant_embeds')
export class ProductVariantEmbedEntity extends BaseEntity implements IProductVariantEmbed {
  @Column({ type: 'uuid' })
  productVariantId: string;

  @OneToOne(() => ProductVariantEntity, (productVariant) => productVariant.productVariantEmbed, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariantEntity;

  @Column({ type: 'vector', length: 768 })
  embedding: number[];

  @Column({ type: 'jsonb', name: 'data_to_embed', nullable: true })
  dataToEmbed: any;

  logInsert(): void {
    this.logger.debug(`Đã chèn thành công ProductVariantEmbed có productVariantId: ${this.productVariantId}`);
  }
  logUpdate(): void {
    this.logger.debug(`Đã cập nhật thành công ProductVariantEmbed có productVariantId: ${this.productVariantId}`);
  }
  logRemove(): void {
    this.logger.debug(`Đã xóa thành công ProductVariantEmbed có productVariantId: ${this.productVariantId}`);
  }
}
