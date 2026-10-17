import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let engine;
try { engine = require('../apps/cantrips/deck.js'); } catch { engine = {}; }
const cards = [
  {id:'art', category:'Art', family:'Wayfare', level:3, name:'Portal Passage'},
  {id:'art2', category:'Art', family:'Primal', level:1, name:'Willow-Whisper'},
  {id:'realm', category:'Realms', family:'Fae', level:2, name:'Lofty Noble'},
  {id:'realm2', category:'Realms', family:'Scene', level:1, name:'The Chamber'},
  {id:'bunk', category:'Bunks', family:'Wayfare', level:3, successes:3, name:'Graffiti', summary:'Make a mark on a wall.'},
  {id:'bunk2', category:'Bunks', family:'Chicanery', level:1, successes:2, name:'Gnis Gnos', aliases:['Sing backwards']},
  {id:'nightmare', category:'Bunks', family:'Nightmare', level:2, successes:null, name:'Headaches'},
];
const known = ['art','art2','realm','realm2'];
const kit = (pool=['bunk','bunk2']) => engine.createKit(cards, known, pool, () => .999);
const start = (state, options={}) => engine.beginCantrip(state,cards,{art:'art',realms:['realm'],drawCount:1,...options},()=>.999);

test('engine exposes a usable card table',()=>{
  assert.equal(typeof engine.createTable,'function');
  let state=engine.createTable(cards,()=>.999);
  state=engine.drawCards(state,2,cards.filter(c=>c.category==='Art').map(c=>c.id));
  assert.deepEqual(state.hand,['art','art2']);
  assert.ok(!state.stock.includes('art'));
  state=engine.moveCard(state,'art','discard');
  assert.deepEqual(state.hand,['art2']);
  assert.deepEqual(state.discard,['art']);
  assert.equal(new Set([...state.stock,...state.hand,...state.discard]).size,cards.length);
  state=engine.shuffleTable(state,()=>.999);
  assert.deepEqual(state.hand,['art2']);
  assert.ok(state.stock.includes('art'));
});
test('filtered drawing does not repeat or silently recycle discards',()=>{
  assert.equal(typeof engine.createTable,'function');
  let state=engine.createTable(cards,()=>.999);
  state=engine.drawCards(state,10,['bunk']);
  assert.deepEqual(state.hand,['bunk']);
  state=engine.moveCard(state,'bunk','discard');
  assert.deepEqual(engine.drawCards(state,1,['bunk']).hand,[]);
});
test('catalogue search includes aliases and combines category/family filters',()=>{
  assert.equal(typeof engine.filterCards,'function');
  assert.deepEqual(engine.filterCards(cards,{query:'sing backwards',category:'Bunks',family:'Chicanery'}).map(c=>c.id),['bunk2']);
  assert.deepEqual(engine.filterCards(cards,{query:'sing',category:'Art'}),[]);
});
test('guided draw holds the components and charges extra Realm and second Bunk costs',()=>{
  assert.equal(typeof engine.createKit,'function');
  const original=kit();
  const state=start(original,{realms:['realm','realm2'],drawCount:2});
  assert.equal(state.glamourSpent,2);
  assert.deepEqual(state.casts[0].bunks,['bunk','bunk2']);
  assert.equal(engine.successCap(state.casts[0],cards),5);
  assert.deepEqual(original.casts,[],'transitions must not mutate saved state');
  assert.throws(()=>start(state),/available|held|Bunk/);
});
test('second Bunk must be chosen before drawing and cannot overdraw the personal pool',()=>{
  assert.equal(typeof engine.createKit,'function');
  assert.throws(()=>start(kit(['bunk']),{drawCount:2}),/Bunk/);
  assert.throws(()=>start(kit(),{drawCount:3}),/one or two/);
  assert.throws(()=>start(kit(),{realms:['realm','realm']}),/duplicate/);
});
test('unfulfilled Bunks cannot activate a spell and mortal roll successes stay capped',()=>{
  assert.equal(typeof engine.createKit,'function');
  const state=start(kit());
  const id=state.casts[0].id;
  assert.throws(()=>engine.weaveCantrip(state,cards,id,{fulfilled:false,effect:'A door',successes:3}),/Bunk/);
  assert.throws(()=>engine.weaveCantrip(state,cards,id,{fulfilled:true,effect:'A door',successes:4}),/success/);
  const active=engine.weaveCantrip(state,cards,id,{fulfilled:true,effect:'A door',successes:2});
  assert.equal(active.casts[0].phase,'active');
  assert.equal(active.casts[0].successes,2);
});
test('ending an effect discards exactly one used card and reshuffles retained Bunks',()=>{
  assert.equal(typeof engine.createKit,'function');
  let state=start(kit());
  assert.throws(()=>engine.endCantrip(state,state.casts[0].id,{discardId:'art2'}),/used/);
  state=engine.endCantrip(state,state.casts[0].id,{discardId:'realm'},()=>.999);
  assert.deepEqual(state.discard,['realm']);
  assert.ok(state.deck.includes('bunk'));
  assert.deepEqual(state.casts,[]);
  assert.throws(()=>start(state),/available/);
});
test('paying Glamour retains every component; an explicit discard is still required otherwise',()=>{
  assert.equal(typeof engine.createKit,'function');
  let state=start(kit());
  assert.throws(()=>engine.endCantrip(state,state.casts[0].id,{}),/discard|Glamour/);
  state=engine.endCantrip(state,state.casts[0].id,{payGlamour:true},()=>.999);
  assert.equal(state.glamourSpent,1);
  assert.deepEqual(state.discard,[]);
  assert.equal(start(state).casts.length,1);
});
test('Nightmares leave the pool immediately, require acknowledgement, and never refresh',()=>{
  assert.equal(typeof engine.createKit,'function');
  let state=start(kit(['nightmare','bunk']),{drawCount:2});
  assert.deepEqual(state.removedNightmares,['nightmare']);
  assert.deepEqual(state.casts[0].nightmares,['nightmare']);
  assert.deepEqual(state.casts[0].bunks,['bunk']);
  assert.throws(()=>engine.weaveCantrip(state,cards,state.casts[0].id,{fulfilled:true,effect:'Door',successes:3}),/Nightmare/);
  state=engine.endCantrip(state,state.casts[0].id,{discardId:'bunk'},()=>.999);
  state=engine.refreshKit(state,Infinity,()=>.999);
  assert.ok(state.deck.includes('bunk'));
  assert.ok(!state.deck.includes('nightmare'));
});
test('partial refresh restores only selected discards and leaves active cards held',()=>{
  assert.equal(typeof engine.createKit,'function');
  let state=start(kit());
  state=engine.endCantrip(state,state.casts[0].id,{discardId:'art'},()=>.999);
  state=engine.beginCantrip(state,cards,{art:'art2',realms:['realm'],drawCount:1},()=>.999);
  state=engine.refreshKit(state,1,()=>.999);
  assert.deepEqual(state.discard,[]);
  assert.deepEqual(state.casts[0].realms,['realm']);
  assert.throws(()=>start(state),/available/);
});
test('epiphany refresh can choose specific discarded cards without refreshing the others',()=>{
  let state=start(kit());
  state=engine.endCantrip(state,state.casts[0].id,{discardId:'art'},()=>.999);
  state=engine.beginCantrip(state,cards,{art:'art2',realms:['realm2'],drawCount:1});
  state=engine.endCantrip(state,state.casts[0].id,{discardId:'realm2'},()=>.999);
  state=engine.refreshKit(state,['realm2'],()=>.999);
  assert.deepEqual(state.discard,['art']);
  assert.ok(engine.availableKnown(state).includes('realm2'));
  assert.throws(()=>engine.refreshKit(state,[]),/choose|Choose/);
  assert.throws(()=>engine.refreshKit(state,['realm']),/discard/);
});
