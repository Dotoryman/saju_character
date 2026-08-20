import { getCharacterProfile } from "./characterProfiles";
import { CHARACTER_MATCH_REASONS } from "./characterMatchReasons";

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

export function getCharacterResults(cycleIndex: number): CharacterResult[] {
  const pillar = PILLAR_CHARACTER_MAPPINGS[cycleIndex];
  if (!pillar) throw new Error(`Missing character mappings at ${cycleIndex}`);

  return THEMES.map((theme, themeIndex) => {
    const characterName = pillar[theme.slug];
    const profile = getCharacterProfile(theme.slug, characterName);
    const connection = CHARACTER_MATCH_REASONS[pillar.ganjiKr]?.[themeIndex];
    if (!connection) throw new Error(`Missing match reason for ${pillar.ganjiKr}/${theme.slug}`);

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
