import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

const pdfStorage = diskStorage({
  destination: process.env.UPLOAD_DIR ?? './uploads',
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `ficha-${randomUUID()}${ext}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(Role.SUPER_ADMIN)
  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.importFromCsv(file.buffer);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post(':id/ficha-tecnica')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: pdfStorage,
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Apenas ficheiros PDF são permitidos'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFichaTecnica(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Ficheiro PDF obrigatório');
    return this.productsService.setFichaTecnica(id, file.filename, file.originalname);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id/ficha-tecnica')
  removeFichaTecnica(@Param('id') id: string) {
    return this.productsService.removeFichaTecnica(id);
  }

  // Apenas SUPER_ADMIN gere o catálogo de produtos
  @Roles(Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // Todos os papéis autenticados podem consultar produtos
  @Get()
  findAll(@Query('category') category: string) {
    return this.productsService.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.productsService.deactivate(id);
  }
}
