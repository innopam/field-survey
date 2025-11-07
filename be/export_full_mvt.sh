#!/bin/bash

# PostGIS에서 전체 데이터를 하나의 MVT로 생성하는 스크립트
# 사용법: ./export_full_mvt.sh [id_pattern]

ID_PATTERN="${1:-48840370%}"
MVT_FILE="farm_map_${ID_PATTERN//%/}_full.mvt"

echo "=== Farm Map 전체 MVT 생성 ==="
echo "ID 패턴: $ID_PATTERN"
echo "출력 파일: $MVT_FILE"
echo "=============================="

# .env 파일에서 DB 연결 정보 읽기
DB_HOST=$(grep "^DATABASE_HOST=" .env | cut -d'=' -f2)
DB_PORT=$(grep "^DATABASE_PORT=" .env | cut -d'=' -f2)
DB_USER=$(grep "^DATABASE_USERNAME=" .env | cut -d'=' -f2)
DB_PASS=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2)
DB_NAME=$(grep "^DATABASE_NAME=" .env | cut -d'=' -f2)

echo "📊 데이터베이스 연결 중... ($DB_HOST:$DB_PORT/$DB_NAME)"

# 전체 데이터를 바운딩 박스로 하는 MVT 생성
MVT_QUERY="
WITH bounds AS (
    SELECT ST_Transform(ST_SetSRID(ST_Extent(geom), 5179), 3857) as bbox
    FROM farm_map 
    WHERE id LIKE '$ID_PATTERN'
),
mvt_data AS (
    SELECT 
        id,
        pnu,
        clsf_nm,
        stdg_addr,
        area,
        ST_AsMVTGeom(
            ST_Transform(ST_SetSRID(geom, 5179), 3857),
            (SELECT bbox FROM bounds),
            4096,
            64,
            true
        ) AS geom
    FROM farm_map 
    WHERE id LIKE '$ID_PATTERN'
)
SELECT ST_AsMVT(mvt_data, 'farm_map', 4096, 'geom') 
FROM mvt_data 
WHERE geom IS NOT NULL;
"

echo "🎯 전체 데이터 MVT 생성 중..."

PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -o "$MVT_FILE" -c "$MVT_QUERY" 2>/dev/null

if [ $? -eq 0 ]; then
    FILE_SIZE=$(wc -c < "$MVT_FILE" 2>/dev/null || echo "0")
    
    if [ $FILE_SIZE -gt 0 ]; then
        echo "✅ MVT 파일이 성공적으로 생성되었습니다!"
        echo "📁 파일: $MVT_FILE"
        echo "📏 크기: ${FILE_SIZE} bytes"
        
        # 피처 수 확인
        FEATURE_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM farm_map WHERE id LIKE '$ID_PATTERN';" 2>/dev/null)
        echo "🗺️  총 피처 개수: $FEATURE_COUNT"
        
        # 헥스 덤프로 MVT 헤더 확인 (옵션)
        echo ""
        echo "🔍 MVT 파일 헤더 (처음 100바이트):"
        xxd -l 100 "$MVT_FILE" 2>/dev/null || hexdump -C "$MVT_FILE" | head -5
        
    else
        echo "⚠️  MVT 파일이 생성되었지만 크기가 0입니다."
    fi
else
    echo "❌ 오류: MVT 생성에 실패했습니다."
    exit 1
fi

echo "=============================="
echo "🎉 전체 MVT 생성 완료!"