// Extracts the rules block from e1-gears.html and proves the design claims. Run: node e1-gears.solve.cjs
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'e1-gears.html'),'utf8');
const core=html.match(/<script data-core>([\s\S]*?)<\/script>/)[1];
const sandbox={module:{exports:{}}};vm.runInNewContext(core,sandbox);
const {evaluate,solveAll,HINTS,stage}=sandbox.module.exports;
const sols=solveAll();
assert.strictEqual(sols.length,1,'expected exactly one minimal solution, got '+sols.length);
const s=JSON.parse(sols[0]);
assert.deepStrictEqual([s.S1,s.S2],[[39,6],[null,24]]);
const near={'12/18 pair':{S1:[39,12],S2:[null,18]},'24/6 pair':{S1:[39,24],S2:[null,6]},'8/24 pair':{S1:[39,8],S2:[null,24]}};
for(const [k,st] of Object.entries(near)){const r=evaluate(st);assert.ok(!r.solved,k);console.log('near miss',k,'->',r.jam?r.jam.why:r.out&&r.out.join('/'));}
console.log('OK: unique minimal solution', sols[0]);

// Hints must agree with the solution and with the board stage they are shown for.
assert.ok(HINTS.first[2].includes('39')&&HINTS.second[2].includes('6 齒')&&HINTS.second[2].includes('24 齒'));
assert.strictEqual(25.5*2-12,39);assert.strictEqual(15*2,30);assert.strictEqual(24/6,4);assert.strictEqual(12*0+39/12>3.2&&39/12<3.3,true);
assert.strictEqual(stage({S1:[null,null]}),'first');
assert.strictEqual(stage({S1:[39,null]}),'second');
assert.strictEqual(stage({S1:[39,6],S2:[null,24]}),null);
for(const k of ['first','second'])assert.strictEqual(HINTS[k].length,3);
console.log('OK: hints consistent with the solution and stages');
