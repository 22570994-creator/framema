import fs from 'node:fs';
import path from 'node:path';
import {local,run,hash} from './project.mjs';

export function readFree(dir){
 const m=JSON.parse(fs.readFileSync(path.join(dir,'project.json'),'utf8'));
 const {width,height,fps,totalFrames}=m;
 if(m.mode!=='free'||![width,height,fps,totalFrames].every(n=>Number.isSafeInteger(n)&&n>0)||width%2||height%2||fps>60)throw Error('Invalid free project dimensions or frame contract');
 if(!Array.isArray(m.scenes)||!m.scenes.length)throw Error('Scenes required');
 const ids=new Set(),assets={};
 const add=(name)=>{const f=local(dir,name);assets[name]=f;return f;};
 add(m.font);add(m.gsap);
 const clip=(s)=>{
  if(!/^[a-zA-Z][\w-]*$/.test(s.id)||ids.has(s.id))throw Error('Invalid or duplicate clip id');ids.add(s.id);
  if(!Number.isSafeInteger(s.start)||!Number.isSafeInteger(s.frames)||s.start<0||s.frames<=0||s.start+s.frames>totalFrames)throw Error('Clip outside integer frame timeline');
 };
 const frames=m.scenes.map(s=>{clip(s);for(const k of ['html','css','js'])if(s[k])add(s[k]);return {...s,count:s.frames};});
 let covered=0;for(const s of [...frames].sort((a,b)=>a.start-b.start)){if(s.start>covered&&!m.allowGaps)throw Error('Unintentional visual gap');covered=Math.max(covered,s.start+s.count);}if(covered!==totalFrames&&!m.allowGaps)throw Error('Scenes do not cover duration');
 for(const f of m.assets||[])add(f);
 for(const c of m.media||[]){
  clip(c);if(!['video','audio','image'].includes(c.type))throw Error('Unsupported media type');const f=add(c.src);
  if(c.type!=='image'){
   const meta=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',f]));
   if(!meta.streams.some(s=>s.codec_type===(c.type==='audio'?'audio':'video')))throw Error('Media stream type mismatch');
   if(!Number.isFinite(c.in??0)||(c.in??0)<0||!Number.isFinite(c.rate??1)||(c.rate??1)<=0||((c.in??0)+c.frames/fps*(c.rate??1))>Number(meta.format.duration)+1/fps)throw Error('Source range exceeds media duration');
   if(c.volume!==undefined&&(!Number.isFinite(c.volume)||c.volume<0))throw Error('Invalid volume');
  }
 }
 if(m.captions){add(m.captions);const caps=JSON.parse(fs.readFileSync(local(dir,m.captions),'utf8'));let end=0;for(const c of caps){if(!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||c.start<end||c.end<=c.start||c.end>totalFrames||typeof c.text!=='string')throw Error('Invalid or overlapping captions');end=c.end;}}
 const expectedAudio=(m.media||[]).some(c=>c.type==='audio'||c.type==='video'&&c.audio===true);
 return {dir,m,width,height,fps,totalFrames,frames,assets,g:{sync_required:'false'},expectedAudio,free:true};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildFree(dir){
 const p=readFree(dir),m=p.m,read=f=>f?fs.readFileSync(local(dir,f),'utf8'):'';
 // Source fragments are authored executable project code, never imported case prompts.
 const scenes=p.frames.map(s=>`<section id="${s.id}" class="clip scene" data-start="${s.start/p.fps}" data-duration="${s.count/p.fps}" data-track-index="${s.track??1}">${read(s.html)}</section>`).join('\n');
 const media=(m.media||[]).map(c=>{const attrs=`id="${c.id}" src="${esc(c.src)}" class="clip" data-start="${c.start/p.fps}" data-duration="${c.frames/p.fps}" data-track-index="${c.track??2}" style="${esc(c.style||'')}"`;return c.type==='image'?`<img ${attrs} alt="${esc(c.alt||'')}">`:`<${c.type} ${attrs} data-media-start="${c.in??0}" data-playback-rate="${c.rate??1}" data-volume="${c.volume??1}" ${c.automation?`data-automation='${esc(JSON.stringify(c.automation))}'`:''} ${c.type==='video'?(c.audio?'playsinline data-has-audio="true"':'playsinline muted'):''}></${c.type}>`;}).join('\n');
 const captions=m.captions?JSON.parse(read(m.captions)):[];
 const caps=captions.map((c,i)=>`<div id="caption-${i}" class="clip caption" data-start="${c.start/p.fps}" data-duration="${(c.end-c.start)/p.fps}" data-track-index="9">${esc(c.text).replaceAll('\n','<br>')}</div>`).join('');
 const scripts=p.frames.map(s=>`{ const start=${s.start/p.fps}, duration=${s.count/p.fps}, scene=document.getElementById('${s.id}');\n${read(s.js)}\n}`).join('\n');
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(m.title||'Motion project')}</title><script src="${esc(m.gsap)}"></script><style>@font-face{font-family:MotionSans;src:url('${esc(m.font)}')}*{box-sizing:border-box}body{margin:0;font-family:MotionSans,sans-serif;color:#f4f5f6;background:#101826}#root{position:relative;width:100%;height:100%;overflow:hidden}.scene{position:absolute;inset:0}.caption{position:absolute;left:8%;right:8%;bottom:6%;text-align:center;background:#101826;color:#fff;padding:12px;font-size:${Math.min(p.width,p.height)*.038}px;z-index:100} ${p.frames.map(s=>read(s.css)).join('\n')} ${read(m.css)}</style></head><body><div id="root" data-composition-id="main" data-start="0" data-width="${p.width}" data-height="${p.height}" data-duration="${p.totalFrames/p.fps}">${scenes}${media}${caps}</div><script>document.fonts.ready.then(()=>{window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});${scripts}\nwindow.__timelines.main=tl;});</script></body></html>`;
 // All referenced local sources are pinned; external dependencies must be localized.
 for(const match of html.matchAll(/(?:src\s*=\s*["']([^"']+)|url\(\s*["']?([^\s)'";]+))/g)){const ref=match[1]||match[2];if(ref.startsWith('#')||ref.startsWith('data:'))continue;if(/^(https?:|\/\/)/i.test(ref))throw Error('Localize external asset: '+ref);const clean=ref.split(/[?#]/)[0];if(clean&&!Object.hasOwn(p.assets,clean))p.assets[clean]=local(dir,clean);}
 if(m.css)p.assets[m.css]=local(dir,m.css);
 fs.writeFileSync(path.join(dir,'index.html'),html);fs.mkdirSync(path.join(dir,'reports'),{recursive:true});
 const sourceHashes={'project.json':hash(path.join(dir,'project.json'))};for(const [k,v]of Object.entries(p.assets))sourceHashes[k]=hash(v);
 fs.writeFileSync(path.join(dir,'reports/build.json'),JSON.stringify({status:'passed',mode:'free',sourceHashes,indexSha256:hash(path.join(dir,'index.html')),assets:Object.fromEntries(Object.entries(p.assets).map(([k,v])=>[k,{path:k,sha256:hash(v)}]))},null,2));
 console.log(`Built free composition: ${p.frames.length} scenes, ${(m.media||[]).length} media, ${captions.length} captions`);
}
