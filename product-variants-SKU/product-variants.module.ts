import { forwardRef, Module } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariantEntity } from './entities/product-variant.entity';
import { ProductsModule } from '../products-SPU/products.module';
import { ProductCodeModule } from '../product-code/product-code.module';
import { CustomerProductsModule } from '@/modules/customer/customer-products/customer-products.module';
import { ProductVariantEmbedEntity } from './entities/product-variant-embed.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariantEntity, ProductVariantEmbedEntity]),
    ProductsModule,
    ProductCodeModule,
    forwardRef(() => CustomerProductsModule),
  ],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService],
})
export class ProductVariantsModule {}
