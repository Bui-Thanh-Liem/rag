import { InventoryEntity } from '@/modules/inventory/inventories/entities/inventory.entity';
import { ProductImageEntity } from '@/modules/catalog/product-images/entities/product-image.entity';
import { ProductItemEntity } from '@/modules/catalog/product-items-SERIAL/entities/product-item.entity';
import { ProductEntity } from '@/modules/catalog/products-SPU/entities/product.entity';
import { PromotionEntity } from '@/modules/marketing-program/promotions/entities/promotion.entity';
import { RatingEntity } from '@/modules/customer/rating/entities/rating.entity';
import { BaseEntity } from '@/shared/entities/base.entity';
import { ProductVariantCondition } from '@/shared/enums/product-variant-condition.enum';
import { IProductVariant, IVariantAttribute } from '@/shared/interfaces/models/catalog/product-variant.interface';
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { CartItemEntity } from '@/modules/customer/cart-items/entities/cart-item.entity';
import { ProductPromotionEntity } from '@/modules/marketing-program/product-promotions/entities/product-promotion.entity';
import { CampaignEntity } from '@/modules/marketing-program/campaigns/entities/campaign.entity';
import { ProductVariantStatus } from '@/shared/enums/product-variant-status.enum';
import { ProductVariantEmbedEntity } from '@/modules/catalog/product-variants-SKU/entities/product-variant-embed.entity';

@Entity('product_variants')
export class ProductVariantEntity extends BaseEntity implements IProductVariant {
  @ManyToOne(() => ProductEntity, (prod) => prod.productVariants)
  product: ProductEntity;

  @Column({ unique: true })
  sku: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  vat?: number;

  @Column({ unique: true })
  barcode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discountPercent: number;

  @Column({ type: 'int', default: 0 })
  soldCount: number;

  @Column({ type: 'enum', enum: ProductVariantCondition })
  conditions: ProductVariantCondition;

  @Column({ type: 'enum', enum: ProductVariantStatus, default: ProductVariantStatus.NORMAL })
  status: ProductVariantStatus;

  @Column({ type: 'jsonb', name: 'sales_attributes', nullable: true })
  salesAttributes: IVariantAttribute[];

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'sales_attributes_index',
  })
  salesAttributesIndex: Record<string, string>;

  // Quan hệ với các entity khác
  @OneToOne(() => ProductVariantEmbedEntity, (embed) => embed.productVariant, { nullable: true })
  productVariantEmbed?: ProductVariantEmbedEntity;

  @OneToMany(() => InventoryEntity, (inventory) => inventory.productVariant, { nullable: true, onDelete: 'SET NULL' })
  inventories?: InventoryEntity[];

  @OneToMany(() => ProductItemEntity, (productItem) => productItem.productVariant, { nullable: true })
  productItems?: ProductItemEntity[];

  @OneToMany(() => RatingEntity, (rating) => rating.productVariant, { nullable: true })
  rating?: RatingEntity[];

  @OneToMany(() => ProductPromotionEntity, (productPromotion) => productPromotion.productVariant, { nullable: true })
  productPromotions?: ProductPromotionEntity[];

  @ManyToMany(() => PromotionEntity, (promotion) => promotion.productHighlighted, { nullable: true })
  promotions?: PromotionEntity[];

  @ManyToMany(() => CampaignEntity, (campaign) => campaign.productHighlighted, { nullable: true })
  campaigns?: CampaignEntity[];

  @OneToMany(() => CartItemEntity, (cartItem) => cartItem.productVariant)
  cartItems?: CartItemEntity[];

  @OneToMany(() => ProductImageEntity, (image) => image.productVariant, {
    cascade: true, // Thêm cascade để tự động lưu các hình ảnh khi lưu biến thể sản phẩm
    orphanedRowAction: 'delete',
  })
  productImages: ProductImageEntity[];

  //
  @BeforeInsert()
  @BeforeUpdate()
  handle(): void {
    if (this.productImages?.length && this.product) {
      this.productImages.forEach((img, idx) => {
        img.productVariant = this; // Gán productVariant cho mỗi hình ảnh
        img.sortOrder = idx; // Tự động gán sortOrder theo thứ tự trong mảng
        img.isThumbnail = idx === 0; // Tự động đánh dấu hình ảnh đầu tiên là thumbnail
      });
    }

    this.salesAttributesIndex = Object.fromEntries((this.salesAttributes ?? []).map((attr) => [attr.key, attr.value]));
  }

  logInsert(): void {
    this.logger.debug(`Đã chèn thành công ProductVariant có sku: ${this.sku}`);
  }
  logUpdate(): void {
    this.logger.debug(`Đã cập nhật thành công ProductVariant có sku: ${this.sku}`);
  }
  logRemove(): void {
    this.logger.debug(`Đã xóa thành công ProductVariant có sku: ${this.sku}`);
  }
}
