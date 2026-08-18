# saju_character

닉네임과 양력 생년월일로 일주를 계산하고, 대표 동물과 네 가지 세계관의 닮은
캐릭터를 보여주는 모바일 우선 웹서비스입니다.

- 서비스 도메인: `sajusaju.cloud`
- GitHub repository: `saju_character`
- Cloudflare Worker: `ganji-character-discovery`

이 서비스는 운세를 예측하거나 절대적인 사주 판정을 제공하지 않습니다. 60갑자의
자연물·오행·음양 이미지를 동물과 캐릭터에 연결한 콘텐츠형 서비스입니다.

## 기술 구성

- TypeScript, React, Vite
- Cloudflare Vite Plugin, Workers Static Assets
- Cloudflare Worker API
- Cloudflare D1, R2
- Vitest

프론트엔드와 Worker API는 하나의 Cloudflare 배포 단위로 빌드됩니다.

## 로컬 실행

```bash
npm install
npm run cf-typegen
npm run db:migrate:local
npm run dev
```

기본 개발 주소는 `http://localhost:5173`입니다. 로컬 D1 데이터는 `.wrangler/`에
저장되며 Git에 포함되지 않습니다.

## 검증

```bash
npm run typecheck
npm test
npm run build
npm run deploy:dry
```

일주 계산 모듈은 `src/domain/saju/`에 있으며 UI 및 Worker 라우팅과 분리되어
있습니다. 기준일과 교차 검증 날짜를 단위 테스트로 관리합니다.

## D1

마이그레이션은 `migrations/`에서 순서대로 관리합니다.

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

운영 D1 데이터베이스는 `ganji-character-db`이며 Worker의 `DB` binding으로
연결됩니다. Worker 안에서는 REST API가 아닌 binding으로만 접근합니다.

## 이미지와 R2

캐릭터 초상 이미지는 AniList의 캐릭터 메타데이터로 129개 고유 캐릭터를 매핑하고,
Worker의 동일 출처 `/media/characters/*` 경로로 제공합니다. 최초 요청 시 원본을
가져와 R2에 캐시하므로 이후 요청은 `ganji-character-assets`에서 처리됩니다. 매핑
생성 스크립트는 `scripts/fetch-character-images.mjs`, 검수 자료는
`docs/character-image-audit.json`에서 관리합니다.

운영 R2 버킷은 `ganji-character-assets`이며 `ASSETS_BUCKET` binding으로
연결됩니다. 승인된 이미지와 서비스 일러스트를 이 버킷에 보관합니다. 공유 PNG는
우선 클라이언트에서 생성하므로 MVP 단계에서 결과 이미지를 R2에 영구 저장하지
않습니다.

## 환경변수와 비밀값

로컬 비밀값은 `.dev.vars` 또는 `.env`에 두고 Git에 커밋하지 않습니다. Kakao
JavaScript Key는 준비된 뒤 아래 환경변수로 연결합니다.

```text
VITE_KAKAO_JAVASCRIPT_KEY=
```

운영 비밀값은 `wrangler secret put`으로 등록합니다.

## 배포

1. 원격 D1 migration 적용
2. `npm run deploy:dry`
3. `npm run deploy`
4. Worker Custom Domain에 `sajusaju.cloud` 연결

Cloudflare DNS에서 도메인이 활성화된 뒤 Worker의 Custom Domain으로 연결합니다.
GitHub 연동 배포를 사용할 경우 저장소 `saju_character`의 `main` 브랜치를 production
브랜치로 설정합니다.

## 현재 제공 기능

- 닉네임과 양력 생년월일 입력
- 서버 기준 일주 계산
- 60갑자 archetype과 꾸밈말 없는 대표 동물 1개
- ONE PIECE, Naruto, Inuyasha, Studio Ghibli 캐릭터 매칭
- 공개 결과 고유 URL
- 반응형 생년월일 선택 UI와 캐릭터 중심 결과 카드
- 원본 해상도 이내로 표시하는 캐릭터 이미지 품질 보호
- 일주와 대표 동물만 보여주는 간결한 결과 요약 배너
- 캐릭터 초상이 포함된 1080×1350 결과 PNG 저장
- Open Graph·카카오 링크 미리보기 이미지와 캐릭터 파비콘
- 공개 응답 단계의 닉네임·생년월일 masking
- cursor 기반 Explore 피드
- 모바일 Web Share 및 URL 복사 fallback
- 1080×1350 공유 PNG 생성 및 다운로드 fallback
- 공유 횟수 집계와 Kakao SDK adapter
- 연도·월·일 선택형 생년월일 입력
- 결과 설명과 캐릭터 확인 후 공유하는 화면 흐름
- 129개 고유 캐릭터 초상 이미지와 R2 자동 캐시
- 반응형 레이아웃과 reduced-motion 대응

## 다음 단계

- 캐릭터별 전용 설명 240개 고도화
- 캐릭터 중심 이미지 검토 및 `imageKey` 연결
- 카카오 JavaScript Key 발급 후 실제 SDK 연결
- 사용자 검토 이미지로 캐릭터 초상 교체
- 캐릭터별 전용 설명 240개 콘텐츠 검수
