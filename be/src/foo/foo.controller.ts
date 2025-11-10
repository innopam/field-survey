import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from "fs";
import { diskStorage } from 'multer';
import * as path from 'path';
import {
  BboxQueryDto,
  CreateFooDto,
  FarmMapResponseDto,
  FooResponseDto,
} from "./dto/foo.dto";
import { FooService } from "./foo.service";

@Controller("foo")
export class FooController {
  constructor(private readonly fooService: FooService) {}

  // 1. BBOX 기준 필지 리스트 조회 (FOO 존재 여부 포함)
  @Get("farm-maps")
  async getFarmMapsByBbox(
    @Query(new ValidationPipe({ transform: true })) query: BboxQueryDto
  ): Promise<{
    code: 200000;
    result: {
      farms: FarmMapResponseDto[];
    };
  }> {
    const farms = await this.fooService.getFarmMapsByBbox(query);
    return {
      code: 200000,
      result: { farms },
    };
  }

  // 2. 필지별 FOO 데이터 저장 (이미지 업로드 포함)
  @Post("farm-map/:farmMapId")
  @UseInterceptors(
    FilesInterceptor("images", 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = "./uploads/images";
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
    })
  )
  async createFooWithImages(
    @Param("farmMapId", ParseIntPipe) farmMapId: string,
    @Body() createFooDto: CreateFooDto,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<FooResponseDto> {
    const uploadedFiles = files.map((file) => file.path);
    return this.fooService.upsertFooByFarmMap(
      farmMapId,
      createFooDto,
      uploadedFiles
    );
  }

  // 3. FOO 데이터 엑셀 다운로드
  @Get("export/excel")
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  @Header("Content-Disposition", 'attachment; filename="foo-data.xlsx"')
  async downloadExcel(@Res() res: Response): Promise<void> {
    const buffer = await this.fooService.generateExcel();
    res.send(buffer);
  }

  // 3. FOO 이미지들 ZIP 다운로드
  @Get("export/images-zip")
  @Header("Content-Type", "application/zip")
  @Header("Content-Disposition", 'attachment; filename="foo-images.zip"')
  async downloadImagesZip(@Res() res: Response): Promise<void> {
    const buffer = await this.fooService.generateImagesZip();
    res.send(buffer);
  }
}