import fs from 'node:fs';
import path from 'node:path';
import {readProject,run,hash} from './project.mjs';
const p=readProject(path.resolve(process.argv[2]||'.')), video=path.join(p.dir,'renders/final.mp4');
const info=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',video]));
const v=info.streams.find(x=>x.codec_type==='video'),a=info.streams.find(x=>x.codec_type==='audio');
const errors=[];
if(!v) errors.push('Video stream absent');
else {
 if(Number(v.nb_read_frames)!==p.totalFrames) errors.push(`Wrong decoded frame count: ${v.nb_read_frames}`);
 if(v.width!==p.width||v.height!==p.height) errors.push('Wrong canvas');
 const [n,d]=v.avg_frame_rate.split('/').map(Number); if(n/d!==p.fps)errors.push('Wrong FPS');
 if(Math.abs(Number(v.duration)-p.totalFrames/p.fps)>1/p.fps+.00001)errors.push('Video duration mismatch');
}
if((p.assets.audio||p.expectedAudio)&&!a)errors.push('Audio stream absent');
if(a&&Math.abs(Number(a.duration)-p.totalFrames/p.fps)>Math.max(1/p.fps,2048/Number(a.sample_rate)))errors.push('Audio duration mismatch beyond codec padding allowance');
let pulse=null,audioSignal=null;
if(a) {
 const raw=run('ffmpeg',['-v','error','-i',video,'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1'],{encoding:null});
 let energy=0,peak=0,first=-1;
 for(let i=0;i<raw.length/4;i++){const x=raw.readFloatLE(i*4);energy+=x*x;peak=Math.max(peak,Math.abs(x));if(first<0&&Math.abs(x)>.035)first=i;}
 audioSignal={rms:Math.sqrt(energy/(raw.length/4)),peak};
 if(audioSignal.rms<1e-6)errors.push('Audio stream is effectively silent');
 if(p.g.sync_required==='true') {
  const map=JSON.parse(fs.readFileSync(path.join(p.dir,p.g.audiomap),'utf8'));
  if(map.kind==='test-pulse') {
   const actual=first/48000,expected=map.anchors[0].audio_sec;
   pulse={expected,actual,frameError:Math.abs(actual-expected)*p.fps};
   if(first<0||pulse.frameError>1)errors.push('Rendered audio pulse exceeds one-frame alignment');
  }
 }
}
try {run('ffmpeg',['-v','error','-xerror','-i',video,'-f','null','-']);}catch(e){errors.push(String(e));}
const times=p.frames.map(f=>(f.start+Math.floor(f.count/2))/p.fps);
for(let i=0;i<times.length;i++)run('ffmpeg',['-y','-v','error','-ss',String(times[i]),'-i',video,'-frames:v','1',path.join(p.dir,`reports/frame-${i+1}.png`)]);
run('ffmpeg',['-y','-v','error','-i',video,'-vf',`fps=1/${p.totalFrames/p.fps/p.frames.length},scale=480:-1,tile=${p.frames.length}x1`,'-frames:v','1',path.join(p.dir,'reports/contact-sheet.png')]);
fs.copyFileSync(path.join(p.dir,'reports/frame-1.png'),path.join(p.dir,'renders/poster.png'));
const report={status:errors.length?'failed':'passed',errors,decodedFrames:Number(v?.nb_read_frames),expectedFrames:p.totalFrames,fps:p.fps,canvas:[v?.width,v?.height],videoDuration:v?.duration,audioDuration:a?.duration,audioCodec:a?.codec_name,audioSignal,pulse,sha256:hash(video),decode:'completed',visualReview:'pending',audioListening:'pending',beatSync:p.g.sync_required==='true'?'timeline anchors checked; perceptual sync pending':'not requested',frames:times};
fs.writeFileSync(path.join(p.dir,'reports/qc-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
