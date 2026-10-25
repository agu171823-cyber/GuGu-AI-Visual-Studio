import { useState } from 'react';
export function ImportProject({onImported}:{onImported:()=>void}) {
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  async function importFiles(files:FileList|null){if(!files?.length)return;setBusy(true);setStatus('正在校验并复制已批准资产…');try{
    const manifest=[...files].filter(f=>f.name==='project.json');
    if(manifest.length!==1)throw new Error('请选择单个 project-… 文件夹');
    const project=JSON.parse(await manifest[0].text());const names=new Set(project.assets.map((a:any)=>String(a.fileName).split('/').pop()));
    const form=new FormData();form.append('files',manifest[0],manifest[0].name);
    for(const file of files)if(names.has(file.name))form.append('files',file,file.name);
    const response=await fetch('/api/character/import',{method:'POST',body:form});const result=await response.json();if(!response.ok)throw new Error(result.error);
    setStatus('项目导入完成，原目录保持不变。');onImported();
  }catch(e){setStatus(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
  return <div className="project-tools"><label>导入旧版角色项目 <input type="file" aria-label="导入旧版角色项目目录" {...({webkitdirectory:'',directory:''} as any)} disabled={busy} onChange={e=>void importFiles(e.target.files)}/></label><small role="status">{status||'选择包含 project.json 与 assets 的单个项目文件夹；同名项目不会被覆盖。'}</small></div>;
}
