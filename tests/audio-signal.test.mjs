import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {scanFloat32,audioSignal} from '../scripts/lib/audio-signal.mjs';
import {hash} from '../scripts/project.mjs';

test('PCM scanner preserves samples split across arbitrary pipe boundaries',async()=>{
  const b=Buffer.alloc(16);[0,.5,-.25,0].forEach((v,i)=>b.writeFloatLE(v,i*4));
  const s=await scanFloat32([b.subarray(0,1),b.subarray(1,7),b.subarray(7,8),b.subarray(8)]);
  assert.equal(s.samples,4);assert.equal(s.first,1);assert.equal(s.peak,.5);
  assert.equal(s.rms,Math.sqrt(.3125/4));
});
test('PCM scanner rejects empty, partial and non-finite samples',async()=>{
  await assert.rejects(scanFloat32([]),/empty/);
  await assert.rejects(scanFloat32([Buffer.alloc(3)]),/Truncated/);
  const b=Buffer.alloc(4);b.writeFloatLE(NaN);await assert.rejects(scanFloat32([b]),/Non-finite/);
});
test('PCM scanner handles more than the former 32 MiB buffer limit',async()=>{
  const block=Buffer.alloc(65536);block.writeFloatLE(.5);
  async function* chunks(){for(let i=0;i<600;i++)yield block;}
  const s=await scanFloat32(chunks());assert.equal(s.samples,600*16384);assert.equal(s.first,0);
  assert.equal(s.rms,Math.sqrt(.25/16384));
});
test('chunked file hash matches SHA256 across buffer boundaries',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'framema-hash-'));
  try {const b=Buffer.alloc(2*1024*1024+7,37),f=path.join(dir,'data');fs.writeFileSync(f,b);assert.equal(hash(f),createHash('sha256').update(b).digest('hex'));}
  finally {fs.rmSync(dir,{recursive:true,force:true});}
});
const ffmpeg=spawnSync('ffmpeg',['-version'],{windowsHide:true});
test('real decoder surfaces invalid input errors',{skip:ffmpeg.status!==0},async()=>{
  await assert.rejects(audioSignal(path.join(os.tmpdir(),'framema-no-such-audio-input.wav')),/decode failed|empty/i);
});
