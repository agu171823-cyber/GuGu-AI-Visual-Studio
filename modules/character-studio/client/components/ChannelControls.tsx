import { useEffect, useState } from 'react';
import { getGenerationSelection, setGenerationSelection } from '../channel-settings';
import type { GenerationSelection } from '../../shared/gugu';
import { MODEL_CHANNELS } from '../../shared/gugu';
import type { GenerationRecipe } from '../../shared/asset-schema';
type Provider = {label:string; configured:boolean; models:{id:string;label:string}[]};
export function ChannelControls({disabled,onReady,contextKey,anchor}:{disabled:boolean;onReady:(ready:boolean)=>void;contextKey?:string;anchor?:GenerationRecipe}) {
  const [providers,setProviders] = useState<Record<string,Provider>>({});
  const [selected,setSelected] = useState(getGenerationSelection);
  const [error,setError] = useState('');
  useEffect(()=>{
    if(!anchor || !MODEL_CHANNELS[anchor.model]) return;
    const channel=MODEL_CHANNELS[anchor.model];
    const width=Number(anchor.size.split('x')[0]);
    const resolution=width===1024?'1K':channel==='volc'&&width===1536?'1.5K':channel==='default'&&width===2880?'4K':'2K';
    const next:GenerationSelection={providerId:channel,model:anchor.model,resolution,quality:anchor.quality==='high'?'high':'medium',promptOptimization:'standard'};
    setSelected(next);setGenerationSelection(next);
  },[contextKey]);
  async function refresh() { try { const response = await fetch('/api/character/options'); if(!response.ok) throw new Error(response.status===404?'角色工作室后端未加载，请重启当前版本':'无法读取渠道设置'); const data = await response.json(); setProviders(data.providers); setError(''); } catch(e){setError(e instanceof Error?e.message:String(e));} }
  useEffect(()=> {void refresh(); const refreshOnFocus=()=>void refresh(); window.addEventListener('focus',refreshOnFocus); window.addEventListener('gugu-settings-changed',refreshOnFocus); return ()=>{window.removeEventListener('focus',refreshOnFocus);window.removeEventListener('gugu-settings-changed',refreshOnFocus);};},[]);
  useEffect(()=>{onReady(Boolean(providers[selected.providerId]?.configured));},[providers,selected.providerId,onReady]);
  function update(patch:Partial<GenerationSelection>) {
    const next={...selected,...patch};
    if(patch.providerId){next.model=providers[next.providerId]?.models[0]?.id || '';next.resolution='2K';}
    setSelected(next);setGenerationSelection(next);
  }
  const modelLabel = providers[selected.providerId]?.models.find(model => model.id === selected.model)?.label || selected.model;
  const ready = Boolean(providers[selected.providerId]?.configured);
  return <details className="generation-settings">
    <summary>
      <span><strong>生成设置</strong><small>{selected.providerId === 'default' ? '147 图片' : '火山 Seedream'} · {modelLabel} · {selected.resolution}</small></span>
      <span className={ready ? 'settings-ready' : 'settings-missing'}>{ready ? '已连接' : '待配置'} · 点击调整</span>
    </summary>
    <section className="channel-controls" aria-label="角色生成渠道">
      <label>图片渠道<select aria-label="角色图片渠道" disabled={disabled} value={selected.providerId} onChange={e=>update({providerId:e.target.value as GenerationSelection['providerId']})}><option value="default">147 图片</option><option value="volc">火山 Seedream</option></select></label>
      <label>图片模型<select aria-label="角色图片模型" disabled={disabled} value={selected.model} onChange={e=>update({model:e.target.value})}>{(providers[selected.providerId]?.models ?? [{id:selected.model,label:selected.model}]).map(m=><option value={m.id} key={m.id}>{m.label}</option>)}</select></label>
      <label>分辨率<select aria-label="角色分辨率" disabled={disabled} value={selected.resolution} onChange={e=>update({resolution:e.target.value as GenerationSelection['resolution']})}>{(selected.providerId==='volc'?['1K','1.5K','2K']:['1K','2K','4K']).map(v=><option key={v}>{v}</option>)}</select></label>
      {selected.providerId==='default' && <label>画质<select disabled={disabled} aria-label="角色画质" value={selected.quality} onChange={e=>update({quality:e.target.value as 'medium'|'high'})}><option value="medium">标准</option><option value="high">高清</option></select></label>}
      {selected.model.includes('-pro-') && <label>提示词优化<select aria-label="提示词优化" disabled={disabled} value={selected.promptOptimization} onChange={e=>update({promptOptimization:e.target.value as 'standard'|'fast'})}><option value="standard">标准</option><option value="fast">快速</option></select></label>}
      <button type="button" onClick={()=>document.getElementById('settingsButton')?.click()}>接口设置</button>
      <button type="button" onClick={()=>void refresh()}>刷新连接状态</button>
      <small role="status">{error || (ready?'所选渠道已配置。':'请先配置所选渠道。')} 同一角色版本建议保持相同模型；每个批次都需主动点击，失败不会自动重试。</small>
    </section>
  </details>;
}
