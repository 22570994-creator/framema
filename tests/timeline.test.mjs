import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readProject,run,SKILL,assertBrowserCheck} from '../scripts/project.mjs';
const fixture=`---\nformat: 1280x720\nfps: 30\ntotal_frames: 150\nstrategy: paper\naccent: #cc7755\nfont: font.ttf\ngsap: gsap.js\naudio: none\n---\n\n## Frame 1 — 测试\n- start_frame: 0\n- frames: 150\n- duration: 5s\n- transition_in: cut\n- scene: 测试画面\n- headline: 中文|测试\n`;
function withFixture(source,fn){const d=fs.mkdtempSync(path.join(os.tmpdir(),'motion-test-'));try{fs.writeFileSync(path.join(d,'STORYBOARD.md'),source);fs.writeFileSync(path.join(d,'font.ttf'),'fixture');fs.writeFileSync(path.join(d,'gsap.js'),'fixture');fn(d);}finally{assert.equal(path.dirname(path.resolve(d)),path.resolve(os.tmpdir()));assert.ok(path.basename(d).startsWith('motion-test-'));fs.rmSync(d,{recursive:true,force:true});}}
test('upstream parser preserves Chinese, frame counts, strategy',()=>withFixture(fixture,d=>{const p=readProject(d);assert.equal(p.frames[0].extra.headline,'中文|测试');assert.equal(p.totalFrames,150);assert.equal(p.g.strategy,'paper');}));
for(const [label,from,to,pattern] of [
 ['gap','start_frame: 0','start_frame: 1',/gap/],
 ['fractional frame','frames: 150\n- duration','frames: 149.5\n- duration',/integer/],
 ['wrong total','total_frames: 150','total_frames: 151',/total_frames/],
 ['duration mismatch','duration: 5s','duration: 5.05s',/conflicts/],
 ['audio required','audio: none','audio: none\naudio_required: true',/audio is absent/],
 ['sync without audio','audio: none','audio: none\nsync_required: true\naudiomap: absent.json',/Synchronization requires audio/],
 ['path traversal','font: font.ttf','font: ../outside.ttf',/escapes/],
 ['unknown strategy','strategy: paper','strategy: unknown',/Unknown strategy/],
 ['unknown material','strategy: paper','strategy: paper\nmaterial: unknown',/Unknown material/],
 ['unsupported overlap','transition_in: cut','transition_in: crossfade',/hard cuts/],
 ['missing font','font: font.ttf','font: absent.ttf',/Missing resource/]
])test(`reject ${label}`,()=>withFixture(fixture.replace(from,to),d=>assert.throws(()=>readProject(d),pattern)));
test('reject missing sync map with real audio',()=>withFixture(fixture.replace('audio: none','audio: tone.wav\nsync_required: true\naudiomap: absent.json'),d=>{
 run('ffmpeg',['-v','error','-f','lavfi','-i','sine=duration=5',path.join(d,'tone.wav')]);
 assert.throws(()=>readProject(d),/Missing resource/);
}));
test('reject audio shorter than video',()=>withFixture(fixture.replace('audio: none','audio: tone.wav'),d=>{
 run('ffmpeg',['-v','error','-f','lavfi','-i','sine=duration=1',path.join(d,'tone.wav')]);
 assert.throws(()=>readProject(d),/Audio shorter/);
}));
test('reject audio anchor beyond one frame',()=>withFixture(fixture.replace('audio: none','audio: tone.wav\nsync_required: true\naudiomap: audiomap.json'),d=>{
 run('ffmpeg',['-v','error','-f','lavfi','-i','sine=duration=5',path.join(d,'tone.wav')]);
 fs.writeFileSync(path.join(d,'audiomap.json'),JSON.stringify({fps:30,anchors:[{frame:75,audio_sec:2.54}]}));
 assert.throws(()=>readProject(d),/exceeds one frame/);
}));
test('escape text rather than executing markup',()=>withFixture(fixture.replace('中文|测试','<b>你好</b>|&'),d=>{
 run(process.execPath,[path.join(SKILL,'scripts/build.mjs'),d]);
 const html=fs.readFileSync(path.join(d,'index.html'),'utf8');
 assert.ok(html.includes('&lt;b&gt;你好&lt;/b&gt;'));assert.ok(!html.includes('<b>你好</b>'));
}));
test('reject stale storyboard before launching browser',()=>withFixture(fixture,d=>{
 run(process.execPath,[path.join(SKILL,'scripts/build.mjs'),d]);
 fs.appendFileSync(path.join(d,'STORYBOARD.md'),'\nChanged brief\n');
 assert.throws(()=>run(process.execPath,[path.join(SKILL,'scripts/hf.mjs'),'check',d]),/Source changed since build/);
}));
test('reject changed asset before launching browser',()=>withFixture(fixture,d=>{
 run(process.execPath,[path.join(SKILL,'scripts/build.mjs'),d]);
 fs.appendFileSync(path.join(d,'font.ttf'),'changed');
 assert.throws(()=>run(process.execPath,[path.join(SKILL,'scripts/hf.mjs'),'check',d]),/Asset changed since build/);
}));
const completeCheck={ok:true,browserSkipped:false,lint:{ok:true},runtime:{ok:true},layout:{samples:[1]},contrast:{enabled:true,checked:1}};
test('accept actual browser check including warnings',()=>assert.doesNotThrow(()=>assertBrowserCheck({...completeCheck,layout:{samples:[1],warningCount:1}})));
test('reject check when browser was skipped',()=>assert.throws(()=>assertBrowserCheck({...completeCheck,browserSkipped:true}),/incomplete/));
test('reject check with zero sampled frames',()=>assert.throws(()=>assertBrowserCheck({...completeCheck,layout:{samples:[]}}),/incomplete/));
test('reject check with disabled contrast on text templates',()=>assert.throws(()=>assertBrowserCheck({...completeCheck,contrast:{enabled:false,checked:0}}),/incomplete/));
