import fs from 'node:fs';
import path from 'node:path';
import {cli,readProject,hash,assertBrowserCheck} from './project.mjs';
const [command,project,...extra]=process.argv.slice(2), dir=path.resolve(project||'.');
if(!['check','render','snapshot','info','doctor'].includes(command)) throw new Error('Allowed: check, render, snapshot, info, doctor');
const p=readProject(dir);
if(['check','render','snapshot'].includes(command)) {
  const b=JSON.parse(fs.readFileSync(path.join(dir,'reports/build.json'),'utf8'));
  if(b.mode==='free'){for(const [f,h] of Object.entries(b.sourceHashes)){if(hash(path.join(dir,f))!==h)throw Error('Source changed since build: '+f);}}
  else if(b.storyboardSha256!==hash(path.join(dir,'STORYBOARD.md')) || b.indexSha256!==hash(path.join(dir,'index.html'))) throw new Error('Source changed since build. Run build.mjs again.');
  if(b.indexSha256!==hash(path.join(dir,'index.html')))throw Error('Generated HTML changed since build');
  for(const asset of Object.values(b.assets)) if(asset.sha256!==hash(path.join(dir,asset.path))) throw new Error('Asset changed since build. Run build.mjs again.');
}
if(command==='render') {
  const c=JSON.parse(fs.readFileSync(path.join(dir,'reports/check.json'),'utf8'));
  if(c.buildSha256!==hash(path.join(dir,'reports/build.json')) || c.status!=='passed') throw new Error('Check current build before render');
}
fs.mkdirSync(path.join(dir,'renders'),{recursive:true});
fs.mkdirSync(path.join(dir,'reports'),{recursive:true});
const args=command==='render'?['render','--fps',String(p.fps),'--quality','delivery','--output','renders/final.mp4',...extra]:command==='check'?['check','--json','--timeout','30000',...extra]:[command,...extra];
try {
 const out=cli(args,dir); fs.writeFileSync(path.join(dir,`reports/${command}.log`),out);
 if(command==='check') {
  const result=JSON.parse(out);assertBrowserCheck(result,{allowNoText:p.free&&p.m.expectText===false});
  fs.writeFileSync(path.join(dir,'reports/check.json'),JSON.stringify({status:'passed',buildSha256:hash(path.join(dir,'reports/build.json')),browserSamples:result.layout.samples,contrastChecked:result.contrast.checked,motionAssertionsEnabled:result.motion?.enabled,warnings:[...result.lint.findings,...result.layout.findings].filter(f=>f.severity==='warning'),raw:result},null,2));
  console.log(`Check passed: ${result.layout.samples.length} browser samples, ${result.contrast.checked} contrast checks; see reports/check.json for warnings`);
 }else {if(command==='render')fs.writeFileSync(path.join(dir,'reports/render-receipt.json'),JSON.stringify({buildSha256:hash(path.join(dir,'reports/build.json')),videoSha256:hash(path.join(dir,'renders/final.mp4'))},null,2));console.log(out);}
} catch(e) {
 fs.writeFileSync(path.join(dir,`reports/${command}.log`),String(e));
 if(command==='check') fs.writeFileSync(path.join(dir,'reports/check.json'),JSON.stringify({status:'failed',error:String(e)}));
 throw e;
}
