import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

// A small DOM host exercises the production event handlers and form replacement.
// Browser QA covers layout and native input behavior separately.
class Element {
  constructor(tag='div') {
    this.tagName=tag.toUpperCase();this.children=[];this.handlers=new Map();
    this.value='';this.checked=false;this.dataset={};this.hidden=false;
    this.classList={add(){}};
  }
  set textContent(value) {this.text=String(value);this.children=[];}
  get textContent() {return (this.text||'')+this.children.map(child=>child.textContent).join('');}
  append(...children) {
    for(const child of children) {
      if(child.tagName==='#FRAGMENT')this.children.push(...child.children);
      else this.children.push(child);
    }
    if(this.tagName==='SELECT'&&!this.value)this.value=this.children[0]?.value||'';
  }
  replaceChildren(...children) {this.children=[];this.text='';if(this.tagName==='SELECT')this.value='';this.append(...children);}
  setAttribute(name,value) {this[name]=String(value);}
  addEventListener(type,handler) {
    if(!this.handlers.has(type))this.handlers.set(type,[]);
    this.handlers.get(type).push(handler);
  }
  emit(type) {for(const handler of this.handlers.get(type)||[])handler({target:this,preventDefault(){}});}
  querySelectorAll(selector) {
    assert.equal(selector,'input:checked');
    return descendants(this).filter(child=>child.tagName==='INPUT'&&child.checked);
  }
  scrollIntoView() {}
}
function descendants(root) {return root.children.flatMap(child=>[child,...descendants(child)]);}
function field(root,name) {return descendants(root).find(child=>child.name===name);}
async function page() {
  const app=new URL('../apps/cantrips/',import.meta.url), elements=[];
  const make=tag=>{const element=new Element(tag);elements.push(element);return element;};
  const html=fs.readFileSync(new URL('index.html',app),'utf8');
  for(const match of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"/g))make(match[1]).id=match[2];
  const el=id=>elements.find(element=>element.id===id);
  el('bunk-count').value='1';el('draw-count').value='1';
  const catalogue=JSON.parse(fs.readFileSync(new URL('catalogue.json',app),'utf8'));
  const math=Object.create(Math);math.random=()=>.999;
  const context=vm.createContext({console,Math:math,
    document:{getElementById:el,createElement:make,createDocumentFragment:()=>make('#fragment'),createTextNode:text=>{const node=make('#text');node.textContent=text;return node;}},
    fetch:async()=>({ok:true,json:async()=>({...catalogue,imagesInstalled:0,backsInstalled:0})}),
    matchMedia:()=>({matches:false})});
  context.window=context;
  for(const file of ['deck.js','cantrips.js'])vm.runInContext(fs.readFileSync(new URL(file,app),'utf8'),context,{filename:file});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(el('error').textContent,'');
  return {el,cast:id=>el('casts').children.find(child=>child.dataset.cast===String(id))};
}
function fill(element,value) {
  if(typeof value==='boolean')element.checked=value;else element.value=value;
  element.emit('input');element.emit('change');
}
function begin(el,art,realm,drawCount='1') {
  el('casting-art').value=art;
  el('casting-realms').children.forEach(row=>row.children.find(child=>child.tagName==='INPUT').checked=false);
  descendants(el('casting-realms')).find(child=>child.value===realm).checked=true;
  el('bunk-count').value=drawCount;el('cast-form').emit('submit');
  assert.equal(el('error').hidden,true,el('error').textContent);
}
test('unfinished cantrip input survives another draw, settlement and refresh',async()=>{
  const {el,cast}=await page();
  el('guided-mode').emit('click');el('example').emit('click');el('prepare-kit').emit('click');
  begin(el,'art-wayfare-portal-passage','realms-fae-lofty-noble','2');
  fill(field(cast(1),'fulfilled'),true);
  fill(field(cast(1),'effect'),'Open a door behind the ivy.');
  fill(field(cast(1),'context'),'banality');
  fill(field(cast(1),'successes'),'2');
  const choice=()=>cast(1).children.find(child=>child.className==='settle').children.find(child=>child.tagName==='SELECT');
  fill(choice(),'__glamour');
  const expectDraft=()=>{
    assert.equal(field(cast(1),'effect').value,'Open a door behind the ivy.');
    assert.equal(field(cast(1),'fulfilled').checked,true);
    assert.equal(field(cast(1),'context').value,'banality');
    assert.equal(field(cast(1),'successes').value,'2');
    assert.equal(choice().value,'__glamour');
  };
  begin(el,'art-wayfare-hopscotch','realms-fae-hearty-commoner');
  expectDraft();
  const settlement=cast(2).children.find(child=>child.className==='settle');
  fill(settlement.children.find(child=>child.tagName==='SELECT'),'bunks-wayfare-spinning-top');
  settlement.children.find(child=>child.tagName==='BUTTON').emit('click');
  expectDraft();
  descendants(el('kit-discards')).find(child=>child.tagName==='INPUT').checked=true;
  el('refresh-selected').emit('click');expectDraft();
  el('refresh-all').emit('click');expectDraft();
  descendants(cast(1)).find(child=>child.tagName==='FORM').emit('submit');
  assert.match(cast(1).textContent,/effect active/);
  assert.match(cast(1).textContent,/Open a door behind the ivy\./);
});
test('Nightmare acknowledgement survives another cast redraw',async()=>{
  const {el,cast}=await page();
  el('guided-mode').emit('click');el('example').emit('click');
  fill(el('search'),'Headaches');
  el('cards').children[0].children.find(child=>child.className?.startsWith('take')).emit('click');
  el('prepare-kit').emit('click');
  begin(el,'art-wayfare-portal-passage','realms-fae-lofty-noble','2');
  const settle=cast(1).children.find(child=>child.className==='settle');
  fill(settle.children.find(child=>child.tagName==='SELECT'),'__glamour');
  settle.children.find(child=>child.tagName==='BUTTON').emit('click');
  begin(el,'art-wayfare-portal-passage','realms-fae-lofty-noble','2');
  const acknowledgement=()=>descendants(cast(2)).filter(child=>child.tagName==='INPUT'&&child.type==='checkbox')[1];
  fill(field(cast(2),'effect'),'A passage through the ivy.');
  fill(field(cast(2),'fulfilled'),true);fill(acknowledgement(),true);
  begin(el,'art-wayfare-hopscotch','realms-fae-hearty-commoner');
  assert.equal(acknowledgement().checked,true);
  descendants(cast(2)).find(child=>child.tagName==='FORM').emit('submit');
  assert.equal(el('error').hidden,true,el('error').textContent);
  assert.match(cast(2).textContent,/effect active/);
});
