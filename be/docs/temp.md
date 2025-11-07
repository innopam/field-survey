알겠습니다. 배경 지도와 BE의 버전 관리/MVT 생성을 제외하고, **오직 '조사 지역 MVT'의 오프라인 관리**에만 집중하여 문서를 다시 정리했습니다.

---

# 🗺️ 프로젝트: 오프라인 MVT 조사 지역 PWA (v-Lite)

> **프로젝트 목표 (Project Objective)**
>
> `DevOps` 파이프라인을 통해 제공되는 MVT(조사 지역)를 오프라인 PWA 환경에서 다운로드, 렌더링, 버전 관리하는 기능에 집중한다.

---

## 1. 기술 스택 (Tech Stack)

### Frontend
* **Framework:** ReactJS (with Vite)
* **Language:** TypeScript
* **Template:** `react-ts-swc`
* **Offline:** PWA (`vite-plugin-pwa`)
* **Map:** Openlayers
* **Local DB:** Dexie.js (`IndexedDB` Wrapper)

### Backend (DevOps Provided)
* **MVT Hosting:** 정적 스토리지 (S3, GCS 등)
* **Version Info:** `version.json` 파일 (정적 파일)
    * (BE 구현 대신, `DevOps` 파이프라인이 MVT 빌드 시 `version.json`을 생성하여 스토리지에 함께 배포하는 것을 전제로 함)

---

## 2. 핵심 아키텍처 및 전략

### 1. 문제: 대용량 `GeoJSON` 렌더링 성능
* **해결:** `MVT (Mapbox Vector Tiles)` 사용. (DevOps에서 제공)
* **구현:**
    * (FE) `Openlayers`의 `VectorTileLayer`를 사용해 정적 스토리지에 호스팅된 `.pbf` 타일을 로드.
    * (FE) MVT 스타일링 (`ol/style/Style`).

### 2. 문제: 오프라인 접근 (App Shell & MVT Data)

#### A. 앱 셸 (App Shell) 오프라인
* **대상:** React 앱 코드 (JS, CSS, HTML 등)
* **전략:** **사전 캐싱 (Pre-caching)**
* **구현:** `vite-plugin-pwa` (Workbox)가 앱 빌드 시 서비스 워커를 통해 리소스를 '캐시 스토리지'에 자동 저장.

#### B. MVT 데이터 (조사 지역) 오프라인
* **대상:** MVT(`.pbf`) 타일.
* **전략:** **동적 캐싱 (Dynamic Caching)**. 사용자가 앱 내에서 "지역 다운로드" 버튼을 눌렀을 때만 작동.
* **구현:**
    1.  **`IndexedDB` (by `dexie.js`):** '메타데이터' 관리용.
        * `{ areaId: 'seoul', version: '1.3', status: 'downloaded' }`
        * `{ areaId: 'busan', version: '1.1', status: 'pending' }`
    2.  **`Cache Storage API`:** '실제 타일 파일'(`.pbf`) 저장용.
        * `cache.addAll(urlsToCache)`를 수동으로 호출하여 MVT 타일 수천 개를 다운로드 및 저장.
        * 캐시 이름은 버전과 결합 (예: `seoul-mvt-v1.3`)

### 3. 문제: 데이터 동기화 (버전 관리)
* **해결:** FE 앱이 로컬 버전(`IndexedDB`)과 정적 `version.json` 파일을 비교하여 수동으로 업데이트.
* **구현:**
    * (DevOps) MVT 타일 빌드 시, 최신 버전 정보가 담긴 `version.json` 파일을 생성하여 MVT와 동일한 스토리지에 배포.
        * (예: `GET .../version.json` -> `{"seoul": "1.3", "busan": "1.1"}`)
    * (FE) 앱이 온라인일 때, 로컬 `IndexedDB`의 버전과 `version.json` 파일의 버전을 비교.
    * (FE) 업데이트가 감지되면, 사용자에게 알림.
    * (FE) 사용자가 승인하면, `2-B`의 '동적 캐싱' 프로세스를 실행하여 **새 버전** 캐시(예: `seoul-mvt-v1.4`)를 생성.
    * (FE) 다운로드가 100% 완료되면 `IndexedDB` 메타데이터를 `v1.4`로 업데이트.
    * (FE) 저장 공간 확보를 위해 `caches.delete('seoul-mvt-v1.3')`를 호출하여 **구(舊) 버전** 캐시를 명시적으로 삭제.

---

## 3. AI MCP / 작업 목록 (Action Items)

### [Frontend / App]
* [ ] `Vite (react-ts-swc)` + `PWA` + `Openlayers` + `Dexie` 환경 설정
* [ ] **PWA:** 서비스 워커 등록 및 앱 셸 캐싱 확인
* [ ] **IndexedDB:** `dexie.js` 스키마 정의 (조사 지역 메타데이터 테이블)
* [ ] **Openlayers:**
    * [ ] 기본 지도 컴포넌트 생성
    * [ ] MVT 레이어(`VectorTileLayer`) 추가 및 `url` 설정
    * [ ] MVT 스타일링 (`ol/style/Style`) 함수 작성
* [ ] **오프라인 다운로드 매니저 (핵심 로직):**
    * [ ] 지역 선택 UI 구현
    * [ ] MVT 타일 URL 목록 생성 로직 구현 (줌 레벨, 영역 기반)
    * [ ] `cache.addAll()`을 호출하는 다운로드 서비스 구현
    * [ ] 다운로드 성공/실패 시 `IndexedDB` 상태 업데이트 로직 구현
* [ ] **업데이트 매니저 (핵심 로직):**
    * [ ] 앱 로드 시 `version.json` 파일 `fetch`
    * [ ] `version.json`과 `IndexedDB` 버전 비교
    * [ ] 업데이트 필요 알림 UI
    * [ ] 구(舊) 버전 캐시 삭제 (`caches.delete`) 로직 구현

### [DevOps / Infra] (FE 작업은 아님)
* [ ] `tippecanoe` MVT 변환 파이프라인
* [ ] MVT 빌드 시 `version.json` 자동 생성
* [ ] MVT 타일셋 및 `version.json` 정적 스토리지 배포