import { createRoot } from 'react-dom/client';
import App from './App';
let mounted = false;
export function mount(host: HTMLElement) {
  if (mounted) return;
  const shadow = host.attachShadow({ mode: 'open' });
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = '/character-studio/studio.css?v=9';
  shadow.append(sheet);
  const root = document.createElement('div');
  shadow.append(root);
  createRoot(root).render(<App />);
  mounted = true;
}
