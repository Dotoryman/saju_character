import { getArchetype } from "./archetypes";
import { getCharacterProfile } from "./characterProfiles";

export const THEMES = [
  { slug: "one-piece", displayName: "ONE PIECE", symbol: "☠" },
  { slug: "naruto", displayName: "NARUTO", symbol: "忍" },
  { slug: "inuyasha", displayName: "INUYASHA", symbol: "月" },
  { slug: "ghibli", displayName: "STUDIO GHIBLI", symbol: "風" },
] as const;

export type ThemeSlug = (typeof THEMES)[number]["slug"];

export interface CharacterResult {
  theme: ThemeSlug;
  themeName: string;
  characterName: string;
  tagline: string;
  description: string;
  imageKey?: string;
}

interface PillarCharacterNames {
  ganjiKr: string;
  "one-piece": string;
  naruto: string;
  inuyasha: string;
  ghibli: string;
}

// 일주 이름을 기준으로 읽고 검수할 수 있는 60개의 명시적 매핑입니다.
export const PILLAR_CHARACTER_MAPPINGS: PillarCharacterNames[] = [
  { ganjiKr: "갑자", "one-piece": "징베", naruto: "야마토", inuyasha: "지넨지", ghibli: "아시타카" },
  { ganjiKr: "을축", "one-piece": "쵸파", naruto: "하쿠", inuyasha: "링", ghibli: "소피" },
  { ganjiKr: "병인", "one-piece": "루피", naruto: "나루토", inuyasha: "이누야샤", ghibli: "포르코" },
  { ganjiKr: "정묘", "one-piece": "나미", naruto: "쿠레나이", inuyasha: "싯포", ghibli: "지지" },
  { ganjiKr: "무진", "one-piece": "카이도", naruto: "가아라", inuyasha: "류코츠세이", ghibli: "숲의 신" },
  { ganjiKr: "기사", "one-piece": "크로커다일", naruto: "가아라", inuyasha: "쟈코츠", ghibli: "유바바" },
  { ganjiKr: "경오", "one-piece": "조로", naruto: "사스케", inuyasha: "셋쇼마루", ghibli: "하울" },
  { ganjiKr: "신미", "one-piece": "로빈", naruto: "이노", inuyasha: "아야메", ghibli: "나우시카" },
  { ganjiKr: "임신", "one-piece": "로우", naruto: "키사메", inuyasha: "호센키", ghibli: "포뇨" },
  { ganjiKr: "계유", "one-piece": "비비", naruto: "사이", inuyasha: "키쿄우", ghibli: "치히로" },
  { ganjiKr: "갑술", "one-piece": "샹크스", naruto: "지라이야", inuyasha: "코우가", ghibli: "아시타카" },
  { ganjiKr: "을해", "one-piece": "시라호시", naruto: "코난", inuyasha: "카고메", ghibli: "아리에티" },
  { ganjiKr: "병자", "one-piece": "에이스", naruto: "이타치", inuyasha: "이누야샤", ghibli: "캘시퍼" },
  { ganjiKr: "정축", "one-piece": "쵸파", naruto: "히나타", inuyasha: "카에데", ghibli: "오소노" },
  { ganjiKr: "무인", "one-piece": "가프", naruto: "츠나데", inuyasha: "투아왕", ghibli: "에보시" },
  { ganjiKr: "기묘", "one-piece": "캐럿", naruto: "사쿠라", inuyasha: "링", ghibli: "메이" },
  { ganjiKr: "경진", "one-piece": "킹", naruto: "카쿠즈", inuyasha: "반코츠", ghibli: "가마 할아범" },
  { ganjiKr: "신사", "one-piece": "보아 핸콕", naruto: "오로치마루", inuyasha: "하쿠도시", ghibli: "남작" },
  { ganjiKr: "임오", "one-piece": "키드", naruto: "킬러 비", inuyasha: "나라쿠", ghibli: "하울" },
  { ganjiKr: "계미", "one-piece": "코비", naruto: "시즈네", inuyasha: "카고메", ghibli: "시즈쿠" },
  { ganjiKr: "갑신", "one-piece": "마르코", naruto: "사스케", inuyasha: "코하쿠", ghibli: "나우시카" },
  { ganjiKr: "을유", "one-piece": "타시기", naruto: "코난", inuyasha: "산고", ghibli: "산" },
  { ganjiKr: "병술", "one-piece": "에이스", naruto: "데이다라", inuyasha: "이누야샤", ghibli: "캘시퍼" },
  { ganjiKr: "정해", "one-piece": "코알라", naruto: "코난", inuyasha: "키쿄우", ghibli: "하쿠" },
  { ganjiKr: "무자", "one-piece": "징베", naruto: "킬러 비", inuyasha: "묘가", ghibli: "토토로" },
  { ganjiKr: "기축", "one-piece": "야마토", naruto: "시카마루", inuyasha: "카에데", ghibli: "오소노" },
  { ganjiKr: "경인", "one-piece": "조로", naruto: "카카시", inuyasha: "셋쇼마루", ghibli: "산" },
  { ganjiKr: "신묘", "one-piece": "캐번디시", naruto: "테마리", inuyasha: "카구라", ghibli: "시타" },
  { ganjiKr: "임진", "one-piece": "카이도", naruto: "토비라마", inuyasha: "류코츠세이", ghibli: "하쿠" },
  { ganjiKr: "계사", "one-piece": "시저", naruto: "카부토", inuyasha: "나라쿠", ghibli: "가오나시" },
  { ganjiKr: "갑오", "one-piece": "코즈키 오뎅", naruto: "마이트 가이", inuyasha: "투아왕", ghibli: "파즈" },
  { ganjiKr: "을미", "one-piece": "레베카", naruto: "이노", inuyasha: "링", ghibli: "하루" },
  { ganjiKr: "병신", "one-piece": "사보", naruto: "미나토", inuyasha: "미로쿠", ghibli: "지로" },
  { ganjiKr: "정유", "one-piece": "상디", naruto: "사소리", inuyasha: "카구라", ghibli: "하울" },
  { ganjiKr: "무술", "one-piece": "흰수염", naruto: "오오노키", inuyasha: "토토사이", ghibli: "토토로" },
  { ganjiKr: "기해", "one-piece": "우솝", naruto: "이루카", inuyasha: "묘가", ghibli: "무타" },
  { ganjiKr: "경자", "one-piece": "쿠잔", naruto: "자부자", inuyasha: "반코츠", ghibli: "산" },
  { ganjiKr: "신축", "one-piece": "모네", naruto: "하쿠", inuyasha: "칸나", ghibli: "소피" },
  { ganjiKr: "임인", "one-piece": "징베", naruto: "키사메", inuyasha: "코우가", ghibli: "모로" },
  { ganjiKr: "계묘", "one-piece": "비비", naruto: "시노", inuyasha: "카고메", ghibli: "사츠키" },
  { ganjiKr: "갑진", "one-piece": "몽키 D. 드래곤", naruto: "하시라마", inuyasha: "투아왕", ghibli: "숲의 신" },
  { ganjiKr: "을사", "one-piece": "보아 핸콕", naruto: "오로치마루", inuyasha: "쟈켄", ghibli: "아리에티" },
  { ganjiKr: "병오", "one-piece": "루피", naruto: "나루토", inuyasha: "이누야샤", ghibli: "캘시퍼" },
  { ganjiKr: "정미", "one-piece": "상디", naruto: "사쿠라", inuyasha: "산고", ghibli: "카구야 공주" },
  { ganjiKr: "무신", "one-piece": "바솔로뮤 쿠마", naruto: "마다라", inuyasha: "긴코츠", ghibli: "에보시" },
  { ganjiKr: "기유", "one-piece": "나미", naruto: "텐텐", inuyasha: "코하쿠", ghibli: "키키" },
  { ganjiKr: "경술", "one-piece": "미호크", naruto: "카카시", inuyasha: "반코츠", ghibli: "아시타카" },
  { ganjiKr: "신해", "one-piece": "로빈", naruto: "사이", inuyasha: "키쿄우", ghibli: "치히로" },
  { ganjiKr: "임자", "one-piece": "검은수염", naruto: "토비라마", inuyasha: "나라쿠", ghibli: "포뇨" },
  { ganjiKr: "계축", "one-piece": "쿠잔", naruto: "단조", inuyasha: "하쿠도시", ghibli: "가오나시" },
  { ganjiKr: "갑인", "one-piece": "골 D. 로저", naruto: "하시라마", inuyasha: "투아왕", ghibli: "모로" },
  { ganjiKr: "을묘", "one-piece": "캐럿", naruto: "히나타", inuyasha: "링", ghibli: "메이" },
  { ganjiKr: "병진", "one-piece": "아카이누", naruto: "마다라", inuyasha: "류코츠세이", ghibli: "캘시퍼" },
  { ganjiKr: "정사", "one-piece": "보아 핸콕", naruto: "이타치", inuyasha: "카구라", ghibli: "유바바" },
  { ganjiKr: "무오", "one-piece": "흰수염", naruto: "킬러 비", inuyasha: "고신키", ghibli: "토토로" },
  { ganjiKr: "기미", "one-piece": "빅 맘", naruto: "쵸지", inuyasha: "카에데", ghibli: "오소노" },
  { ganjiKr: "경신", "one-piece": "프랑키", naruto: "4대 라이카게", inuyasha: "셋쇼마루", ghibli: "라퓨타 로봇병" },
  { ganjiKr: "신유", "one-piece": "미호크", naruto: "사소리", inuyasha: "유라", ghibli: "하울" },
  { ganjiKr: "임술", "one-piece": "카타쿠리", naruto: "페인", inuyasha: "나라쿠", ghibli: "모로" },
  { ganjiKr: "계해", "one-piece": "쿠잔", naruto: "오비토", inuyasha: "칸나", ghibli: "가오나시" },
];

