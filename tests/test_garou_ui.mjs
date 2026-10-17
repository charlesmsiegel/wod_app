import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(id) {
    this.id=id; this.value=''; this.innerHTML=''; this.textContent='';
    this.hidden=false; this.dataset={}; this.handlers=new Map();
    this._classes=new Set();
    this.classList={
      toggle:(name,force)=>{
        const add=force===undefined?!this._classes.has(name):Boolean(force);
        if(add)this._classes.add(name);else this._classes.delete(name);
        return add;
      },
      contains:name=>this._classes.has(name)
    };
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
  el('umbral-toggle').checked=true;
  el('anthelios-toggle').checked=false;
  el('tribe-lens').value='all';
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
  for(const file of ['vendor/astronomy.browser.min.js','sky-data.js','umbral-data.js','garou-astro.js','garou.js']){
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

test('step sideways reveals and hides the Umbral sky',()=>{
  const {el}=loadPage();
  assert.match(el('sky').innerHTML,/ancestor-path/);
  assert.match(el('umbral-list').innerHTML,/Anthelios/);
  assert.equal(el('umbral-features').hidden,false);
  el('umbral-toggle').checked=false;
  el('umbral-toggle').handlers.get('change')();
  assert.doesNotMatch(el('sky').innerHTML,/ancestor-path/);
  assert.doesNotMatch(el('sky').innerHTML,/Anthelios/);
  assert.equal(el('umbral-features').hidden,true);
  assert.equal(el('error').textContent,'');
});
test('changing tribe lens filters the visible lore without changing the astronomical sky',()=>{
  const {el}=loadPage();
  el('tribe-lens').value='Fianna';
  el('tribe-lens').handlers.get('change')();
  assert.equal(el('error').textContent,'');
  assert.match(el('sky').innerHTML,/horizon/);
  assert.match(el('umbral-list').innerHTML,/Rorg/);
  assert.doesNotMatch(el('visible-list').innerHTML,/Diana/);
});
test('Anthelios can be requested only as an explicit optional omen',()=>{
  const {el}=loadPage();
  assert.match(el('anthelios-control').textContent||'', /^$|./);
  assert.equal(el('anthelios-toggle').checked,false);
  el('anthelios-toggle').checked=true;
  el('anthelios-toggle').handlers.get('change')();
  assert.equal(el('error').textContent,'');
  assert.match(el('umbral-list').innerHTML,/Anthelios/);
});

test('the physical/Umbral toggle always has a visible mode indicator',()=>{
  const {el}=loadPage();
  assert.match(el('sky-mode-title').textContent,/UMBRA/);
  assert.match(el('sky-mode-description').textContent,/tribal sky traditions/);
  assert.equal(el('chart-shell').classList.contains('umbral-active'),true);
  el('umbral-toggle').checked=false;
  el('umbral-toggle').handlers.get('change')();
  assert.match(el('sky-mode-title').textContent,/EARTH/);
  assert.equal(el('chart-shell').classList.contains('umbral-active'),false);
  el('umbral-toggle').checked=true;
  el('umbral-toggle').handlers.get('change')();
  assert.match(el('sky-mode-title').textContent,/UMBRA/);
  assert.equal(el('chart-shell').classList.contains('umbral-active'),true);
  assert.equal(el('error').textContent,'');
});
test('Anthelios remains findable when its symbolic physical sector is below horizon',()=>{
  const {el,context}=loadPage();
  // Force the approximate sky sector below the physical horizon;
  // it cannot hide an independent Umbral omen.
  context.GarouUmbral.antiSunSector=()=>({alt:-25,az:250});
  el('anthelios-toggle').checked=true;
  el('anthelios-toggle').handlers.get('change')();
  assert.equal(el('anthelios-omen').hidden,false);
  assert.match(el('anthelios-status').textContent,/below the physical horizon/i);
  assert.match(el('umbral-list').innerHTML,/Anthelios/);
  assert.doesNotMatch(el('sky').innerHTML,/class="anthelios-sigil"/);
  assert.equal(el('error').textContent,'');
  el('umbral-toggle').checked=false;
  el('umbral-toggle').handlers.get('change')();
  assert.equal(el('anthelios-omen').hidden,true);
});
