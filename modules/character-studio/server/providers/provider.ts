import type { ImageQuality, ImageSize } from "../../shared/contracts";

export type ValidateKeyInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type KeyValidationResult = {
  valid: true;
  modelAvailable: boolean;
};

export type EditImageInput = ValidateKeyInput & {
  images: File[];
  providerId?: "default" | "volc";
  promptOptimization?: "standard" | "fast";
  prompt: string;
  size: ImageSize;
  quality: ImageQuality;
};

export type ProviderImageResult = {
  imageB64: string;
  provider: "147" | "default" | "volc";
  model: string;
  size: ImageSize;
  latencyMs: number;
};

export type ImageProvider = {
  validateKey(input: ValidateKeyInput): Promise<KeyValidationResult>;
  editImage(input: EditImageInput): Promise<ProviderImageResult>;
};

export class ProviderError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}
