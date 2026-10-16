'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const test=require('node:test');
const rawCatalog=require('../../data/catalog.json');
const {loadCatalog,validateCatalog}=require('./catalog.cjs');

const root=path.resolve(__dirname,'../..');
const cloneCatalog=()=>structuredClone(rawCatalog);

test('catalog loads, validates, and expands manuscript chapters',()=>{
 const catalog=loadCatalog(root);
 assert.equal(catalog.stories.length,rawCatalog.stories.length);
 assert.ok(catalog.stories.find(story=>story.manuscript)?.chapters.length>0);
});

test('catalog schema reports a missing collection with its field path',()=>{
 const catalog=cloneCatalog();
 delete catalog.music;
 assert.throws(()=>validateCatalog(catalog,root),/schema validation failed: \/ must have required property 'music'/);
});

test('catalog schema rejects invalid status values',()=>{
 const catalog=cloneCatalog();
 catalog.stories[0].status='published';
 assert.throws(()=>validateCatalog(catalog,root),/schema validation failed: \/stories\/0\/status/);
});

test('catalog schema rejects incorrect nested value types',()=>{
 const catalog=cloneCatalog();
 catalog.music[0].bpm='slow';
 assert.throws(()=>validateCatalog(catalog,root),/schema validation failed: \/music\/0\/bpm/);
});

test('catalog business validation rejects duplicate item identifiers',()=>{
 const catalog=cloneCatalog();
 catalog.tools[1].title=catalog.tools[0].title;
 assert.throws(()=>validateCatalog(catalog,root),/duplicate tools entry/);
});

test('catalog business validation rejects untrusted tool protocols',()=>{
 const catalog=cloneCatalog();
 catalog.tools[0].href='http://lucas-tools.example/';
 assert.throws(()=>validateCatalog(catalog,root),/schema validation failed: \/tools\/0\/href/);
});
