import assert from 'node:assert/strict';
import {getDrawingScenes,randomDrawingTarget,renderDrawingScene} from '../src/drawing-challenges.js';

const scenes=getDrawingScenes();
assert.ok(scenes.length>=3,'expected the core Drawing Challenge scenes');

for(const scene of scenes){
  assert.ok(scene.id&&scene.title&&scene.description&&scene.svg,`scene ${scene.id||'(missing)'} should be complete`);
  assert.ok(scene.targets.length>=2,`scene ${scene.id} should have multiple targets`);
  assert.equal(new Set(scene.targets.map(t=>t.label)).size,scene.targets.length,`scene ${scene.id} labels should be unique`);
  assert.equal(new Set(scene.targets.map(t=>t.termId)).size,scene.targets.length,`scene ${scene.id} terms should be unique`);
  const rendered=renderDrawingScene(scene);
  assert.ok(rendered.includes(scene.svg),`scene ${scene.id} should render its SVG`);
  assert.ok(rendered.includes(scene.description),`scene ${scene.id} should render its description`);
}

{
  const firstCopy=getDrawingScenes();
  firstCopy[0].targets[0].label='Z';
  const secondCopy=getDrawingScenes();
  assert.notEqual(secondCopy[0].targets[0].label,'Z','getDrawingScenes should protect source target objects from mutation');
}

{
  const scene=getDrawingScenes()[0];
  const previous=scene.targets[0].termId;
  const picked=randomDrawingTarget(scene,previous,()=>0);
  assert.notEqual(picked.termId,previous,'random target should avoid the immediately previous term when alternatives exist');
}

{
  const scene={targets:[{label:'A',termId:'only'}]};
  const picked=randomDrawingTarget(scene,'only',()=>0.75);
  assert.equal(picked.termId,'only','single-target scenes should fall back safely if no alternative exists');
}

console.log(`Drawing Challenge tests OK: ${scenes.length} scenes clone safely, render correctly, and avoid immediate target repeats.`);
