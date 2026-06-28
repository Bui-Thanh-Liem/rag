import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Serializer } from '@/interceptors/serializer.interceptor';
import { ProductVariantSKUDto } from './dto/product-variant-SKU.dto';
import { ProductVariantQueryDto } from './dto/query-product-variant-SKU.dto';
import { ProductVariantMetadataDto } from './dto/metadata-product-variant.dto';
import { Permissions } from '@/decorators/permission.decorator';
import { permissionsSeed } from '@/modules/management/permissions/seeding';
import { Public } from '@/decorators/public.decorator';
import { CustomerEntity } from '@/modules/customer/customers/entities/customer.entity';
import { type IInfoGuest } from '@/shared/interfaces/common/info-guest';
import { GetInfoGuest } from '@/decorators/get-info-guest.decorator';
import { CurrentCustomer } from '@/decorators/current-customer.decorator';
import { CustomerProductType } from '@/shared/enums/customer-product-type.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('product-variants')
@Serializer(ProductVariantSKUDto)
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
    @InjectQueue('customer-product')
    private readonly customerProductQueue: Queue,
  ) {}

  @Post()
  @Permissions(permissionsSeed.productVariant.create.code)
  create(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantsService.create(createProductVariantDto);
  }

  @Get()
  @Permissions(permissionsSeed.productVariant.read.code)
  @Serializer(ProductVariantMetadataDto)
  findAll(@Query() query: ProductVariantQueryDto) {
    return this.productVariantsService.findAll(query);
  }

  @Get('options')
  @Permissions(permissionsSeed.productVariant.read.code)
  @Serializer(ProductVariantMetadataDto)
  async findOptions(@Query() query: ProductVariantQueryDto) {
    return await this.productVariantsService.findOptions(query);
  }

  @Get(':id')
  @Permissions(permissionsSeed.productVariant.read.code)
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Patch(':id')
  @Permissions(permissionsSeed.productVariant.update.code)
  update(@Param('id') id: string, @Body() updateProductVariantDto: UpdateProductVariantDto) {
    return this.productVariantsService.update(id, updateProductVariantDto);
  }

  @Public()
  @Get('campaign/:campaignId')
  @Permissions(permissionsSeed.productVariant.read.code)
  @Serializer(ProductVariantMetadataDto)
  async findAllByCampaign(@Param('campaignId') campaignId: string, @Query() query: ProductVariantQueryDto) {
    return await this.productVariantsService.findAllByCampaign(campaignId, query);
  }

  @Public()
  @Get('category/slug/:categorySlug')
  @Permissions(permissionsSeed.productVariant.read.code)
  @Serializer(ProductVariantMetadataDto)
  async findAllByCategorySlug(@Param('categorySlug') categorySlug: string, @Query() query: ProductVariantQueryDto) {
    return await this.productVariantsService.findAllByCategorySlug(categorySlug, query);
  }

  @Public()
  @Get('count/category/slug/:categorySlug')
  @Permissions(permissionsSeed.productVariant.read.code)
  @Serializer(ProductVariantSKUDto)
  async countProductsByCategorySlug(
    @Param('categorySlug') categorySlug: string,
    @Query() query: ProductVariantQueryDto,
  ) {
    return await this.productVariantsService.countProductsByCategorySlug(categorySlug, query);
  }

  @Public()
  @Get('slug/:slug')
  @Permissions(permissionsSeed.productVariant.read.code)
  async findOneBySlug(
    @Param('slug') slug: string,
    @GetInfoGuest() guest: IInfoGuest,
    @CurrentCustomer() customer: CustomerEntity,
  ) {
    //
    const variant = await this.productVariantsService.findOneBySlug(slug);

    // Tạo sản phẩm đã xem (HISTORY) cho khách hàng hoặc guest
    if (variant) {
      await this.customerProductQueue.add('create-suggest-product', {
        dto: { type: CustomerProductType.HISTORY, productVariant: variant.id },
        guest,
        customer,
      });
    }

    //
    return variant;
  }

  @Delete(':id')
  @Permissions(permissionsSeed.productVariant.delete.code)
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(id);
  }
}
