import type { BoardLayout } from "./layouts";

export type BoardImageLoader = (url: string) => Promise<CanvasImageSource>;

export function loadBrowserImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画板图片读取失败"));
    image.src = url;
  });
}

function dimensions(image: CanvasImageSource): { width: number; height: number } {
  const source = image as CanvasImageSource & {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    width?: number;
    height?: number;
  };
  return {
    width: source.naturalWidth ?? source.videoWidth ?? Number(source.width) ?? 1,
    height: source.naturalHeight ?? source.videoHeight ?? Number(source.height) ?? 1,
  };
}

export function calculateCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focusY = 0.5,
): { sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number } {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const sourceCropWidth = Math.round(targetWidth / scale);
  const sourceCropHeight = Math.round(targetHeight / scale);
  const sourceX = Math.round((sourceWidth - sourceCropWidth) / 2);
  const boundedFocusY = Math.min(1, Math.max(0, focusY));
  const sourceY = Math.round((sourceHeight - sourceCropHeight) * boundedFocusY);
  return {
    sourceX,
    sourceY,
    sourceWidth: sourceCropWidth,
    sourceHeight: sourceCropHeight,
  };
}

export function calculateContainRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  return {
    x: Math.round((targetWidth - width) / 2),
    y: Math.round((targetHeight - height) / 2),
    width,
    height,
  };
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  focusY?: number,
): void {
  const source = dimensions(image);
  const crop = calculateCoverCrop(source.width, source.height, width, height, focusY);
  context.drawImage(
    image,
    crop.sourceX,
    crop.sourceY,
    crop.sourceWidth,
    crop.sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function drawContain(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const source = dimensions(image);
  const target = calculateContainRect(source.width, source.height, width, height);
  context.drawImage(
    image,
    0,
    0,
    source.width,
    source.height,
    x + target.x,
    y + target.y,
    target.width,
    target.height,
  );
}

export async function renderBoard(
  canvas: HTMLCanvasElement,
  layout: BoardLayout,
  imageLoader: BoardImageLoader = loadBrowserImage,
): Promise<void> {
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 Canvas 画板导出");
  context.fillStyle = layout.background;
  context.fillRect(0, 0, layout.width, layout.height);
  context.fillStyle = layout.accent;
  context.fillRect(0, 0, 34, layout.height);

  const loaded = await Promise.all(layout.images.map(async (slot) => ({
    slot,
    image: await imageLoader(slot.imageUrl),
  })));
  for (const { slot, image } of loaded) {
    const labelHeight = 54;
    const imageHeight = slot.fit === "contain" ? slot.height - labelHeight : slot.height;
    context.save();
    context.beginPath();
    context.rect(slot.x, slot.y, slot.width, imageHeight);
    context.clip();
    if (slot.fit === "contain") {
      context.fillStyle = "#e7e8e3";
      context.fillRect(slot.x, slot.y, slot.width, imageHeight);
      drawContain(context, image, slot.x, slot.y, slot.width, imageHeight);
    } else {
      drawCover(context, image, slot.x, slot.y, slot.width, slot.height, slot.focusY);
    }
    context.restore();
    context.strokeStyle = "rgba(27, 27, 24, 0.3)";
    context.lineWidth = 2;
    context.strokeRect(slot.x, slot.y, slot.width, slot.height);
    context.fillStyle = "rgba(27, 27, 24, 0.86)";
    context.fillRect(slot.x, slot.y + slot.height - labelHeight, slot.width, labelHeight);
    context.fillStyle = "#f5f1e8";
    context.font = "700 21px ui-monospace, Consolas, monospace";
    context.textAlign = "left";
    context.fillText(slot.label.toUpperCase(), slot.x + 16, slot.y + slot.height - 19);
  }

  for (const item of layout.text) {
    context.fillStyle = item.color;
    context.textAlign = item.align ?? "left";
    const family = item.family === "mono"
      ? "ui-monospace, Consolas, monospace"
      : "Inter, Segoe UI, sans-serif";
    context.font = `${item.weight} ${item.size}px ${family}`;
    context.fillText(item.value, item.x, item.y);
  }
}

export function downloadCanvas(canvas: HTMLCanvasElement, fileName: string): void {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
