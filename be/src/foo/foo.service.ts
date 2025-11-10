import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { Repository } from "typeorm";
import { FarmMap } from "../database/entities/farm-map.entity";
import { FooCrop } from "../database/entities/foo-crop.entity";
import { FooPhoto } from "../database/entities/foo-photo.entity";
import { Foo } from "../database/entities/foo.entity";
import {
  BboxQueryDto,
  CreateFooDto,
  FarmMapResponseDto,
  FooResponseDto,
} from "./dto/foo.dto";
const archiver = require("archiver");

@Injectable()
export class FooService {
  constructor(
    @InjectRepository(Foo)
    private readonly fooRepository: Repository<Foo>,
    @InjectRepository(FooPhoto)
    private readonly fooPhotoRepository: Repository<FooPhoto>,
    @InjectRepository(FooCrop)
    private readonly fooCropRepository: Repository<FooCrop>,
    @InjectRepository(FarmMap)
    private readonly farmMapRepository: Repository<FarmMap>
  ) {}

  // 1. BBOX 기준으로 필지 리스트 조회 (FOO 존재 여부 포함)
  // 입력 좌표: EPSG:4326 (WGS84), 저장된 데이터: EPSG:5179 (Korea 2000 / Central Belt)
  async getFarmMapsByBbox(
    bboxQuery: BboxQueryDto
  ): Promise<FarmMapResponseDto[]> {
    const farmMaps = await this.farmMapRepository
      .createQueryBuilder("farmMap")
      .leftJoin("farmMap.foos", "foo", "foo.deletedAt IS NULL")
      // Count needs quoted identifiers in raw SQL to avoid Postgres lowercasing unquoted camelCase aliases
      .addSelect(
        'CASE WHEN COUNT("foo"."id") > 0 THEN true ELSE false END',
        "hasFoo"
      )
      // Quote the farmMap alias so ST_AsGeoJSON references the correct column
      .addSelect('ST_AsGeoJSON("farmMap"."geom")', "geojson")
      .where(
        `
        ST_Intersects(
          ST_Transform(ST_MakeEnvelope(:minX, :minY, :maxX, :maxY, 4326), 5179),
          "farmMap"."geom"
        )
      `,
        {
          minX: bboxQuery.minX,
          minY: bboxQuery.minY,
          maxX: bboxQuery.maxX,
          maxY: bboxQuery.maxY,
        }
      )
      .groupBy("farmMap.id")
      .getRawAndEntities();

    return farmMaps.entities.map((farmMap, index) => ({
      id: farmMap.id,
      pnu: farmMap.pnu,
      clsfNm: farmMap.clsfNm,
      stdgAddr: farmMap.stdgAddr,
      area: farmMap.area,
      geom: farmMaps.raw[index].geojson,
      hasFoo: farmMaps.raw[index].hasFoo,
    }));
  }

  // 2. 필지별 FOO 데이터 생성/업데이트 (기존 데이터 soft delete 후 upsert)
  async upsertFooByFarmMap(
    farmMapId: string,
    fooData: CreateFooDto,
    uploadedFiles: string[]
  ): Promise<FooResponseDto> {
    // 기존 FOO 데이터를 soft delete
    await this.fooRepository.softDelete({ farmMapId: farmMapId });

    // 팜맵 정보 조회
    const farmMap = await this.farmMapRepository.findOne({
      where: { id: farmMapId },
    });
    if (!farmMap) {
      throw new Error(`FarmMap with ID ${farmMapId} not found`);
    }

    // 새로운 FOO 생성
    const foo = this.fooRepository.create({
      farmMapId,
      pnu: farmMap.pnu,
      year: new Date().getFullYear(), // 현재 년도
    });

    const savedFoo = await this.fooRepository.save(foo);

    // 작물 정보 저장
    const crops = fooData.crops.map((crop) =>
      this.fooCropRepository.create({
        fooId: savedFoo.id,
        cropCode: crop.cropCode,
      })
    );
    await this.fooCropRepository.save(crops);

    // 업로드된 이미지 정보 저장
    const photos = uploadedFiles.map((filePath) =>
      this.fooPhotoRepository.create({
        fooId: savedFoo.id,
        filePath,
      })
    );
    await this.fooPhotoRepository.save(photos);

    // 저장된 데이터 조회
    const result = await this.fooRepository.findOne({
      where: { id: savedFoo.id },
      relations: ["photos", "crops", "farmMap"],
    });

    return this.mapToResponseDto([result])[0];
  }

