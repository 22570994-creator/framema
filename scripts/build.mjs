import {buildFree} from './free-project.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {readProject,hash} from './project.mjs';

const target=path.resolve(process.argv[2]||'.');
if(fs.existsSync(path.join(target,'project.json'))){buildFree(target);}else{
const p=readProject(path.resolve(process.argv[2]||'.'));
const paper=p.g.material==='paper'||p.g.strategy==='paper';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=paper?['#eee5d3','#e4dac5','#f2ebdc']:p.g.strategy==='evolution'?['#eee7d7','#12352f','#111625']:['#f0ede4','#163a33','#f0ede4'];
function art(i){
  if(paper) return `<svg viewBox="0 0 500 500" aria-hidden="true"><defs><filter id="shadow${i}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="10" flood-opacity=".17"/></filter></defs><g class="sculpture" filter="url(#shadow${i})"><path fill="#faf5e9" d="M45 320 230 110 445 230 262 430Z"/><path fill="${esc(p.g.accent)}" d="M230 110 262 430 445 230Z"/><path fill="#d5c7aa" d="M45 320 262 430 160 277Z"/><path fill="#fffcf4" d="M45 320 230 110 160 277Z"/><path fill="none" stroke="#ad9974" stroke-width="1.5" d="M160 277 262 430M230 110 160 277"/></g><path class="orbit" fill="none" stroke="#917d5a" stroke-dasharray="3 9" d="M30 380 Q250 460 480 100"/></svg>`;
  if(p.g.strategy==='evolution'&&i===1) return `<svg viewBox="0 0 500 500" aria-hidden="true"><g class="sculpture" fill="none" stroke="#d9ead7"><circle cx="250" cy="250" r="180"/><circle cx="250" cy="250" r="145"/><path d="M70 250H430M250 70V430M110 110 390 390M110 390 390 110"/><rect x="145" y="145" width="210" height="210"/><circle cx="250" cy="250" r="35" fill="${esc(p.g.accent)}"/></g><g fill="#d9ead7">${Array.from({length:12},(_,j)=>`<circle cx="${40+j*38}" cy="${440-Math.sin(j*1.6)*35}" r="3"/>`).join('')}</g></svg>`;
  if(p.g.strategy==='evolution'&&i===2) return `<svg viewBox="0 0 500 500" aria-hidden="true"><g class="sculpture">${Array.from({length:21},(_,j)=>`<rect x="${45+j*20}" y="${250-(35+90*Math.abs(Math.sin(j*.5)))}" width="9" height="${70+180*Math.abs(Math.sin(j*.5))}" rx="4" fill="${j%3===0?'#f0ede4':esc(p.g.accent)}"/>`).join('')}</g><circle class="orbit" cx="250" cy="250" r="207" fill="none" stroke="#71879a" stroke-dasharray="2 13"/></svg>`;
  return `<svg viewBox="0 0 500 500" aria-hidden="true"><g class="sculpture"><circle cx="250" cy="250" r="188" fill="#172f2b"/>${[172,153,134,115,96].map(r=>`<circle cx="250" cy="250" r="${r}" fill="none" stroke="#557067" stroke-width="1"/>`).join('')}<circle cx="250" cy="250" r="76" fill="${esc(p.g.accent)}"/><circle cx="250" cy="250" r="12" fill="#eee7d7"/><path d="M211 241q40-68 78 0-40 70-78 0" fill="#f5eddc"/></g><g class="orbit" fill="none" stroke="${i===1?'#90a69a':'#9b9c8a'}" stroke-width="2"><path d="M15 225 Q90 125 250 235 T485 260"/><path d="M15 250 Q90 150 250 260 T485 285"/></g></svg>`;
}
const scenes=p.frames.map((f,i)=>{
  const dark=!paper&&(i%3===1||(p.g.strategy==='evolution'&&i===2));
  const label=p.g.strategy==='evolution'?['01 / 纸上回声','02 / 模拟频率','03 / 数字春天'][i%3]:paper?'PAPER STUDY / 纸的可能':'SPRING RECORDS / 春日来信';
  return `<section id="scene-${i}" class="clip scene ${dark?'dark':''}" data-start="${f.start/p.fps}" data-duration="${f.count/p.fps}" data-track-index="1" style="background:${colors[i%3]}"><div class="inner"><div class="top"><span>${esc(label)}</span><span>VOL. 01 / ${String(i+1).padStart(2,'0')}</span></div><div class="content"><div class="copy"><div class="eyebrow">${esc(f.extra.eyebrow||'听见 / 新的开始')}</div><h1>${f.extra.headline.split('|').map(x=>`<span>${esc(x)}</span>`).join('')}</h1><p>${esc(f.extra.subline)}</p><div class="tag"><i></i>${esc(f.extra.tag||'中文动效 · 概念样片')}</div></div><div class="art">${art(i)}</div></div><div class="bottom"><span>${esc(p.parsed.globals.message)}</span><span>${esc(f.extra.footer||'把下一站，交给春天。')}</span></div><div class="progress"></div></div></section>`;
}).join('\n');
const tweens=p.frames.map((f,i)=>{
  const s=f.start/p.fps,d=f.count/p.fps;
  return `tl.fromTo('#scene-${i} .copy',{y:32,opacity:0},{y:0,opacity:1,duration:.65,ease:'power3.out'},${s+.08});
  tl.fromTo('#scene-${i} .art',{scale:.88,opacity:0},{scale:1,opacity:1,duration:.9,ease:'power3.out'},${s+.05});
  tl.fromTo('#scene-${i} .sculpture',{rotation:${paper?-16:0},transformOrigin:'50% 50%'},{rotation:${paper?12:55},duration:${d},ease:'none'},${s});
  tl.fromTo('#scene-${i} .orbit',{x:-8},{x:12,duration:${d},ease:'sine.inOut'},${s});
  tl.fromTo('#scene-${i} .progress',{scaleX:0,transformOrigin:'0% 50%'},{scaleX:1,duration:${d},ease:'none'},${s});`;
}).join('\n');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=${p.width},height=${p.height}"><title>${esc(p.parsed.globals.message)}</title><script src="${esc(p.g.gsap)}"></script><style>
@font-face{font-family:MotionSans;src:url('${esc(p.g.font)}') format('truetype');font-weight:100 900;font-display:block}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#f0ede4;font-family:MotionSans,sans-serif}#root{position:relative;width:100%;height:100%;overflow:hidden;color:#18352e}.scene{position:absolute;inset:0}.inner{position:absolute;inset:0;padding:4.5% 5.5%;display:flex;flex-direction:column}.top,.bottom{display:flex;justify-content:space-between;font-size:${p.width*.0105}px;letter-spacing:2px}.top{padding-bottom:2%;border-bottom:1px solid #728276}.content{display:flex;flex:1;align-items:center;gap:3%;min-height:0}.copy{width:54%;position:relative;z-index:2}.eyebrow{font-size:${p.width*.014}px;letter-spacing:4px;margin-bottom:4%}h1{font-size:${p.width*.064}px;line-height:1.13;font-weight:760;letter-spacing:-2px;margin:0}h1 span{display:block}p{font-size:${p.width*.017}px;line-height:1.6;margin:6% 0 5%;max-width:100%}.tag{font-size:${p.width*.011}px;display:flex;align-items:center;gap:12px;letter-spacing:2px}.tag i{width:9px;height:9px;border-radius:50%;background:${esc(p.g.accent)}}.art{width:44%;aspect-ratio:1}.art svg{display:block;width:100%;height:100%;overflow:visible}.bottom{padding-top:2%;border-top:1px solid #728276;letter-spacing:1px}.dark{color:#f2f0e7}.progress{height:4px;position:absolute;bottom:0;left:0;width:100%;background:${esc(p.g.accent)}}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-width="${p.width}" data-height="${p.height}" data-duration="${p.totalFrames/p.fps}">${scenes}${p.assets.audio?`<audio id="music" src="${esc(p.g.audio)}" data-start="0" data-duration="${p.totalFrames/p.fps}" data-track-index="2" data-volume="0.7"></audio>`:''}</div><script>
document.fonts.ready.then(()=>{const tl=gsap.timeline({paused:true});${tweens}\nwindow.__timelines['main']=tl;});
</script></body></html>`;
fs.writeFileSync(path.join(p.dir,'index.html'),html);
fs.mkdirSync(path.join(p.dir,'reports'),{recursive:true});
const report={status:'passed',format:[p.width,p.height],fps:p.fps,totalFrames:p.totalFrames,scenes:p.frames.map(f=>({start:f.start,frames:f.count,headline:f.extra.headline})),assets:Object.fromEntries(Object.entries(p.assets).map(([k,v])=>[k,{path:path.relative(p.dir,v),sha256:hash(v)}])),storyboardSha256:hash(path.join(p.dir,'STORYBOARD.md')),indexSha256:hash(path.join(p.dir,'index.html')),sync:p.g.sync_required==='true'?'anchors-validated':'not-requested',visualReview:'pending'};
fs.writeFileSync(path.join(p.dir,'reports/build.json'),JSON.stringify(report,null,2));
console.log(`Built ${p.totalFrames} frames / ${p.frames.length} scenes: ${p.dir}`);


}
