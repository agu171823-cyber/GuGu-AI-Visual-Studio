import { useState } from 'react';
export function AssetTransfer({projectId,versionId,assetId}:{projectId:string;versionId:string;assetId:string}) {
  const [error,setError]=useState('');
  const url=`/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`;
  async function send(mode:string){try{const response=await fetch(url);if(!response.ok)throw new Error('资产读取失败');const blob=await response.blob();await (window as any).GuguImageEdit.importLocalImage(new File([blob],`${assetId}.${blob.type==='image/jpeg'?'jpg':'png'}`,{type:blob.type}),mode,{projectId,versionId});}catch(e){setError(String(e));}}
  return <div className="asset-transfer"><a href={url} download={`${assetId}.png`}>下载原图</a><button type="button" onClick={()=>void send('imageGenerate')}>发送到图片生成</button><button type="button" onClick={()=>void send('precise')}>发送到精确编辑</button><button type="button" onClick={()=>void send('portraitStudio')}>发送到写真</button>{error&&<small role="alert">{error}</small>}</div>;
}
