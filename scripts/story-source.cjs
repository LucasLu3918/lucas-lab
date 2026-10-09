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
 const headings=[...source.matchAll(/^(## (?:序章|尾聲)：[^\n]+|### 第[一二三四五六七八九十]+章：[^\n]+)$/gm)];
 const parts=[...source.matchAll(/^## 第[一二三四五六七八九十]+部：[^\n]+$/gm)];
 if(headings.length<3||!headings[0][0].startsWith('## 序章：')||!headings.at(-1)[0].startsWith('## 尾聲：'))throw new Error('Manuscript needs prologue, chapters and epilogue: '+relativePath);
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
 const numeric=chapters.filter(c=>c.title.startsWith('第')&&c.title.includes('章：'));
 if(numeric.length!==headings.length-2)throw new Error('Chapter numbering mismatch: '+relativePath);
 return chapters;
}
module.exports={loadMarkdownChapters};
