import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Res,
  Header,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { FooService } from './foo.service';
import { BboxQueryDto, CreateFooDto, FooResponseDto, FarmMapResponseDto } from './dto/foo.dto';

@Controller('foo')
export class FooController {
  constructor(private readonly fooService: FooService) {}

  // 1. BBOX 기준 필지 리스트 조회 (FOO 존재 여부 포함)
  @Get('farm-maps')
  async getFarmMapsByBbox(
    @Query(new ValidationPipe({ transform: true })) query: BboxQueryDto,
  ): Promise<FarmMapResponseDto[]> {
    return this.fooService.getFarmMapsByBbox(query);
  }

  // 2. 필지별 FOO 데이터 저장 (이미지 업로드 포함)
  @Post('farm-map/:farmMapId')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/images';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: async (req, file, cb) => {
          // 팜맵 정보를 가져와서 파일명 생성 (실제로는 서비스에서 처리)
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const filename = `temp_${timestamp}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async createFooWithImages(
    @Param('farmMapId', ParseIntPipe) farmMapId: number,
    @Body() createFooDto: CreateFooDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<FooResponseDto> {
    const uploadedFiles = files.map(file => file.path);
    return this.fooService.upsertFooByFarmMap(farmMapId, createFooDto, uploadedFiles);
  }

  // 3. FOO 데이터 엑셀 다운로드
  @Get('export/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="foo-data.xlsx"')
  async downloadExcel(@Res() res: Response): Promise<void> {
    const buffer = await this.fooService.generateExcel();
    res.send(buffer);
  }

  // 3. FOO 이미지들 ZIP 다운로드
  @Get('export/images-zip')
  @Header('Content-Type', 'application/zip')
  @Header('Content-Disposition', 'attachment; filename="foo-images.zip"')
  async downloadImagesZip(@Res() res: Response): Promise<void> {
    const buffer = await this.fooService.generateImagesZip();
    res.send(buffer);
  }
}