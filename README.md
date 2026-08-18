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
- Cloudflare D1
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

실제 배포 전에 Cloudflare에서 D1 데이터베이스를 생성하고 `wrangler.jsonc`의
`database_id`에 발급된 ID를 넣어야 합니다. Worker 안에서는 REST API가 아닌
`DB` binding으로만 접근합니다.

## 이미지와 R2

현재 UI는 이미지가 없어도 동작하는 문자 기반 placeholder를 사용합니다. 추후
캐릭터가 선명하게 보이는 세로형 또는 투명 배경 이미지를 검토한 뒤 `imageKey`로
연결합니다. 검토 전 파일은 `public/assets/references/`, 승인된 실제 자산은
`public/assets/characters/`에 둡니다.

R2는 승인된 원본 이미지가 많아질 때 추가합니다. 공유 PNG는 우선 클라이언트에서
생성하므로 MVP 단계에서 결과 이미지를 R2에 영구 저장하지 않습니다.

## 환경변수와 비밀값

로컬 비밀값은 `.dev.vars` 또는 `.env`에 두고 Git에 커밋하지 않습니다. Kakao
JavaScript Key는 준비된 뒤 아래 환경변수로 연결합니다.

```text
VITE_KAKAO_JAVASCRIPT_KEY=
```

운영 비밀값은 `wrangler secret put`으로 등록합니다.

## 배포

1. Cloudflare D1 데이터베이스 생성
2. `wrangler.jsonc`에 실제 D1 ID 반영
3. 원격 migration 적용
4. `npm run deploy:dry`
5. `npm run deploy`
6. Worker Custom Domain에 `sajusaju.cloud` 연결

Cloudflare DNS에서 도메인이 활성화된 뒤 Worker의 Custom Domain으로 연결합니다.
GitHub 연동 배포를 사용할 경우 저장소 `saju_character`의 `main` 브랜치를 production
브랜치로 설정합니다.

## 현재 제공 기능

- 닉네임과 양력 생년월일 입력
- 서버 기준 일주 계산
- 60갑자 archetype과 꾸밈말 없는 대표 동물 1개
- ONE PIECE, Naruto, Inuyasha, Studio Ghibli 캐릭터 매칭
- 공개 결과 고유 URL
- 공개 응답 단계의 닉네임·생년월일 masking
- cursor 기반 Explore 피드
- 모바일 Web Share 및 URL 복사 fallback
- 반응형 레이아웃과 reduced-motion 대응

## 다음 단계

- 캐릭터별 전용 설명 240개 고도화
- 캐릭터 중심 이미지 검토 및 `imageKey` 연결
- 1080×1350 공유 PNG renderer
- Kakao 공유 adapter
- 원격 D1/R2와 Custom Domain 연결
