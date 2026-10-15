// Patches a mechanism's board in place instead of rebuilding it. Most boards are drawn as an HTML string on every move;
// replacing the nodes throws away focus, restarts every CSS transition and makes painted images flash. Morphing keeps
// the nodes that are still the same kind of element, so a class change plays its transition and a focused button stays focused.
// Live state that markup cannot describe is left alone: a <details> the player opened and the value of a form control.
const KEEP_LIVE=new Set(['open']);
// `style` is only ever written through the CSSOM (the page CSP blocks style attributes), so it holds live state too: a gear's turn, a token's slide.
const FORM=new Set(['SELECT','INPUT','TEXTAREA']);

const live=(node,name)=>name==='style'||(node.tagName==='DETAILS'&&KEEP_LIVE.has(name));
function syncAttributes(from,to){
 for(const {name} of [...from.attributes])if(!to.hasAttribute(name)&&!live(from,name))from.removeAttribute(name);
 for(const {name,value} of [...to.attributes]){
  if(live(from,name))continue;
  if(from.getAttribute(name)!==value)from.setAttribute(name,value);
 }
}

function syncChildren(parent,fresh){
 const have=[...parent.childNodes],want=[...fresh.childNodes];
 want.forEach((next,i)=>{
  const node=have[i];
  if(!node){parent.appendChild(next);return;}
  if(node.nodeType!==next.nodeType||node.nodeName!==next.nodeName||FORM.has(node.nodeName)){parent.replaceChild(next,node);return;}
  if(node.nodeType===3||node.nodeType===8){if(node.nodeValue!==next.nodeValue)node.nodeValue=next.nodeValue;return;}
  syncAttributes(node,next);
  syncChildren(node,next);
 });
 for(let i=have.length-1;i>=want.length;i--)parent.removeChild(have[i]);
}

// Replaces the content of `parent` with `html`, reusing existing nodes where the structure matches.
export function morph(parent,html){
 const template=document.createElement('template');
 template.innerHTML=html;
 syncChildren(parent,template.content);
}
