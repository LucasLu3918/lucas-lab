// Checks expert-dialogue-draft.md against the game's dialogue rules. Run: node expert-dialogue.check.cjs
// Lines look like "- speaker｜text". Rules: known speaker, 1-80 characters, the player (妳) never speaks,
// no exclamation marks, and the seven apprentices keep their names apart from the canon miners.
const fs=require('fs'),path=require('path'),assert=require('assert');
const md=fs.readFileSync(path.join(__dirname,'expert-dialogue-draft.md'),'utf8');
const SPEAKERS=new Set(['narrator','mirror','lucy','vera','eli','orion','nyla','heso','hunter']);
const MINERS=['奈菈','魯恩','赫索','莫格','奇妲','斐恩','提米'];
const lines=[...md.matchAll(/^- (\w+)｜(.+)$/gm)].map(m=>({speaker:m[1],text:m[2]}));
assert.ok(lines.length>=40,'too few dialogue lines: '+lines.length);
for(const {speaker,text} of lines){
 assert.ok(SPEAKERS.has(speaker),'unknown speaker '+speaker);
 assert.ok(text.length>=1&&text.length<=80,'line over 80 characters ('+text.length+'): '+text);
 assert.ok(!/[!！]/.test(text),'exclamation mark: '+text);
}
// the apprentices are the only holders; no canon miner name appears in any spoken line
for(const {text} of lines)for(const m of MINERS)assert.ok(!text.includes(m),'canon miner '+m+' in: '+text);
// vera speaks exactly once (a recorded line)
assert.strictEqual(lines.filter(l=>l.speaker==='vera').length,1);
// apprentice card lines are at most 40 characters
const cards=[...md.matchAll(/^\| \d \| (\S+) \| .+? \| 「(.+)」 \|$/gm)];
assert.strictEqual(cards.length,7,'expected seven apprentice rows, got '+cards.length);
for(const [,name,quote] of cards)assert.ok(quote.length<=40,name+' card line too long');
console.log('OK: '+lines.length+' dialogue lines, 7 apprentice cards; longest line '+Math.max(...lines.map(l=>l.text.length))+' characters');
