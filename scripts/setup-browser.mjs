import fs from 'node:fs';
import path from 'node:path';
import {SKILL,run,hash} from './project.mjs';
import {install,Browser} from '@puppeteer/browsers';
import AdmZip from 'adm-zip';
import {createHash} from 'node:crypto';
const cache=path.resolve(process.argv[2]||path.join(SKILL,'.runtime/browsers'));
const buildId='152.0.7977.30';
let b;
if(process.platform==='win32'&&process.arch==='x64') {
  fs.mkdirSync(cache,{recursive:true});
  const executablePath=path.join(cache,'chrome-headless-shell-win64/chrome-headless-shell.exe');
  if(!fs.existsSync(executablePath)) {
    const zip=path.join(cache,'headless-152.zip');
    const complete=fs.existsSync(zip)&&createHash('md5').update(fs.readFileSync(zip)).digest('hex')==='3a1c9321a297bf0363a44de06b87c567';
    if(!complete)run('curl.exe',['-L','--fail','--silent','--show-error','--max-time','300',...(fs.existsSync(zip)&&fs.statSync(zip).size>0?['-C','-']:[]),'-o',zip,`https://storage.googleapis.com/chrome-for-testing-public/${buildId}/win64/chrome-headless-shell-win64.zip`]);
    const md5=createHash('md5').update(fs.readFileSync(zip)).digest('hex');
    if(md5!=='3a1c9321a297bf0363a44de06b87c567')throw new Error('Browser archive checksum mismatch');
    new AdmZip(zip).extractAllTo(cache,false);
  }
  b={executablePath};
} else b=await install({browser:Browser.CHROMEHEADLESSSHELL,buildId,cacheDir:cache});
const version=run(b.executablePath,['--version']).trim();
const out={browser:b.executablePath,buildId,version,sha256:hash(b.executablePath)};
const configPath=path.join(SKILL,'runtime.local.json');
const previous=fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath,'utf8')):{};
fs.writeFileSync(configPath,JSON.stringify({...previous,...out},null,2));
console.log(JSON.stringify(out,null,2));
