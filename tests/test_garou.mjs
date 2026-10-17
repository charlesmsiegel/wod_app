import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const root = new URL('../apps/garou/', import.meta.url);
const context = vm.createContext({Date, Math, Number, console, Map, Set, RangeError, TypeError});
for (const file of ['vendor/astronomy.browser.min.js', 'sky-data.js', 'umbral-data.js', 'garou-astro.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context, {filename:file,timeout:20000});
}
const A = context.GarouAstro;
const D = context.GarouData;
const U = context.GarouUmbral;

test('twelve patrons, with Rorg outside the named months', () => {
  assert.equal(D.patrons.length, 12);
  assert.equal(A.SIGNS.length, 12);
  assert.equal(A.SIGNS[0], 'Nerigal');
  assert.equal(A.SIGNS[11], 'Shantar');
  assert.ok(!A.SIGNS.includes('Rorg'));
});
test('new year matches the sourcebook 1998 and 1999 examples', () => {
  assert.equal(A.calendarYear(1998).start.toISOString().slice(0,10),'1998-04-11');
  assert.equal(A.calendarYear(1999).start.toISOString().slice(0,10),'1999-03-31');
});
test('year starts after the spring equinox, with 12 named full-moon intervals', () => {
  for (const year of [1998,2000,2026,2035]) {
    const cal=A.calendarYear(year);
    assert.ok(cal.start>cal.equinox);
    assert.ok((cal.start-cal.equinox)/86400000<30);
    assert.equal(cal.moons.length,13);
    for(let i=1;i<cal.moons.length;i++){
      const delta=(cal.moons[i]-cal.moons[i-1])/86400000;
      assert.ok(delta>29&&delta<30,year+' month '+i+' is '+delta+' days');
    }
  }
});
test('unassigned intercalary lunation is not assigned to Rorg',()=>{
  const cal=A.calendarAt(new Date('2000-03-25T12:00:00Z'));
  assert.equal(cal.year,1999);
  assert.equal(cal.intercalary,true);
  assert.equal(cal.sign,null);
  assert.equal(A.calendarAt(new Date('2000-04-20T12:00:00Z')).sign,'Nerigal');
});
test('lunar faces agree with astronomical full and new moons',()=>{
  const full=A.calendarYear(1998).start;
  const phase=A.lunarPhase(full);
  assert.equal(phase.auspice,'Ahroun');
  assert.ok(phase.illumination>0.999);
  const newMoon=context.Astronomy.SearchMoonPhase(0,new Date('2026-04-01'),40).date;
  assert.equal(A.lunarPhase(newMoon).auspice,'Ragabash');
});
test('physical planet and star coordinates are finite and valid',()=>{
  const date=new Date('2026-10-16T23:00:00Z');
  const place=A.observer(47.7,-122.2);
  for(const name of ['Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Neptune']){
    const p=A.skyBody(name,date,place);
    assert.ok(p.alt>=-90&&p.alt<=90,name);
    assert.ok(p.az>=0&&p.az<=360,name);
  }
  for(const s of D.stars){
    const p=A.skyStar(s,date,place);
    assert.ok(Number.isFinite(p.alt)&&Number.isFinite(p.az),s.name);
  }
});
test('input validation rejects invalid coordinates',()=>{
  assert.throws(()=>A.observer(91,0),RangeError);
  assert.throws(()=>A.observer(0,-181),RangeError);
});
test('Aetherial overlay maps physical sky culture without fictional ephemerides',()=>{
  assert.ok(Object.keys(U.constellations).length>=12);
  assert.equal(U.constellations['Orion'].title,'Diana · the Huntress');
  assert.equal(U.constellations['Ursa Major'].names['Fianna'],'The Plough');
  assert.equal(U.starLore.polaris.title,'Vegarda · Lady of the North');
  assert.equal(U.starLore.sirius.title,'Matagar · Lord of Beginnings');
  assert.equal(U.phenomena.find(p=>p.id==='vulcan').canMap,undefined);
  assert.equal(U.phenomena.find(p=>p.id==='anthelios').canMap,true);
  assert.equal(U.phenomena.find(p=>p.id==='rorg').placement.includes('not a fixed star'),true);
  assert.equal(U.relevant(U.constellations['Orion'],'Fianna'),false);
  assert.equal(U.relevant(U.constellations['Orion'],'Black Furies'),true);
});
test('Milky Way is a real projected galactic great circle',()=>{
  const observer=A.observer(-33.9,151.2);
  const date=new Date('2026-08-05T12:00:00Z');
  const path=U.galacticEquator(A,date,observer);
  assert.equal(path.length,73);
  for(const point of path){
    assert.ok(Number.isFinite(point.alt)&&Number.isFinite(point.az));
    assert.ok(point.alt>=-90&&point.alt<=90);
  }
  const region=U.antiSunSector(A,date,observer);
  assert.ok(Number.isFinite(region.alt));
});
