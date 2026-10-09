'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sourceRoot=path.join(root,'content','stories');

function loadMarkdownChapters(relativePath){
 if(typeof relativePath!=='string'||!/^content\/stories\/[a-z0-9-]+\.md$/.test(relativePath))throw new Error('Invalid story manuscript path');
 const file=path.resolve(root,relativePath);
 if(!file.startsWith(sourceRoot+path.sep))throw new Error('Story manuscript must stay inside content/stories');
 const source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');
 const headings=[...source.matchAll(/^(## (?:序章|序幕|終章|尾聲)：[^\n]+|### 第[一二三四五六七八九十百]+章：[^\n]+)$/gm)];
 const parts=[...source.matchAll(/^## 第[一二三四五六七八九十]+部：[^\n]+$/gm)];
 if(headings.length<3||!/^## (?:序章|序幕)：/.test(headings[0][0])||!/^## (?:終章|尾聲)：/.test(headings.at(-1)[0]))throw new Error('Manuscript needs prologue and complete ending: '+relativePath);
 const chapters=headings.map((match,index)=>{
  const next=headings[index+1]?.index??source.length;
  const body=source.slice(match.index+match[0].length,next);
  const paragraphs=body.split('\n').map(line=>line.trim()).filter(line=>line&&!/^## 第[一二三四五六七八九十]+部：/.test(line));
  if(paragraphs.length<2)throw new Error('Empty or incomplete chapter: '+match[0]);
  const part=parts.filter(x=>x.index<match.index).at(-1);
  return {
   id:String(index).padStart(2,'0'),
   title:match[0].replace(/^#{2,3} /,''),
   part:match[0].startsWith('###')?part?.[0].replace(/^## /,'')||'': '',
   paragraphs
  };
 });
 const numeric=chapters.filter(c=>/^第[一二三四五六七八九十百]+章：/.test(c.title));
 if(numeric.length<1||numeric.length>50)throw new Error('Invalid main chapter count: '+relativePath);
 const ended=chapters.slice(1+numeric.length);
 if(!ended.length||ended.length>2||ended.some(c=>!/^終章：|^尾聲：/.test(c.title)))throw new Error('Missing or ambiguous ending: '+relativePath);
 if(chapters.length!==numeric.length+1+ended.length)throw new Error('Unexpected section order: '+relativePath);

 return chapters;
}
module.exports={loadMarkdownChapters};
