export type Channel = 'default' | 'volc';
export type GenerationSelection = { providerId: Channel; model: string; resolution: '1K' | '1.5K' | '2K' | '4K'; quality: 'medium' | 'high'; promptOptimization: 'standard' | 'fast' };
export const MODEL_CHANNELS: Record<string, Channel> = {
  'gpt-image-2.5-flare': 'default', 'gpt-image-2.5-sunburst': 'default',
  'doubao-seedream-5-0-flash-260915': 'volc', 'doubao-seedream-5-0-pro-260628': 'volc',
};
export function validStoredSize(value: unknown): boolean {
  const match = /^(\d+)x(\d+)$/.exec(String(value));
  return !!match && match.slice(1).every(x => Number(x) >= 256 && Number(x) <= 8192);
}
export function validProvider(value: unknown): boolean { return ['147', 'default', 'volc'].includes(String(value)); }