const FEATURED_REASONS: Record<string, string> = {
  "병술|one-piece": "메마른 대지를 비추는 태양처럼 에이스의 불꽃과 의리는 멀리까지 뜨겁습니다.",
  "병술|naruto": "불과 흙이 만나면 폭발합니다. 조용히 끝낼 생각이 없는 예술가가 병술과 맞습니다.",
  "병술|ghibli": "작은 불씨가 황야 전체를 움직일 힘이 되는 반전이 캘시퍼와 겹칩니다.",
  "무진|naruto": "대지와 모래를 거대한 방벽으로 세우는 가아라가 무진의 산 같은 무게를 보여줍니다.",
  "경진|ghibli": "쇳소리와 불이 쉬지 않는 보일러실의 장인이라 경진의 금속과 산 기운에 잘 맞습니다.",
  "임진|naruto": "큰 물을 자유롭게 일으키고 빠르게 판을 정리하는 토비라마가 임진의 흐름과 맞습니다.",
  "임진|ghibli": "강의 이름을 지닌 용 하쿠가 물에서 하늘로 오르는 임진의 장면과 정확히 겹칩니다.",
  "갑진|naruto": "하늘까지 숲을 일으키는 목둔과 큰 포용력이 갑진의 거목을 그대로 완성합니다.",
  "갑인|naruto": "거대한 숲을 만드는 목둔과 생명력이 갑인의 원시림과 가장 직접적으로 맞습니다.",
  "기사|one-piece": "뜨겁고 마른 모래를 지배하는 크로커다일은 기사 물상의 거의 그대로인 인물입니다.",
  "경인|naruto": "번개 칼날과 냉정한 판단을 함께 쓰는 카카시가 경인의 금목 충돌을 완성합니다.",
  "경신|one-piece": "강철 몸과 거대한 기술을 유쾌하게 다루는 프랑키가 경신의 금속성을 살립니다.",
  "경신|inuyasha": "완성된 검기와 대요괴의 위엄이 거대한 철광석처럼 단단하고 서늘합니다.",
  "임자|one-piece": "바닥을 알 수 없는 어둠과 거대한 욕망이 한겨울 대양처럼 모든 것을 삼킵니다.",
  "무신|inuyasha": "강철 갑옷과 온몸의 무기를 지닌 긴코츠는 철광산이 걸어 나온 듯한 인상을 줍니다.",
  "신축|one-piece": "눈보라와 날카로운 발톱을 지닌 모네가 얼어붙은 보석의 차가운 광택과 맞습니다.",
};

