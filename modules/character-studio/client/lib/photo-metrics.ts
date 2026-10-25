export type PhotoOrientation = "portrait" | "square" | "landscape";
export type PhotoBrightness = "dark" | "neutral" | "bright";

export type PhotoMetrics = {
  width: number;
  height: number;
  orientation: PhotoOrientation;
  brightness: PhotoBrightness;
  luminance: number;
  warnings: string[];
};

export function computeAverageLuminance(pixels: Uint8ClampedArray): number {
  if (pixels.length < 4) return 0;

  let total = 0;
  let count = 0;
  for (let index = 0; index + 2 < pixels.length; index += 4) {
    const red = pixels[index] / 255;
    const green = pixels[index + 1] / 255;
    const blue = pixels[index + 2] / 255;
    total += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    count += 1;
  }

  return count === 0 ? 0 : total / count;
}

export function classifyOrientation(width: number, height: number): PhotoOrientation {
  const ratio = width / height;
  if (ratio >= 0.95 && ratio <= 1.05) return "square";
  return ratio < 1 ? "portrait" : "landscape";
}

export function classifyBrightness(luminance: number): PhotoBrightness {
  if (luminance < 0.35) return "dark";
  if (luminance >= 0.68) return "bright";
  return "neutral";
}

export async function analyzeReferenceImage(file: File): Promise<PhotoMetrics> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 64 / Math.max(bitmap.width, bitmap.height));
  const sampleWidth = Math.max(1, Math.round(bitmap.width * scale));
  const sampleHeight = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    throw new Error("当前浏览器无法分析图片");
  }

  context.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const luminance = computeAverageLuminance(pixels);
  const warnings: string[] = [];

  if (bitmap.width < 512 || bitmap.height < 512) {
    warnings.push("参考图分辨率较低，可能影响身份细节");
  }

  const result: PhotoMetrics = {
    width: bitmap.width,
    height: bitmap.height,
    orientation: classifyOrientation(bitmap.width, bitmap.height),
    brightness: classifyBrightness(luminance),
    luminance,
    warnings,
  };
  bitmap.close();
  return result;
}
