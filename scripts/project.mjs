import {readFree} from './free-project.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {parseStoryboard} from './lib/storyboard.mjs';

export const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Bound memory even when hashing multi-gigabyte renders.
export function hash(p) {
  const digest=createHash('sha256'), buffer=Buffer.allocUnsafe(1024*1024);
  const fd=fs.openSync(p,'r');
  try {let count;while((count=fs.readSync(fd,buffer,0,buffer.length,null))>0)digest.update(buffer.subarray(0,count));}
  finally {fs.closeSync(fd);}
  return digest.digest('hex');
}
export function run(bin, args, options={}) {
  const r=spawnSync(bin,args,{encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024,...options});
  if(r.error || r.status!==0) throw new Error(`${bin} failed (${r.status}): ${r.error?.message || ''}\n${r.stdout||''}\n${r.stderr||''}`);
  return r.stdout;
}
export function local(project, name) {
  if(!name || path.isAbsolute(name) || /^[a-z]+:/i.test(name)) throw new Error(`Expected project-relative resource: ${name}`);
  const p=path.resolve(project,name), root=path.resolve(project)+path.sep;
  if(!p.startsWith(root)) throw new Error(`Resource escapes project: ${name}`);
  if(!fs.existsSync(p)) throw new Error(`Missing resource: ${name}`);
  const real=fs.realpathSync(p), realRoot=fs.realpathSync(project)+path.sep;
  if(!real.startsWith(realRoot)) throw new Error(`Resource symlink escapes project: ${name}`);
  return p;
}
export function readProject(dir) {
  if(fs.existsSync(path.join(dir,'project.json'))) return readFree(dir);
  const source=fs.readFileSync(path.join(dir,'STORYBOARD.md'),'utf8');
  const parsed=parseStoryboard(source), g=parsed.globals.extra;
  if(parsed.warnings.length) throw new Error(`Storyboard parser warnings: ${JSON.stringify(parsed.warnings)}`);
  const [width,height]=(parsed.globals.format||'').split('x').map(Number);
  const fps=Number(g.fps), totalFrames=Number(g.total_frames);
  if(![width,height,fps,totalFrames].every(x=>Number.isSafeInteger(x)&&x>0)) throw new Error('Invalid format/fps/total_frames');
  if(width%2 || height%2) throw new Error('H.264 canvas dimensions must be even');
  if(fps>60 || totalFrames/fps>180) throw new Error('This adapter supports <=60 fps and <=180 seconds');
  if(!['showcase','evolution','paper'].includes(g.strategy)) throw new Error('Unknown strategy');
  if(g.material&&!['vector','paper'].includes(g.material)) throw new Error('Unknown material');
  for(const flag of ['audio_required','sync_required'])if(g[flag]!==undefined&&!['true','false'].includes(g[flag]))throw new Error(`${flag} must be true or false`);
  if(!/^#[0-9a-f]{6}$/i.test(g.accent||'')) throw new Error('accent must be #RRGGBB');
  if(!parsed.frames.length) throw new Error('No frames');
  let end=0;
  const frames=parsed.frames.map((f,i)=>{
    const start=Number(f.extra.start_frame), count=Number(f.extra.frames);
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(count)||count<=0||start!==end) throw new Error(`Scene ${i+1}: gap, overlap or invalid integer frame count`);
    if(!Number.isFinite(f.durationSeconds)||Math.abs(f.durationSeconds-count/fps)>0.5/fps) throw new Error(`Scene ${i+1}: duration conflicts with frame count`);
    if(f.transitionIn!=='cut') throw new Error('v0.1 supports hard cuts between base scenes; animate inside scenes');
    if(!f.extra.headline || !f.scene) throw new Error(`Scene ${i+1}: headline/scene missing`);
    const parts=f.extra.headline.split('|');
    if(parts.length>3 || parts.some(x=>Array.from(x).length>14)) throw new Error(`Scene ${i+1}: headline exceeds template capacity`);
    if(Array.from(f.extra.subline||'').length>42) throw new Error(`Scene ${i+1}: subline exceeds template capacity`);
    end+=count;
    return {...f,start,count,index:i};
  });
  if(end!==totalFrames) throw new Error(`Scene frames ${end} != total_frames ${totalFrames}`);
  const assets={font:local(dir,g.font),gsap:local(dir,g.gsap)};
  if(g.audio && g.audio!=='none') {
    assets.audio=local(dir,g.audio);
    const info=JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration','-of','json',assets.audio]));
    if(Number(info.format.duration)<totalFrames/fps-1/fps) throw new Error('Audio shorter than timeline');
  }
  if(g.audio_required==='true'&&!assets.audio) throw new Error('Required audio is absent');
  if(g.sync_required==='true') {
    if(!assets.audio)throw new Error('Synchronization requires audio');
    const map=JSON.parse(fs.readFileSync(local(dir,g.audiomap),'utf8'));
    if(map.fps!==fps || !Array.isArray(map.anchors)||!map.anchors.length) throw new Error('Invalid required audio map');
    for(const a of map.anchors) if(!Number.isSafeInteger(a.frame)||a.frame<0||a.frame>=totalFrames||!Number.isFinite(a.audio_sec)||Math.abs(a.frame-a.audio_sec*fps)>1) throw new Error('Audio anchor exceeds one frame');
  }
  return {dir,source,parsed,g,width,height,fps,totalFrames,frames,assets};
}
export function environment() {
  const configFile=path.join(SKILL,'runtime.local.json');
  const config=fs.existsSync(configFile)?JSON.parse(fs.readFileSync(configFile,'utf8')):{};
  const chrome=process.env.HYPERFRAMES_BROWSER_PATH || config.browser || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
  if(!chrome) throw new Error('Set HYPERFRAMES_BROWSER_PATH to installed Chrome/Chromium');
  return {...process.env,HYPERFRAMES_BROWSER_PATH:chrome,DO_NOT_TRACK:'1',HYPERFRAMES_TELEMETRY_DISABLED:'1',NO_COLOR:'1',GEMINI_API_KEY:''};
}
export function cli(args,dir) {
  const f=path.join(SKILL,'runtime.local.json');
  const cfg=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};
  return run(process.env.MOTION_NODE_PATH||cfg.node||process.execPath,[fs.realpathSync(path.join(SKILL,'node_modules/hyperframes/bin/hyperframes.mjs')),...args],{cwd:dir,env:environment(),timeout:args[0]==='render'?1800000:180000});
}
export function assertBrowserCheck(r,{allowNoText=false}={}) {
  if(r.ok!==true || r.browserSkipped!==false || r.lint?.ok!==true || r.runtime?.ok!==true || !Array.isArray(r.layout?.samples) || r.layout.samples.length===0 || r.contrast?.enabled!==true || !(r.contrast.checked>0||allowNoText&&r.contrast.checked===0))throw new Error('Browser check incomplete or failed; do not treat zero samples as success');
}
