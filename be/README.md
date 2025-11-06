# NestJS Boilerplate Project

NestJS 시작할때 필요한

1. .env
2. repl
3. logger
4. database

설정을 완료한 상태입니다.

## database migration 설명

1. entity 만들기 : 경로 `src/database/entities/` 에 entity 파일을 생성합니다.
2. migration 생성하기 : `yarn typeorm:migration:generate` 실행하여 `typeorm/migration` 에 migration 파일을 생성합니다.
3. migration 실행하기 : `yarn typeorm:migration:run` 으로 migration 을 적용합니다.

## 추가적인 package.json script 설명

### 개발 시

1. `yarn schema:drop` : 데이터베이스 스키마를 삭제합니다. (drop view, drop table 등)
2. `yarn schema:sync` : 데이터베이스 스키마를 동기화합니다. (entities 에 작성된 스키마를 데이터베이스에 동기화)
3. `yarn typeorm-extension seed:run -n CreateDevelopmentSeeder` : 개발 시드를 실행합니다.

다음을 실행하여 개발을 편리하게 할 수 있습니다. 모든 데이터베이스 스키마를 drop 후, 다시 동기화(생성)하고, 시드를 실행합니다. 그러면 원하는 데이터베이스 스키마와 데이터를 생성할 수 있습니다.

```sh
yarn schema:drop && yarn schema:sync && yarn typeorm-extension seed:run -n CreateDevelopmentSeeder
```

### 마이그레이션

> `yarn typeorm` 를 호출하여 더 많은 명령어를 확인할 수 있습니다.

1. `yarn migration:generate` : 데이터베이스 상의 스키마와 현재 entity 상태를 비교하여 migration 파일을 생성합니다.
2. `yarn migration:run` : migration 파일을 실행합니다.
3. `yarn migration:show` : migration 파일을 삭제합니다.
