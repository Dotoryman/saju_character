import type { ResultViewModel } from "../../shared/result";

const WIDTH = 1080;
const HEIGHT = 1350;

const ELEMENT_COLORS: Record<ResultViewModel["element"], string> = {
  wood: "#3f7560",
  fire: "#e8523c",
  earth: "#9a6b36",
  metal: "#6c7480",
  water: "#3d6488",
};

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth?: number,
) {
  context.fillText(text, WIDTH / 2, y, maxWidth);
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("공유 이미지를 만들지 못했습니다."));
    }, "image/png");
  });
}

export async function createShareImage(result: ResultViewModel): Promise<Blob> {
  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이 브라우저에서는 이미지 생성을 지원하지 않습니다.");

  const accent = ELEMENT_COLORS[result.element];
  const paper = "#f8f5ee";
  const ink = "#171715";
  const muted = "#706d66";

  context.fillStyle = paper;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.globalAlpha = 0.07;
  context.fillStyle = accent;
  context.beginPath();
  context.arc(130, 110, 280, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(980, 1210, 360, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = accent;
  context.font = '800 25px Inter, "Noto Sans KR", sans-serif';
  drawCenteredText(context, "MY DAY PILLAR · SAJUSAJU", 90);

  context.fillStyle = ink;
  context.font = '400 190px "Gowun Batang", "Noto Serif KR", serif';
  drawCenteredText(context, result.ganji, 245);

  context.font = '700 46px "Noto Sans KR", sans-serif';
  drawCenteredText(context, `${result.ganjiKr}일주`, 380);

  context.fillStyle = muted;
  context.font = '500 26px "Noto Sans KR", sans-serif';
  drawCenteredText(context, result.archetype.name, 445, 880);

  context.fillStyle = accent;
  context.font = '800 66px "Noto Sans KR", sans-serif';
  drawCenteredText(context, result.archetype.animal, 535, 880);

  const cardX = 90;
  const cardWidth = 900;
  const cardHeight = 122;
  const firstCardY = 650;

  result.characters.forEach((character, index) => {
    const y = firstCardY + index * 145;
    context.fillStyle = "rgba(255,255,255,0.78)";
    drawRoundedRect(context, cardX, y, cardWidth, cardHeight, 28);

    context.textAlign = "left";
    context.fillStyle = accent;
    context.font = '800 20px Inter, "Noto Sans KR", sans-serif';
    context.fillText(character.themeName, cardX + 34, y + 39);
    context.fillStyle = ink;
    context.font = '800 34px "Noto Sans KR", sans-serif';
    context.fillText(character.characterName, cardX + 34, y + 83, cardWidth - 68);
  });

  context.textAlign = "center";
  context.fillStyle = ink;
  context.font = '800 28px Inter, "Noto Sans KR", sans-serif';
  drawCenteredText(context, "SAJUSAJU.CLOUD", 1278);
  context.fillStyle = muted;
  context.font = '500 18px "Noto Sans KR", sans-serif';
  drawCenteredText(context, "운세가 아닌, 일주의 이미지를 발견하는 곳", 1318);

  return canvasToBlob(canvas);
}

export function shareImageFileName(result: ResultViewModel): string {
  return `sajusaju-${result.ganjiKr}-${result.resultId}.png`;
}
