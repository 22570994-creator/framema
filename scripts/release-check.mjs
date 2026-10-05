import fs from 'node:fs';import path from 'node:path';import {hash,local} from './project.mjs';
const dir=path.resolve(process.argv[2]||'.');
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const receipt=read('reports/render-receipt.json');
if(receipt.buildSha256!==hash(path.join(dir,'reports/build.json'))||receipt.videoSha256!==hash(path.join(dir,'renders/final.mp4')))throw Error('Render receipt does not match build/video');
const build=read('reports/build.json'),qc=read('reports/qc-report.json'),review=read('reports/art-review.json');
if(qc.status!=='passed'||qc.sha256!==hash(path.join(dir,'renders/final.mp4')))throw Error('Technical evidence stale or failed');
if(review.buildSha256!==hash(path.join(dir,'reports/build.json'))||review.videoSha256!==qc.sha256)throw Error('Art review belongs to another build/video');
if(build.indexSha256!==hash(path.join(dir,'index.html')))throw Error('HTML changed after build');
if(build.sourceHashes)for(const [f,h]of Object.entries(build.sourceHashes))if(hash(local(dir,f))!==h)throw Error('Source changed after art review');
const text=value=>typeof value==='string'&&value.trim().length>0;
if(review.decision!=='ready-for-user-review'||!text(review.reviewer)||!Array.isArray(review.evidence)||!review.evidence.length||!Array.isArray(review.criteria)||!review.criteria.length)throw Error('Art review incomplete or requests revision');
for(const e of review.evidence){if(!e||!text(e.file))throw Error('Missing frame evidence');const f=local(dir,e.file);if(!fs.statSync(f).isFile()||!Number.isFinite(e.time)||e.time<0||!text(e.observation))throw Error('Frame evidence needs a file, non-negative time and observation');}
if(review.criteria.some(c=>!c||!text(c.name)||!text(c.observation)||!['pass','reviewed'].includes(c.status)))throw Error('Unresolved art critique');
console.log('Ready for user review: technical and author art-review evidence match. This does not constitute user approval or an objective aesthetic score.');
