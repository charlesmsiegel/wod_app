import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(id) {
    this.id=id; this.value=''; this.innerHTML=''; this.textContent='';
    this.hidden=false; this.dataset={}; this.handlers=new Map();
    this.classList={toggle(){}};
  }
  addEventListener(type,callback) {this.handlers.set(type,callback);}
  setAttribute() {}
  removeAttribute() {}
}
function loadPage(){
  const elements=new Map(), el=id=>{
    if (!elements.has(id)) elements.set(id,new Element(id));
    return elements.get(id);
  };
  el('latitude').value='40.7128';
  el('longitude').value='-74.0060';
  const tabs=['sky','calendar','reading'].map(name=>{
    const item=new Element('tab-'+name);item.dataset.tab=name;return item;
  });
  const context=vm.createContext({
    Date, Math, Number, console, Map, Set, RangeError, TypeError,
    document:{
      getElementById:el,
      querySelectorAll(selector){return selector==='[data-tab]'?tabs:[];},
      addEventListener(){}
    },
    localStorage:{getItem(){return null;},setItem(){}},
    navigator:{}, Intl
  });
  context.window=context;
  const root=new URL('../apps/garou/',import.meta.url);
  for(const file of ['vendor/astronomy.browser.min.js','sky-data.js','garou-astro.js','garou.js']){
    vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context,{filename:file,timeout:20000});
  }
  return {el,context};
}
test('Garou sky page initializes without runtime errors and renders three views',()=>{
  const {el}=loadPage();
  assert.equal(el('error').textContent,'');
  assert.ok(el('month-name').textContent.length>0);
  assert.ok(el('phase-name').textContent.length>0);
  assert.match(el('sky').innerHTML,/class="horizon"/);
  assert.match(el('sky').innerHTML,/star-dot/);
  assert.match(el('calendar-banner').innerHTML,/Garou year/);
  assert.match(el('months').innerHTML,/Nerigal/);
  assert.ok(el('reading-copy').textContent.length>60);
});
test('changing to a 13th lunation never assigns Rorg as the month',()=>{
  const {el}=loadPage();
  el('when').value='2000-03-25T12:00';
  el('when').handlers.get('change')();
  assert.equal(el('month-name').textContent,'Unnamed lunation');
  assert.match(el('calendar-note').textContent,/unassigned|unnamed/);
  assert.equal(el('error').textContent,'');
});
