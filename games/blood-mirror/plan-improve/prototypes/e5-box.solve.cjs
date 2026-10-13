// Extracts the rules from e5-box.html and proves the design claims. Run: node e5-box.solve.cjs
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'e5-box.html'),'utf8');
const sb={module:{exports:{}}};vm.runInNewContext(html.match(/<script data-core>([\s\S]*?)<\/script>/)[1],sb);
const c=sb.module.exports;
// the alphabet is the 37 standard symbols, no duplicates
assert.strictEqual(c.ZHUYIN37.length,37);assert.strictEqual(new Set(c.ZHUYIN37).size,37);
// the cipher round-trips and every key/plain/cipher symbol is in the alphabet
assert.strictEqual(c.decrypt(c.CIPHER,c.KEYS),c.PLAIN);
for(const s of [...c.PLAIN,...c.KEYS,...c.CIPHER])assert.ok(c.idx(s)>=1);
assert.strictEqual(c.KEYS.length,4);assert.strictEqual(new Set(c.KEYS).size,4,'keys must differ');
// the cipher face is sensitive to every key: changing any one key letter changes the result, so a player cannot skip a level
for(let i=0;i<4;i++)for(const z of c.ZHUYIN37){if(z===c.KEYS[i])continue;const k=[...c.KEYS];k[i]=z;assert.notStrictEqual(c.decrypt(c.CIPHER,k),c.PLAIN,'key '+i+' = '+z+' also works');}
// each letter's shift is unique: only offset = key index gives the plaintext letter
for(let i=0;i<4;i++){let ok=0;for(let o=0;o<37;o++){if(c.ZHUYIN37[(((c.idx(c.CIPHER[i])-1-o)%37)+37)%37]===c.PLAIN[i])ok++;}assert.strictEqual(ok,1);}
// gating: every face except the shard face needs an item; the cipher face needs all four; nothing is open without items
const none={items:{},shards:0},all={items:{ring:1,prism:1,antidote:1,thread:1},shards:7};
for(const f of c.FACES){assert.ok(c.owns(all,f.needs),f.id+' closed with everything');if(f.needs)assert.ok(!c.owns(none,f.needs),f.id+' open with nothing');}
for(const k of c.KEY_ORDER){const inv={items:{...all.items,[k]:0},shards:7};assert.ok(!c.owns(inv,'all4'),'cipher opens without '+k);}
// every face has a three-tier hint and the last tier names the answer
for(const f of c.FACES){const h=c.HINTS[f.id];assert.strictEqual(h.length,3,f.id);h.forEach(t=>assert.ok(t.length>5));}
assert.ok(c.HINTS.time[2].includes('13'));assert.ok(c.HINTS.light[2].includes('紅')&&c.HINTS.light[2].includes('藍')&&c.HINTS.light[2].includes('綠'));
assert.ok(c.HINTS.apple[2].includes('7'));assert.ok(c.HINTS.thread[2].includes('星'));assert.ok(c.HINTS.cipher[2].includes(c.PLAIN));
// the clue each earlier level hands over names the same answer the face wants
assert.ok(c.ITEMS.antidote.note.includes('7'));assert.ok(c.ITEMS.ring.note.includes('13'));
assert.ok(c.THREAD.every(t=>c.ITEMS.thread.note.includes(t)));
console.log('cipher',c.CIPHER,'<-',c.KEYS.join(''),'->',c.PLAIN);
console.log('OK: E5 rules verified');
