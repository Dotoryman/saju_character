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

const NARUTO = `야마토|하쿠|나루토|쿠레나이|초지|가아라|사스케|이노|키사메|사이|지라이야|코난|이타치|히나타|츠나데|사쿠라|카쿠즈|오로치마루|킬러 비|시즈네|사스케|코난|데이다라|우타카타|한|도다이|카카시|테마리|토비라마|카부토|마이트 가이|이노|미나토|사소리|오오노키|이루카|자부자|하쿠|키사메|시노|하시라마|미츠키|나루토|쵸쵸|3대 라이카게|텐텐|사쿠모|사이|토비라마|단조|하시라마|히나타|한조|이타치|킬러 비|쵸지|4대 라이카게|사소리|페인|오비토`.split("|");
const INUYASHA = `코우가|링|이누야샤|싯포|류코츠세이|쟈코츠|셋쇼마루|카구라|호센키|키쿄우|코우가|링|이누야샤|카에데|이누노타이쇼|링|류코츠세이|칸나|나라쿠|카고메|셋쇼마루|산고|이누야샤|키쿄우|묘가|카에데|셋쇼마루|카구라|류코츠세이|나라쿠|이누노타이쇼|링|미로쿠|카구라|이누노타이쇼|묘가|셋쇼마루|칸나|코우가|카고메|이누노타이쇼|쟈코츠|이누야샤|산고|고신키|산고|셋쇼마루|칸나|나라쿠|칸나|이누노타이쇼|링|류코츠세이|카구라|이누노타이쇼|카에데|셋쇼마루|카구라|나라쿠|칸나`.split("|");
const ONE_PIECE = `징베|쵸파|루피|나미|카이도|크로커다일|조로|로빈|로우|비비|샹크스|시라호시|에이스|쵸파|가프|캐럿|킹|보아 핸콕|키드|코비|마르코|타시기|에이스|코알라|징베|돌턴|조로|캐번디시|카이도|시저|루피|레베카|마르코|상디|가프|우솝|쿠잔|로빈|징베|비비|몽키 D. 드래곤|보아 핸콕|루피|상디|센고쿠|나미|미호크|로빈|검은수염|쿠잔|가프|캐럿|아카이누|보아 핸콕|흰수염|빅 맘|조로|미호크|샹크스|쿠잔`.split("|");
const GHIBLI = `아시타카|소피|포르코|키키|무스카|유바바|하울|쇼우|포뇨|나우시카|아시타카|아리에티|캘시퍼|소피|모로|메이|하울의 성|유바바|하울|시즈쿠|나우시카|산|캘시퍼|하쿠|토토로|오소노|산|시타|하쿠|가오나시|아시타카|시타|지로|하울|토토로|폰포코 너구리|산|소피|모로|메이|숲의 신|아리에티|캘시퍼|시즈쿠|라퓨타 로봇병|키키|아시타카|치히로|포뇨|가오나시|모로|메이|캘시퍼|유바바|토토로|오소노|라퓨타 로봇병|하울|모로|가오나시`.split("|");

const CHARACTER_SEEDS: Record<ThemeSlug, string[]> = {
  "one-piece": ONE_PIECE,
  naruto: NARUTO,
  inuyasha: INUYASHA,
  ghibli: GHIBLI,
};

const TAGLINES: Record<ThemeSlug, string> = {
  "one-piece": "마음먹은 방향으로 거침없이 나아갑니다.",
  naruto: "자기만의 방식으로 끝까지 밀어붙입니다.",
  inuyasha: "겉보다 훨씬 깊고 단단한 면을 가졌습니다.",
  ghibli: "평범해 보여도 자기만의 작은 마법이 있습니다.",
};

export function getCharacterResults(cycleIndex: number, animalName: string): CharacterResult[] {
  return THEMES.map((theme) => {
    const characterName = CHARACTER_SEEDS[theme.slug][cycleIndex];
    if (!characterName) throw new Error(`Missing ${theme.slug} mapping at ${cycleIndex}`);

    return {
      theme: theme.slug,
      themeName: theme.displayName,
      characterName,
      tagline: TAGLINES[theme.slug],
      description: `${characterName}처럼 자신만의 존재감이 분명합니다. 대표 동물 ${animalName}의 이미지와 닮은 매력을 발견해 보세요.`,
      imageKey: `${theme.slug}/${characterName}`,
    };
  });
}
