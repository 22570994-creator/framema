import {spawn} from 'node:child_process';

// FFmpeg pipe chunks need not end on float boundaries. Keep at most 3 bytes.
export async function scanFloat32(chunks) {
  let tail=Buffer.alloc(0), count=0, energy=0, peak=0, first=-1;
  for await(const chunk of chunks) {
    const data=tail.length?Buffer.concat([tail,chunk]):chunk;
    const end=data.length-data.length%4;
    for(let i=0;i<end;i+=4) {
      const x=data.readFloatLE(i);
      if(!Number.isFinite(x))throw Error('Non-finite decoded audio sample');
      energy+=x*x;peak=Math.max(peak,Math.abs(x));
      if(first<0&&Math.abs(x)>.035)first=count;
      count++;
    }
    tail=Buffer.from(data.subarray(end));
  }
  if(tail.length)throw Error('Truncated float32 audio sample');
  if(!count)throw Error('Decoded audio is empty');
  return {rms:Math.sqrt(energy/count),peak,first,samples:count};
}

export async function audioSignal(file) {
  const child=spawn('ffmpeg',['-v','error','-xerror','-i',file,'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let stderr='';
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-8192);});
  const ended=new Promise((resolve,reject)=>{
    child.once('error',reject);
    child.once('close',code=>code===0?resolve():reject(Error(`Audio decode failed (${code}): ${stderr}`)));
  });
  try {const [signal]=await Promise.all([scanFloat32(child.stdout),ended]);return signal;}
  catch(error){child.kill();throw error;}
}
