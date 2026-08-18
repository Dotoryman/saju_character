# 캐릭터 이미지 수집 원칙과 출처

이 문서는 개발·디자인 검토용 이미지 후보의 원본 위치를 기록한다. 후보 이미지는
서비스 공개 전에 사용자가 다시 검토하며, 승인된 파일만 production asset으로
이동한다.

## 보관 구조

- `public/assets/references/`: 검토 전 후보 이미지
- `public/assets/characters/`: 검토 후 실제 서비스 이미지
- 파일명은 `{theme}-{character}-{source-index}.{ext}` 형식을 사용한다.
- 이미지 URL을 화면이나 데이터 seed에 직접 넣지 않는다.

## 우선 수집처

### Studio Ghibli

- 공식 작품 이미지 안내: https://www.ghibli.jp/info/013344/
- 공식 작품 목록: https://www.ghibli.jp/works/
- 포뇨: https://www.ghibli.jp/works/ponyo/
- 센과 치히로의 행방불명: https://www.ghibli.jp/works/chihiro/
- 하울의 움직이는 성: https://www.ghibli.jp/works/howl/
- 이웃집 토토로: https://www.ghibli.jp/works/totoro/
- 원령공주: https://www.ghibli.jp/works/mononoke/

공식 사이트는 작품 정지 이미지를 별도로 제공하며 각 작품 페이지의 안내 문구도
함께 확인한다. 캐릭터별 단독 컷이 없는 경우 가장 식별이 잘 되는 장면을 고른다.

### Inuyasha

- 공식 애니메이션 사이트: https://www.ytv.co.jp/inuyasha/
- 공식 등장인물 이미지: https://www.ytv.co.jp/inuyasha/cast/2000_cast/index.html
- VIZ 공식 작품 페이지: https://www.viz.com/inuyasha

YTV 등장인물 페이지에서 제공하는 캐릭터별 이미지를 1순위 후보로 사용한다.

### ONE PIECE

- 공식 캐릭터 검색: https://one-piece.com/character/index.html
- 에이스 예시: https://one-piece.com/character/ace/index.html

공식 캐릭터 상세 페이지의 프로필 이미지를 1순위 후보로 기록한다.

### Naruto

- 공식 사이트: https://naruto-official.com/
- 공식 다운로드 이미지: https://naruto-official.com/en/special/wallpaper

다운로드 페이지는 개인 사용 범위 안내가 있으므로 현재는 검토 후보로만 분류한다.
서비스 공개용으로 자동 승격하지 않는다.

## 검토 상태

| 테마 | 후보 출처 확보 | 로컬 수집 | 공개 사용 승인 |
| --- | --- | --- | --- |
| Ghibli | 완료 | 진행 중 | 미검토 |
| Inuyasha | 완료 | 진행 중 | 미검토 |
| ONE PIECE | 완료 | 대기 | 미검토 |
| Naruto | 완료 | 대기 | 미검토 |

## 현재 내려받은 후보

없음. 초기 후보는 캐릭터가 선명하게 보이지 않는 장면이 포함되어 모두 제거했다.
이미지 수집을 재개할 때는 얼굴 또는 전신이 명확한 캐릭터 중심 이미지만 후보로
보관한다.

## 구현 규칙

캐릭터 데이터에는 파일 자체가 아닌 `imageKey`만 저장한다.

```ts
{
  theme: "one-piece",
  characterName: "에이스",
  imageKey: "one-piece/ace"
}
```

이미지가 아직 승인되지 않았거나 로딩에 실패하면 테마 색상, 캐릭터 이름, 심볼을
사용한 placeholder를 보여준다. 공유 PNG 생성도 이미지 없이 성공해야 한다.
