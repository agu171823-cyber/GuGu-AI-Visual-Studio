import type { GenerationSelection } from '../shared/gugu';
let selection: GenerationSelection = {providerId:'default',model:'gpt-image-2.5-flare',resolution:'2K',quality:'medium',promptOptimization:'standard'};
export function getGenerationSelection() { return {...selection}; }
export function setGenerationSelection(value: GenerationSelection) { selection = {...value}; }
