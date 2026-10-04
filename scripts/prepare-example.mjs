import fs from 'node:fs';import path from 'node:path';import {SKILL} from './project.mjs';
const [target]=process.argv.slice(2);if(!target)throw Error('Usage: prepare-example.mjs EXAMPLE_DIR');const d=path.resolve(target);if(!fs.existsSync(path.join(d,'project.json')))throw Error('Example project.json missing');fs.mkdirSync(path.join(d,'assets'),{recursive:true});
for(const f of ['NotoSansSC.ttf','OFL.txt']){const to=path.join(d,'assets',f);if(!fs.existsSync(to))fs.copyFileSync(path.join(SKILL,'assets',f),to);}
const gsap=path.join(d,'assets/gsap.min.js');if(!fs.existsSync(gsap))fs.copyFileSync(path.join(SKILL,'node_modules/gsap/dist/gsap.min.js'),gsap);console.log('Example dependencies ready: '+d);
