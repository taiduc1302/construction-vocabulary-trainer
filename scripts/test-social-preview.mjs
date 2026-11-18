import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,base));
const publicImage='https://taiduc1302.github.io/construction-vocabulary-trainer/assets/promo/og.png';
const screenshot=read('assets/promo/og.png');
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
assert.ok(screenshot.subarray(0,8).equals(pngSignature),'Social preview image must be a real PNG file');
assert.equal(screenshot.toString('ascii',12,16),'IHDR','Expected a standard IHDR PNG image');
assert.equal(screenshot.readUInt32BE(16),1200,'OG image width must be 1200 pixels');
assert.equal(screenshot.readUInt32BE(20),630,'OG image height must be 630 pixels');
assert.ok(screenshot.length<=300*1024,'OG preview should remain a small, fast-to-crawl image');

for(const name of ['index.html','term.html']){
  const html=read(name).toString('utf8');
  assert.match(html,/<meta property="og:type" content="website"/);
  assert.match(html,/<meta property="og:image:width" content="1200"/);
  assert.match(html,/<meta property="og:image:height" content="630"/);
  assert.match(html,/<meta property="og:image:type" content="image\/png"/);
  assert.match(html,/<meta property="og:image:alt" content="[^"]+"/);
  assert.match(html,/<meta name="twitter:card" content="summary_large_image"/);
  for(const prop of ['og:image','og:image:secure_url']){
    const match=html.match(new RegExp('<meta property="'+prop+'" content="([^"]+)"'));
    assert.ok(match,name+' missing '+prop);
    assert.equal(match[1],publicImage,name+' must use a verified absolute HTTPS URL');
  }
  assert.match(html,/name="twitter:image"/);
  assert.ok(!html.includes('<meta property="og:image" content="assets/promo/og.svg"'),'Crawlers need PNG, not SVG');
}
const sw=read('sw.js').toString('utf8');
const assetList=sw.match(/const ASSETS=\[([\s\S]*?)\];/)?.[1]||'';
assert.ok(!assetList.includes('assets/promo/og.png'),'Social-only PNG should not increase offline app precache');
const promoGenerator=read('tools/promo/generate.mjs').toString('utf8');
assert.match(promoGenerator,/renderPromoSvg/,'Image must be generated from canonical local vocab');
const source=JSON.parse(read('data/terms.json').toString('utf8'));
assert.ok(source.some(term=>term.id==='duct-bank'),'Illustrated term should remain in canonical vocabulary');
console.log('Social preview OK: real optimized 1200x630 PNG, secure share metadata on both pages, source provenance, no PWA payload growth.');
