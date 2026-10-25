export function clampBodyCropRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.1;
  return Math.min(0.45, Math.max(0.1, value));
}

type CropSource = CanvasImageSource & {
  naturalWidth?: number;
  naturalHeight?: number;
  width?: number;
  height?: number;
};

export function exportBodyOnlyCrop(
  image: CropSource,
  cropY: number,
  createCanvas: () => HTMLCanvasElement = () => document.createElement("canvas"),
): HTMLCanvasElement {
  const width = image.naturalWidth ?? Number(image.width) ?? 1;
  const height = image.naturalHeight ?? Number(image.height) ?? 1;
  const y = Math.round(height * clampBodyCropRatio(cropY));
  const canvas = createCanvas();
  canvas.width = width;
  canvas.height = height - y;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持实验性身体裁切");
  context.drawImage(image, 0, y, width, height - y, 0, 0, width, height - y);
  context.fillStyle = "rgba(23, 23, 20, 0.78)";
  context.fillRect(0, canvas.height - 42, canvas.width, 42);
  context.fillStyle = "#f7f5ef";
  context.font = "700 18px ui-monospace, Consolas, monospace";
  context.fillText("EXPERIMENTAL BODY-ONLY CROP / MANUAL", 14, canvas.height - 14);
  return canvas;
}