const CONNECTIONS = [
  (name: string, archetype: string, animal: string) => `${archetype}의 장면에서 ${name}의 힘은 ${animal}처럼 중심을 지킵니다.`,
  (name: string, archetype: string, animal: string) => `${name}의 선택과 움직임은 ${archetype}이 품은 ${animal}의 기세를 떠올리게 합니다.`,
  (name: string, archetype: string, animal: string) => `${archetype}의 온도와 속도는 ${name}에게서 보이는 ${animal}의 본능과 이어집니다.`,
  (name: string, archetype: string, animal: string) => `${name}가 보여주는 반전은 ${archetype} 속 ${animal}의 숨은 힘을 선명하게 만듭니다.`,
  (name: string, archetype: string, animal: string) => `${archetype}의 거친 면과 부드러운 면을 ${name}와 ${animal}이 함께 설명해 줍니다.`,
  (name: string, archetype: string, animal: string) => `${name}의 버티는 방식은 ${archetype}을 살아가는 ${animal}의 모습과 닮았습니다.`,
  (name: string, archetype: string, animal: string) => `${archetype}에서 가장 먼저 느껴지는 결이 ${name}의 태도와 ${animal}의 이미지에 겹칩니다.`,
  (name: string, archetype: string, animal: string) => `${name}의 고유한 능력이 ${archetype}과 만나 ${animal}다운 결과를 완성합니다.`,
] as const;

export function getCharacterResults(cycleIndex: number): CharacterResult[] {
  const pillar = PILLAR_CHARACTER_MAPPINGS[cycleIndex];
  const archetype = getArchetype(cycleIndex);
  if (!pillar) throw new Error(`Missing character mappings at ${cycleIndex}`);

  return THEMES.map((theme, themeIndex) => {
    const characterName = pillar[theme.slug];
    const profile = getCharacterProfile(theme.slug, characterName);
    const key = `${pillar.ganjiKr}|${theme.slug}`;
    const connectionBuilder = CONNECTIONS[(cycleIndex + themeIndex * 2) % CONNECTIONS.length] ?? CONNECTIONS[0];
    const connection = FEATURED_REASONS[key]
      ?? connectionBuilder(characterName, archetype.archetypeName, archetype.animalName);

    return {
      theme: theme.slug,
      themeName: theme.displayName,
      characterName,
      tagline: profile.tagline,
      description: `${profile.description} ${connection}`,
      imageKey: `/media/characters/${encodeURIComponent(theme.slug)}/${encodeURIComponent(characterName)}`,
    };
  });
}
