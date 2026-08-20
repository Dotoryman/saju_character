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

function drawWrappedCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((value, index) => drawCenteredText(context, value, y + index * lineHeight, maxWidth));
}

async function loadImage(source?: string): Promise<HTMLImageElement | null> {
  if (!source) return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) * 0.18);

  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  context.restore();
}

export async function createShareImage(result: ResultViewModel): Promise<Blob> {
  await document.fonts?.ready;
  const characterImages = await Promise.all(result.characters.map((character) => loadImage(character.imageKey)));

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
  drawCenteredText(context, "SAJUSAJU · MY CHARACTER", 64);

  context.fillStyle = muted;
  context.font = '600 25px "Noto Sans KR", sans-serif';
  drawCenteredText(context, `“${result.user.displayNickname}” 님의 일주는`, 112, 880);

  context.fillStyle = ink;
  context.font = '400 150px "Gowun Batang", "Noto Serif KR", serif';
  drawCenteredText(context, result.ganji, 230);

  context.font = '700 44px "Noto Sans KR", sans-serif';
  drawCenteredText(context, `${result.ganjiKr}일주`, 335);

  context.fillStyle = accent;
  context.font = '800 60px "Noto Sans KR", sans-serif';
  drawCenteredText(context, result.archetype.animal, 420, 880);

  context.fillStyle = muted;
  context.font = '500 19px "Noto Sans KR", sans-serif';
  drawWrappedCenteredText(context, result.archetype.description, 472, 850, 28, 2);

  const gridX = 70;
  const gridY = 545;
  const cardWidth = 460;
  const cardHeight = 290;
  const cardGap = 20;
  const portraitWidth = 150;
  const portraitHeight = 250;

  result.characters.forEach((character, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = gridX + column * (cardWidth + cardGap);
    const y = gridY + row * (cardHeight + cardGap);
    context.fillStyle = "rgba(255,255,255,0.78)";
    drawRoundedRect(context, x, y, cardWidth, cardHeight, 28);

    const image = characterImages[index];
    if (image) {
      drawCoverImage(context, image, x + 20, y + 20, portraitWidth, portraitHeight, 20);
    } else {
      context.fillStyle = "rgba(23,23,21,0.08)";
      drawRoundedRect(context, x + 20, y + 20, portraitWidth, portraitHeight, 20);
      context.textAlign = "center";
      context.fillStyle = accent;
      context.font = '400 58px "Gowun Batang", "Noto Serif KR", serif';
      context.fillText(character.characterName.slice(0, 1), x + 95, y + 145);
    }

    context.textAlign = "left";
    context.fillStyle = accent;
    context.font = '800 17px Inter, "Noto Sans KR", sans-serif';
    context.fillText(character.themeName, x + 192, y + 78, 235);
    context.fillStyle = ink;
    context.font = '800 32px "Noto Sans KR", sans-serif';
    context.fillText(character.characterName, x + 192, y + 124, 235);
    context.fillStyle = muted;
    context.font = '600 19px "Noto Sans KR", sans-serif';
    context.fillText(character.tagline, x + 192, y + 172, 235);
  });

  context.textAlign = "center";
  context.save();
  context.globalAlpha = 0.58;
  context.fillStyle = accent;
  context.font = '700 23px Inter, "Noto Sans KR", sans-serif';
  drawCenteredText(context, "sajusaju.cloud", 1308);
  context.restore();

  return canvasToBlob(canvas);
}

export function shareImageFileName(result: ResultViewModel): string {
  return `sajusaju-${result.ganjiKr}-${result.resultId}.png`;
}
