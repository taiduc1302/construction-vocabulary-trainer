import assert from 'node:assert/strict';
import {normalizeTermSearch,findExactVocabularyTerm,searchVocabulary} from '../src/term-search.js';

const terms=[
  {
    id:'pvc-db2',term:'PVC DB2',
    aliases_en:['Type DB-2','DB2'],
    drawing_labels:['DB2'],
    translation_ru:['ПВХ канал DB2'],
    translation_vi:['ống nhựa PVC DB2 chôn ngầm'],
    definition_en:'Underground electrical duct.',
    explanation_ru:'Подземный кабельный duct.'
  },
  {
    id:'sheet-pile',term:'sheet pile',
    aliases_en:['sheet piling'],
    drawing_labels:[],
    translation_ru:['шпунт','шпунтовая свая'],
    translation_vi:['cọc ván thép'],
    definition_en:'Interlocking structural section used for excavation support.',
    explanation_ru:'Шпунтовая свая.'
  },
  {
    id:'catch-basin',term:'catch basin',
    aliases_en:[],
    drawing_labels:['CB'],
    translation_ru:['дождеприёмный колодец'],
    translation_vi:['hố thu nước mưa'],
    definition_en:'Drainage inlet structure.',
    explanation_ru:'Принимает поверхностный сток.'
  }
];

assert.equal(normalizeTermSearch('  Type DB-2  '),'type db 2');
assert.equal(normalizeTermSearch('ШПУНТ'),'шпунт');
assert.equal(normalizeTermSearch('ống  nhựa'),'ống nhựa');

assert.equal(findExactVocabularyTerm(terms,'DB2')?.id,'pvc-db2');
assert.equal(findExactVocabularyTerm(terms,'шпунт')?.id,'sheet-pile');
assert.equal(findExactVocabularyTerm(terms,'hố thu nước mưa')?.id,'catch-basin');
assert.equal(findExactVocabularyTerm(terms,'CB')?.id,'catch-basin');

assert.equal(searchVocabulary(terms,'sheet')[0]?.term.id,'sheet-pile');
assert.equal(searchVocabulary(terms,'шпун')[0]?.term.id,'sheet-pile');
assert.equal(searchVocabulary(terms,'ống nhựa')[0]?.term.id,'pvc-db2');
assert.equal(searchVocabulary(terms,'drainage inlet')[0]?.term.id,'catch-basin');
assert.equal(searchVocabulary(terms,'not present').length,0);

const db2=searchVocabulary(terms,'DB2');
assert.equal(db2[0].term.id,'pvc-db2');
assert.ok(db2[0].score>=90);

console.log('Term-search tests OK: Unicode, aliases, drawing labels, translations, partial matching and definitions.');
