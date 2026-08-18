import { EARTHLY_BRANCHES, HEAVENLY_STEMS, type Element } from "../domain/saju/constants";

export interface Archetype {
  cycleIndex: number;
  ganji: string;
  ganjiKr: string;
  archetypeName: string;
  animalName: string;
  element: Element;
  description: string;
}

const SEED = `
갑자|물가의 거목|비버
을축|설원의 들풀|사향노루
병인|숲을 깨우는 태양|호랑이
정묘|달빛 아래 등불|붉은여우
무진|움직이는 대산|코뿔소
기사|뜨거운 모래언덕|사막뱀
경오|불속에서 벼린 검|백호
신미|초원의 보석|흰사슴
임신|폭풍치는 바위해안|범고래
계유|새벽의 이슬|흰담비
갑술|황야의 거목|늑대
을해|물 위의 덩굴|수달
병자|한밤의 태양|붉은박쥐
정축|설원 속 화롯불|붉은판다
무인|호랑이가 사는 산|불곰
기묘|봄날의 정원|토끼
경진|암산 속 원석|천산갑
신사|불꽃 속 보석|흰뱀
임오|끓어오르는 바다|흑표범
계미|초원에 내리는 비|산양
갑신|절벽의 소나무|독수리
을유|칼날 옆의 꽃|백로
병술|화염을 품은 황야|사자개
정해|밤바다의 등불|해달
무자|지하수를 품은 산|물소
기축|겨울의 대지|들소
경인|숲을 가르는 도끼|백호
신묘|꽃잎을 자르는 칼|흰여우
임진|용이 승천하는 바다|청룡
계사|안개 속 독사|살무사
갑오|태양을 향한 거목|사자
을미|초원의 꽃|꽃사슴
병신|석양의 불꽃|불여우
정유|보석을 비추는 촛불|공작
무술|황야의 거산|티베탄 마스티프
기해|습지의 대지|카피바라
경자|얼음 속의 칼|설표
신축|얼어붙은 보석|북극여우
임인|폭포 옆의 호랑이|재규어
계묘|봄비 내리는 숲|청설모
갑진|구름을 뚫는 거목|용
을사|불을 타고 오르는 덩굴|청사
병오|한낮의 태양|불사조
정미|들판의 모닥불|사슴
무신|철광산|고릴라
기유|황금빛 들판|황조롱이
경술|황야에 꽂힌 검|회색늑대
신해|심해의 진주|흰돌고래
임자|한겨울의 대양|범고래
계축|얼어붙은 늪|오소리
갑인|원시림의 호랑이|시베리아호랑이
을묘|봄날의 화원|앙고라토끼
병진|화산 위의 용|코모도드래곤
정사|등불을 감은 뱀|붉은코브라
무오|태양 아래 대산|코끼리
기미|비옥한 대초원|들양
경신|거대한 철광석|은빛고릴라
신유|완성된 보석|백공작
임술|폭풍을 품은 황야|검은늑대
계해|깊은 밤의 습지|너구리
`.trim();

const ELEMENT_TONE: Record<Element, string> = {
  wood: "자기만의 방향으로 꾸준히 자라나는 힘이 돋보입니다.",
  fire: "주변의 온도를 바꾸는 선명한 에너지가 돋보입니다.",
  earth: "쉽게 흔들리지 않고 중심을 잡는 힘이 돋보입니다.",
  metal: "복잡한 상황에서도 핵심을 가려내는 감각이 돋보입니다.",
  water: "흐름을 읽고 유연하게 길을 만드는 감각이 돋보입니다.",
};

export const ARCHETYPES: Archetype[] = SEED.split("\n").map((line, cycleIndex) => {
  const [ganjiKr, archetypeName, animalName] = line.split("|");
  const stem = HEAVENLY_STEMS[cycleIndex % 10];
  const branch = EARTHLY_BRANCHES[cycleIndex % 12];

  if (!ganjiKr || !archetypeName || !animalName || !stem || !branch) {
    throw new Error(`Invalid archetype seed at index ${cycleIndex}`);
  }

  return {
    cycleIndex,
    ganji: `${stem.hanja}${branch.hanja}`,
    ganjiKr,
    archetypeName,
    animalName,
    element: stem.element,
    description: `${archetypeName}의 이미지를 닮았습니다. ${ELEMENT_TONE[stem.element]}`,
  };
});

export function getArchetype(cycleIndex: number): Archetype {
  const archetype = ARCHETYPES[cycleIndex];
  if (!archetype) throw new Error("해당 일주의 캐릭터 데이터를 찾지 못했습니다.");
  return archetype;
}
