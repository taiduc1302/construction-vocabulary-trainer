import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {escapeXml,TARGETS,validateConfig,renderPromoSvg} from './core.mjs';

const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(HERE,'../..');
const config=JSON.parse(readFileSync(join(HERE,'promo.config.json'),'utf8'));
assert.equal(validateConfig(config),config);
assert.deepEqual(Object.keys(TARGETS),['readme','og','linkedin','instagram-portrait']);
for(const [id,spec] of Object.entries(TARGETS)){
  assert.ok(spec.width>=1080&&spec.height>=627);
  assert.equal(typeof id,'string');
}
assert.equal(escapeXml(`<script src="x">&'`),'&lt;script src=&quot;x&quot;&gt;&amp;&apos;');
for(const bad of [
  {...config,featuredTermId:'../../secrets'},
  {...config,targets:['og','og']},
  {...config,targets:['not-app-store']},
  {...config,headline:'<script>\u0001'},
  {...config,featureLabels:[]}
])assert.throws(()=>validateConfig(bad));
const term={id:config.featuredTermId,term:'duct bank',definition_en:'A grouped system of conduits underground.'};
const diagramCss='.tv-concrete{fill:#d8d8d4}.tv-label{fill:#244f42}';
const diagram='<rect class="tv-concrete" x="0" y="0" width="320" height="180"/>';
for(const target of config.targets){
  const svg=renderPromoSvg(config,{target,term,svgBody:diagram,diagramCss});
  const {width,height}=TARGETS[target];
  assert.match(svg,new RegExp(`<svg[^>]*width="${width}" height="${height}"`));
  assert.ok(svg.includes('role="img"'));
  assert.ok(svg.includes('<title id="promoTitle">'));
  assert.ok(svg.includes('prefers-reduced-motion'));
  assert.ok(svg.includes(term.definition_en));
  assert.ok(!svg.includes('<script'));
  assert.ok(!svg.includes('https://'));
  assert.ok(!svg.includes('file://'));
  assert.ok(Buffer.byteLength(svg)<240*1024,'SVG size budget');
  assert.equal(renderPromoSvg(config,{target,term,svgBody:diagram,diagramCss}),svg,'renderer must be deterministic');
}
for(const hostile of ['<script>alert(1)</script>','<image href="https://elsewhere/secret.png"/>','<g onclick="alert(1)"></g>']){
  assert.throws(()=>renderPromoSvg(config,{target:'og',term,svgBody:hostile,diagramCss}),/Unsafe/);
}
const app=readFileSync(join(ROOT,'index.html'),'utf8');
for(const copy of ['Construction English','Smart 10','Dictionary','Drawing','Progress'])assert.ok(app.includes(copy),'promo copy must be grounded in live UI: '+copy);
const vocab=[...JSON.parse(readFileSync(join(ROOT,'data/terms.json'),'utf8')),...JSON.parse(readFileSync(join(ROOT,'data/terms-expansion.json'),'utf8'))];
assert.ok(vocab.find(item=>item.id===config.featuredTermId&&item.term&&item.definition_en));
execFileSync(process.execPath,[join(HERE,'generate.mjs'),'--check'],{cwd:ROOT,stdio:'inherit'});
console.log('Promo visual tests OK: dimensions, safe canonical geometry, no remote assets, determinism, privacy guard, source-grounded terms, reduced motion, checked-in assets.');