  // 이미지 파일명 생성 (PNU + 주소 포함)
  generateImageFileName(farmMap: FarmMap, originalName: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const address = farmMap.stdgAddr || "no-address";
    const sanitizedAddress = address
      .replace(/[^\w\s-]/gi, "")
      .replace(/\s+/g, "_");

    return `${farmMap.pnu}_${sanitizedAddress}_${timestamp}${ext}`;
  }

  // 3. FOO 데이터 전체 엑셀 출력
  async generateExcel(): Promise<Buffer> {
    const foos = await this.fooRepository.find({
      relations: ["photos", "crops", "farmMap"],
      where: { deletedAt: null },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("FOO 데이터");

    // 헤더 설정
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "PNU", key: "pnu", width: 20 },
      { header: "연도", key: "year", width: 10 },
      { header: "생성일", key: "createdAt", width: 20 },
      { header: "지목명", key: "clsfNm", width: 15 },
      { header: "표준지 주소", key: "stdgAddr", width: 40 },
      { header: "면적", key: "area", width: 15 },
      { header: "작물 코드", key: "cropCodes", width: 30 },
      { header: "사진 개수", key: "photoCount", width: 15 },
    ];

    // 데이터 추가
    foos.forEach((foo) => {
      worksheet.addRow({
        id: foo.id,
        pnu: foo.pnu,
        year: foo.year,
        createdAt: foo.createdAt.toISOString().split("T")[0],
        clsfNm: foo.farmMap?.clsfNm || "",
        stdgAddr: foo.farmMap?.stdgAddr || "",
        area: foo.farmMap?.area || 0,
        cropCodes: foo.crops.map((c) => c.cropCode).join(", "),
        photoCount: foo.photos.length,
      });
    });

    // 스타일 적용
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // 3. FOO 등록된 이미지들 ZIP으로 다운로드
  async generateImagesZip(): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const archive = archiver("zip", { zlib: { level: 9 } });
        const buffers: Buffer[] = [];

        archive.on("data", (data) => buffers.push(data));
        archive.on("end", () => resolve(Buffer.concat(buffers)));
        archive.on("error", reject);

        // 모든 FOO 사진 조회
        const photos = await this.fooPhotoRepository.find({
          relations: ["foo", "foo.farmMap"],
          where: { foo: { deletedAt: null } },
        });

        for (const photo of photos) {
          if (fs.existsSync(photo.filePath)) {
            const fileName = path.basename(photo.filePath);
            const folderName =
              `${photo.foo.pnu}_${photo.foo.farmMap?.stdgAddr || "no-address"}`
                .replace(/[^\w\s-]/gi, "")
                .replace(/\s+/g, "_");
            archive.file(photo.filePath, { name: `${folderName}/${fileName}` });
          }
        }

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  private mapToResponseDto(foos: Foo[]): FooResponseDto[] {
    return foos.map((foo) => ({
      id: foo.id,
      farmMapId: foo.farmMapId,
      pnu: foo.pnu,
      year: foo.year,
      createdAt: foo.createdAt,
      deletedAt: foo.deletedAt,
      farmMap: foo.farmMap
        ? {
            id: foo.farmMap.id,
            uid: foo.farmMap.uid,
            clsfNm: foo.farmMap.clsfNm,
            clsfCd: foo.farmMap.clsfCd,
            stdgCd: foo.farmMap.stdgCd,
            stdgAddr: foo.farmMap.stdgAddr,
            pnu: foo.farmMap.pnu,
            ldcgCd: foo.farmMap.ldcgCd,
            area: foo.farmMap.area,
            sourceNm: foo.farmMap.sourceNm,
            layer: foo.farmMap.layer,
          }
        : undefined,
      photos: foo.photos
        ? foo.photos.map((photo) => ({
            id: photo.id,
            filePath: photo.filePath,
          }))
        : [],
      crops: foo.crops
        ? foo.crops.map((crop) => ({
            id: crop.id,
            cropCode: crop.cropCode,
          }))
        : [],
    }));
  }
}