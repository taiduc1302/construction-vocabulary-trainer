import assert from 'node:assert/strict';
import {matchesDictionaryTerm,maskDefinitionAnswer,selectedFeedbackLanguage} from '../src/learning-quality.js';

const entry={
  id:'pvc-db2',term:'PVC DB2',category:'utilities',
  aliases_en:['DB2','Type DB-2'],drawing_labels:['DB2'],
  translation_ru:['ПВХ кабельный канал'],translation_vi:['ống nhựa điện ngầm'],
  definition_en:'Underground electrical conduits.',explanation_ru:'Подземный кабельный канал.',
  example_en:'Install DB2 conduits in a trench.',scenario:'Excavate and lay conduit.',
  common_mistakes:['Not pressure water piping.']
};
for(const query of ['DB2','db-2','type db 2','ПВХ','кабельный','ống nhựa','ĐIỆN NGẦM','electrical','pressure water','trench']){
  assert.equal(matchesDictionaryTerm(entry,query),true,'Canonical dictionary search should match '+query);
}
for(const query of ['not a word','volumetric','sewer pipe']){
  assert.equal(matchesDictionaryTerm(entry,query),false,'Unrelated query should not match '+query);
}
assert.equal(matchesDictionaryTerm(entry,'  '),true);
assert.equal(matchesDictionaryTerm(null,'x'),false);
assert.equal(matchesDictionaryTerm({term:'steel pile'},'PILE'),true);

assert.equal(maskDefinitionAnswer({term:'asphalt',definition_en:'Asphalt is often placed over aggregate.'}),
  '_____ is often placed over aggregate.');
assert.equal(maskDefinitionAnswer({term:'FRE',definition_en:'The FRE adjustment is needed; it is not freestanding.'}),
  'The _____ adjustment is needed; it is not freestanding.');
assert.equal(maskDefinitionAnswer({term:'cold milling',definition_en:'Cold milling removes pavement before overlay.'}),
  '_____ removes pavement before overlay.');
assert.equal(maskDefinitionAnswer({term:'drain',definition_en:'Drainage is designed to divert water.'}),
  'Drainage is designed to divert water.','Do not mask substrings of longer words');
assert.equal(maskDefinitionAnswer({term:'D/B',definition_en:'D/B is shown in this drawing.'}),
  '_____ is shown in this drawing.','Regex punctuation in term must be handled');
assert.equal(maskDefinitionAnswer({term:'volumetric',definition_en:'Relates to volume.'}),'Relates to volume.');

const tr={explanation_ru:'Проектная отметка.',translation_ru:['отметка'],translation_vi:['cao độ thiết kế']};
assert.deepEqual(selectedFeedbackLanguage(tr,'ru'),{label:'RU',text:'Проектная отметка.'});
assert.deepEqual(selectedFeedbackLanguage(tr,'vi'),{label:'VI',text:'cao độ thiết kế'});
assert.equal(selectedFeedbackLanguage(tr,'en'),null);
assert.equal(selectedFeedbackLanguage(tr,'other'),null);
assert.deepEqual(selectedFeedbackLanguage({translation_ru:['изыскания']},'ru'),{label:'RU',text:'изыскания'});
console.log('Learning quality tests OK: consistent multilingual dictionary search, answer-safe definition masking, and selected-language feedback.');
