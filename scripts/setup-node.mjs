import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import {SKILL,run,hash} from './project.mjs';
if(process.platform!=='win32'||process.arch!=='x64')throw new Error('This bootstrap is for Windows x64; other platforms must validate their own Node 22 runtime');
const base=path.resolve(process.argv[2]||path.join(SKILL,'.runtime'));
const node=path.join(base,'node-v22.20.0-win-x64/node.exe');
if(!fs.existsSync(node)) {
 fs.mkdirSync(base,{recursive:true});
 const zip=path.join(base,'node22.zip'),expected='bb819d6eb8f5bfda294bbc83a7e4ec6539da67c4233d54b0d655b9248b15e29d';
 if(!fs.existsSync(zip)||hash(zip)!==expected)run('curl.exe',['-L','--fail','--silent','--show-error','--max-time','300',...(fs.existsSync(zip)&&fs.statSync(zip).size?['-C','-']:[]),'-o',zip,'https://nodejs.org/dist/v22.20.0/node-v22.20.0-win-x64.zip']);
 if(hash(zip)!==expected)throw new Error('Node distribution SHA256 mismatch');
 new AdmZip(zip).extractAllTo(base,false);
}
const version=run(node,['--version']).trim();
if(version!=='v22.20.0')throw new Error(`Unexpected Node version: ${version}`);
const file=path.join(SKILL,'runtime.local.json');
const config=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
fs.writeFileSync(file,JSON.stringify({...config,node},null,2));
console.log(JSON.stringify({node,version,sha256:hash(node)},null,2));
