import test from 'node:test';
import assert from 'node:assert/strict';
import {directionOf,pickNext,shouldRepeat,REPEAT_DELAY,REPEAT_EVERY,BUTTON} from '../games/blood-mirror/gamepad.js';

const pad=(buttons={},axes=[0,0])=>({buttons:Array.from({length:17},(_,i)=>({pressed:!!buttons[i]})),axes});

test('the d-pad and the left stick give a direction; stick travel inside the deadzone gives none',()=>{
 assert.equal(directionOf(pad({[BUTTON.UP]:1})),'up');
 assert.equal(directionOf(pad({[BUTTON.LEFT]:1})),'left');
 assert.equal(directionOf(pad({},[0.9,0.2])),'right');
 assert.equal(directionOf(pad({},[-0.1,0.9])),'down');
 assert.equal(directionOf(pad({},[0.2,-0.3])),null,'inside the 0.5 deadzone');
 assert.equal(directionOf(pad()),null);
});

test('focus moves to the nearest target in that direction, and sideways drift is penalised',()=>{
 const origin={x:100,y:100};
 const row=[{x:200,y:100},{x:300,y:100}];
 assert.equal(pickNext(origin,row,'right'),0,'nearest in the row');
 assert.equal(pickNext(origin,[{x:50,y:100},{x:300,y:100}],'right'),1,'nothing behind counts');
 assert.equal(pickNext(origin,[{x:150,y:400},{x:180,y:100}],'right'),1,'straight across beats a nearer diagonal');
 assert.equal(pickNext(origin,[{x:200,y:100}],'left'),-1,'nothing that way returns -1');
 assert.equal(pickNext(origin,[{x:100,y:20}],'up'),0);
});

test('a held direction moves once, waits, then repeats at a steady pace',()=>{
 const held={dir:null,since:0,last:0};
 assert.equal(shouldRepeat(held,'right',0),true,'edge moves immediately');
 assert.equal(shouldRepeat(held,'right',REPEAT_DELAY-1),false,'still inside the initial delay');
 assert.equal(shouldRepeat(held,'right',REPEAT_DELAY),true,'repeats after the delay');
 assert.equal(shouldRepeat(held,'right',REPEAT_DELAY+REPEAT_EVERY-1),false,'paced');
 assert.equal(shouldRepeat(held,'right',REPEAT_DELAY+REPEAT_EVERY),true);
 assert.equal(shouldRepeat(held,null,500),false);
 assert.equal(shouldRepeat(held,'right',501),true,'releasing and pressing again is a new edge');
});
