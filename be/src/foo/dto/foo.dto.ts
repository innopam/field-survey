import { Type } from 'class-transformer';
import { IsNumber, IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';

export class BboxQueryDto {
    @IsNumber()
    @Type(() => Number)
    minX: number;

    @IsNumber()
    @Type(() => Number)
    minY: number;

    @IsNumber()
    @Type(() => Number)
    maxX: number;

    @IsNumber()
    @Type(() => Number)
    maxY: number;
}

// 필지 정보 응답 DTO
export class FarmMapResponseDto {
    id: number;
    pnu: string;
    clsfNm?: string;
    stdgAddr?: string;
    area?: number;
    geom: string; // GeoJSON 형태로 반환
    hasFoo: boolean; // FOO 데이터 존재 여부
}

export class CreateFooCropDto {
    @IsString()
    cropCode: string;
}

export class CreateFooDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFooCropDto)
    crops: CreateFooCropDto[];
}

export class UpdateFooDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFooCropDto)
    crops?: CreateFooCropDto[];
}

export class FarmMapDto {
    id: number;
    uid?: string;
    clsfNm?: string;
    clsfCd?: string;
    stdgCd?: string;
    stdgAddr?: string;
    pnu: string;
    ldcgCd?: string;
    area?: number;
    sourceNm?: string;
    layer?: string;
}

export class FooResponseDto {
    id: number;
    farmMapId: number;
    pnu: string;
    year: number;
    createdAt: Date;
    deletedAt?: Date;
    farmMap?: FarmMapDto;
    photos: {
        id: number;
        filePath: string;
    }[];
    crops: {
        id: number;
        cropCode: string;
    }[];
}