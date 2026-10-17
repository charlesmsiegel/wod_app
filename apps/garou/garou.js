/* Small, stand-alone Garou sky-reader. No framework, server, account, or API key. */
(() => {
  "use strict";
  const A = window.GarouAstro;
  const D = window.GarouData;
  const U = window.GarouUmbral;
  if (!U) throw new Error("Umbral lore must load before the Garou sky reader.");
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g,
    c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt = (date, opts) => new Intl.DateTimeFormat(undefined,
    opts || {year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(date);
  const shortDate = date => fmt(date,{year:"numeric",month:"short",day:"numeric"});
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
  const settingsKey = "garou-sky-settings-v1";
  let selected = null;
  let latest = null;
  let activeTab = "sky";

  function inputDate(date) {
    const p = n => String(n).padStart(2,"0");
    return [date.getFullYear(),p(date.getMonth()+1),p(date.getDate())].join("-") +
      "T" + p(date.getHours()) + ":" + p(date.getMinutes());
  }
  function restore() {
    $("when").value = inputDate(new Date());
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || "{}");
      if (typeof saved.umbra === "boolean") $("umbral-toggle").checked = saved.umbra;
      if (typeof $("umbral-toggle").checked !== "boolean") $("umbral-toggle").checked = true;
      if (typeof saved.anthelios === "boolean") $("anthelios-toggle").checked = saved.anthelios;
      if (saved.lens && ["all",...U.tribes].includes(saved.lens)) $("tribe-lens").value = saved.lens;
      if (Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) {
        $("latitude").value = saved.lat;
        $("longitude").value = saved.lon;
        $("location-note").textContent = "Using coordinates saved in this browser. Change them anytime.";
      }
    } catch { /* storage may be unavailable */ }
  }
  function save(lat,lon) {
    try { localStorage.setItem(settingsKey,JSON.stringify({lat,lon,umbra:$("umbral-toggle").checked,lens:$("tribe-lens").value,anthelios:$("anthelios-toggle").checked})); } catch { /* private browsing */ }
  }
  function showError(message) {
    $("error").hidden = !message;
    $("error").textContent = message || "";
  }
  function point(h) {
    const radius = 220 * (90 - h.alt) / 90, angle = h.az * Math.PI / 180;
    return {x:radius*Math.sin(angle),y:-radius*Math.cos(angle)};
  }
  function timeAndPlace() {
    const date = new Date($("when").value);
    const lat = Number($("latitude").value), lon = Number($("longitude").value);
    if (!$("when").value || Number.isNaN(date.getTime())) throw new Error("Choose a valid date and time.");
    if (!$("latitude").value || !$("longitude").value) throw new Error("Enter latitude and longitude.");
    return { date, lat, lon, place:A.observer(lat,lon) };
  }
  function skyObjects(date,place) {
    const stars = new Map(D.stars.map(s=>[s.key,{...s,...A.skyStar(s,date,place)}]));
    const names = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
    const bodies = new Map(names.map(n=>[n,A.skyBody(n,date,place)]));
    return {stars,bodies};
  }
  function svgText(x,y,text,css) {
    return '<text x="'+x+'" y="'+y+'" class="'+css+'">'+esc(text)+'</text>';
  }
  function overlayOn() { return $("umbral-toggle").checked; }
  function tribalLens() { return $("tribe-lens").value || "all"; }
  function constellationName(name) {
    const c=U.constellations[name];
    if (!overlayOn() || !c || !U.relevant(c,tribalLens())) return name;
    return c.names?.[tribalLens()] || c.title;
  }
  function galacticSegments(path) {
    const segments=[];
    for(let i=1;i<path.length;i++){
      if(path[i-1].alt<=0||path[i].alt<=0)continue;
      const a=point(path[i-1]),b=point(path[i]);
      segments.push("M"+a.x.toFixed(1)+" "+a.y.toFixed(1)+
        " L"+b.x.toFixed(1)+" "+b.y.toFixed(1));
    }
    return segments.join(" ");
  }
  function drawChart(sky,date,place) {
    const veil=overlayOn(),lens=tribalLens();
    $("sky").classList.toggle("umbral",veil);
    const parts = [
      '<circle class="horizon" r="220"/>',
      '<circle class="ring" r="73.33"/><circle class="ring" r="146.67"/>',
      '<path class="axis" d="M 0 -220 V 220 M -220 0 H 220"/>',
      svgText(0,-240,"N","cardinal"),svgText(240,4,"E","cardinal"),
      svgText(0,247,"S","cardinal"),svgText(-240,4,"W","cardinal")
    ];
    if(veil && (lens==="all"||U.relevant(U.milkyWay,lens))) {
      const ancestral=U.galacticEquator(A,date,place);
      const path=galacticSegments(ancestral);
      if(path) {
        parts.push('<path class="ancestor-path" d="'+path+'"/>');
        parts.push('<path class="ancestor-path-core" d="'+path+'"/>');
        const labelPoint=ancestral.filter(p=>p.alt>30&&p.alt<70)
          .sort((a,b)=>b.alt-a.alt)[0];
        if(labelPoint) {
          const p=point(labelPoint);
          parts.push(svgText(p.x.toFixed(1),(p.y-10).toFixed(1),
            "Ancestors' Path","umbral-name"));
        }
      }
    }
    for (const c of D.constellations) {
      const lore=U.constellations[c.name];
      const emphasized=veil && lore && U.relevant(lore,lens);
      const selectedClass = selected && selected.type==="constellation" && selected.key===c.name ? " selected" : "";
      const cls="constellation"+(emphasized?" lore-relevant":"")+selectedClass;
      const segments = c.path.slice(1).map((key,i)=>[c.path[i],key]).concat(c.extra||[]);
      for (const [a,b] of segments) {
        const sa=sky.stars.get(a),sb=sky.stars.get(b);
        if (!sa||!sb||sa.alt<0||sb.alt<0) continue;
        const p1=point(sa),p2=point(sb);
        parts.push('<path class="'+cls+'" d="M'+p1.x.toFixed(1)+' '+p1.y.toFixed(1)+
          ' L'+p2.x.toFixed(1)+' '+p2.y.toFixed(1)+'"/>');
      }
      if(emphasized){
        const seen=c.path.map(k=>sky.stars.get(k)).filter(p=>p&&p.alt>7);
        if(seen.length>=2){
          const center=seen.reduce((a,p)=>{
            const xy=point(p);return {x:a.x+xy.x,y:a.y+xy.y};
          },{x:0,y:0});
          const px=center.x/seen.length,py=center.y/seen.length;
          parts.push('<g data-target="constellation:'+esc(c.name)+'" tabindex="0" role="button" aria-label="'+
            esc(constellationName(c.name))+'"><circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+
            '" r="14" fill="transparent"/>'+svgText(px.toFixed(1),(py-12).toFixed(1),
              constellationName(c.name),"umbral-name")+'</g>');
        }
      }
    }
    for (const star of sky.stars.values()) {
      if (star.alt < 0) continue;
      const p=point(star), r=Math.max(1.45,4.0-star.mag*0.65);
      const lore=veil&&U.starLore[star.key];
      const isHighlighted=!!lore&&U.relevant(lore,lens);
      parts.push('<g data-target="star:'+esc(star.key)+'" tabindex="0" role="button" aria-label="'+esc(star.name)+
        '"><circle class="star-dot" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+r.toFixed(1)+'"/>'+
        ((isHighlighted||star.mag<1.4)?
          svgText((p.x+5).toFixed(1),(p.y-6).toFixed(1),
            isHighlighted?lore.title:star.name,isHighlighted?"object-label umbral-name":"object-label"):"")+'</g>');
    }
    const names={Sun:"Sun",Moon:"Moon",Mercury:"Mercury",Venus:"Venus",
      Mars:"Mars",Jupiter:"Jupiter",Saturn:"Saturn",Uranus:"Uranus",Neptune:"Neptune",Pluto:"Pluto"};
    for (const body of sky.bodies.values()) {
      if (body.alt<0) continue;
      const p=point(body),radius=body.name==="Moon"?6:body.name==="Sun"?7:4.2;
      const patron=veil&&D.patrons.find(x=>x.body===body.name);
      parts.push('<g data-target="body:'+body.name+'" tabindex="0" role="button" aria-label="'+body.name+
        '"><circle class="planet-dot" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+radius+
        '"/>'+svgText((p.x+8).toFixed(1),(p.y-6).toFixed(1),
          patron?patron.name:names[body.name],"object-label planet-label")+'</g>');
    }
    if(veil && $("anthelios-toggle").checked) {
      const anti=U.antiSunSector(A,date,place);
      if(anti.alt>0) {
        const p=point(anti);
        parts.push('<g data-target="umbral:anthelios" tabindex="0" role="button" aria-label="Anthelios, symbolic location">'+
          '<circle class="anthelios-sigil" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+
          '" r="6"/>'+svgText((p.x+12).toFixed(1),(p.y-7).toFixed(1),"Anthelios †","anti-label")+'</g>');
      }
    }
    $("sky").innerHTML=parts.join("");
  }
  function visibleFigures(sky) {
    const veil=overlayOn(),lens=tribalLens();
    const all=D.constellations.map(c=>{
      const visible=c.path.filter(k=>sky.stars.get(k)?.alt>0);
      return {c,n:visible.length,highest:Math.max(-90,...visible.map(k=>sky.stars.get(k).alt))};
    }).filter(v=>v.n>0).sort((a,b)=>b.highest-a.highest);
    const focused=all.filter(v=>!veil||lens==="all"||
      (U.constellations[v.c.name]&&U.relevant(U.constellations[v.c.name],lens)));
    const constellations=focused.map(v=>{
      const lore=veil&&U.constellations[v.c.name];
      const label=lore&&U.relevant(lore,lens)?constellationName(v.c.name):v.c.name;
      return '<button data-target="constellation:'+esc(v.c.name)+'" type="button">'+
        esc(v.c.name)+(veil&&lore?' <span>· '+esc(label)+'</span>':'')+'</button>';
    });
    const keys=veil?Object.keys(U.starLore):Object.keys(D.starLore);
    const solos=keys.filter(k=>sky.stars.get(k)?.alt>0 &&
      (!veil||lens==="all"||U.relevant(U.starLore[k],lens))).map(k=>{
      const star=sky.stars.get(k),lore=U.starLore[k];
      return '<button type="button" data-target="star:'+k+'">'+esc(star.name)+
        (veil&&lore?' <span>· '+esc(lore.title)+'</span>':'')+'</button>';
    });
    $("visible-list").innerHTML=[...solos,...constellations].join("") ||
      "<p>No matching figures from the initial catalogue are above the horizon. Try another time or tradition.</p>";
    return all;
  }
  function drawUmbralFeatures(){
    const veil=overlayOn();
    $("umbral-features").hidden=!veil;
    $("umbra-context").hidden=!veil;
    $("veil-legend").hidden=!veil;
    $("tradition-field").hidden=!veil;
    $("anthelios-control").hidden=!veil;
    $("visible-heading").textContent=veil?"Stories above the horizon":"Constellations above the horizon";
    if(!veil){$("umbral-list").innerHTML="";return;}
    $("umbral-list").innerHTML=U.phenomena.map(p=>'<button type="button" data-target="umbral:'+p.id+
      '"><strong>'+esc(p.name)+'</strong><small>'+esc(p.kind)+
      (p.id==="anthelios"?" · chronicle-dependent":"")+'</small></button>').join("");
  }
  function details(sky,calendar) {
    const selectedItem=selected || {type:"month"};
    const veil=overlayOn();
    const pairs=(items)=>'<dl>'+items.map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join("")+'</dl>';
    let title,body;
    if (selectedItem.type==="umbral") {
      const p=U.phenomena.find(v=>v.id===selectedItem.key);
      if (!p) return;
      title=p.name;
      body='<p>'+esc(p.detail)+'</p>'+pairs([["Nature",p.kind],["Sky placement",p.placement],
        ["Source","Rage Across the Heavens, pp. 17, 63, 75, 80–81"]]);
    } else if (selectedItem.type==="star") {
      const star=sky.stars.get(selectedItem.key),lore=veil&&U.starLore[selectedItem.key];
      if (!star) return;
      title=lore?lore.title:star.name;
      body='<p>'+esc(lore?lore.detail:star.name+" is a star in the physical night sky.")+'</p>'+
        pairs([["Astronomical name",star.name],["Altitude",star.alt.toFixed(1)+"°"],
          ["Azimuth",star.az.toFixed(1)+"°"],...(lore?[["Tribal connections",lore.tribes.join(", ")]]:[])]);
    } else if (selectedItem.type==="constellation") {
      const c=D.constellations.find(v=>v.name===selectedItem.key);
      if (!c) return;
      const lore=veil&&U.constellations[c.name];
      title=lore?constellationName(c.name):c.name;
      body='<p>'+esc(lore?lore.detail:c.name+" is a constellation in the real sky.")+'</p>'+
        pairs([["Physical pattern",c.name],
          ...(lore?[["Tribal connections",lore.tribes.join(", ")||"Western zodiac correspondence"]]:[]),
          ["Position","Mapped to actual stars; interpretations are cultural"]]);
    } else if (selectedItem.type==="body") {
      const b=sky.bodies.get(selectedItem.key);
      if (!b) return;
      const p=veil&&D.patrons.find(v=>v.body===b.name);
      title=p?p.name:b.name;
      body='<p>'+esc(p?(p.title+" · "+p.quality+". "+p.question):
        b.name+" in the real sky.")+'</p>'+
        pairs([["Physical body",b.name],["Altitude",b.alt.toFixed(1)+"°"],["Azimuth",b.az.toFixed(1)+"°"]]);
    } else {
      const patron=D.patrons[calendar.index];
      title=patron?patron.name+" · "+patron.title:"Between the years";
      body=patron?'<p>'+esc(patron.quality+". "+patron.question)+'</p>'+
        pairs([["Realm",patron.body],["Tribe",patron.tribe],["Auspice",patron.auspice],
          ["Traditional zodiac",patron.zodiac]]):
        '<p>The twelve named months have ended. This extra lunation has no assigned patron in the sourcebook. Rorg is a thirteenth sign, not an established leap-month ruler.</p>';
    }
    $("detail-title").textContent=title;
    $("detail-body").innerHTML=body;
  }
  function drawCalendar(cal) {
    const hasGap=cal.nextYearStart.getTime()-cal.months[11].end.getTime()>3600000;
    $("calendar-banner").innerHTML='<strong>Garou year '+cal.year+'</strong> · starts '+
      esc(fmt(cal.start))+'; next begins '+esc(fmt(cal.nextYearStart))+
      '<div class="small">Equinox '+esc(fmt(cal.equinox))+' · Time zone: '+esc(zone)+'</div>';
    $("months").innerHTML=cal.months.map((m,i)=>{
      const p=D.patrons[i];
      return '<article class="month'+(i===cal.index?" current":"")+'"><div class="month-number">Moon '+(i+1)+
        (i===cal.index?" · current":"")+'</div><h3>'+esc(p.name)+'</h3><div class="patron-title">'+esc(p.title)+
        '</div><p>'+esc(p.quality)+' · '+esc(p.tribe)+' · '+esc(p.zodiac)+'</p><div class="dates">'+
        esc(fmt(m.start))+' — '+esc(fmt(m.end))+'</div></article>';
    }).join("");
    $("calendar-note").textContent=(hasGap?
      "This year contains an additional full-to-full lunation after Shantar and before the next year's Nerigal. The 12-month convention in Rage Across the Heavens leaves it unnamed; this tool does not invent a thirteenth month. ":
      "There is no extra lunation between Shantar and the next Nerigal this year. ")+
      "Rorg is described as a thirteenth sign outside the standard calendar, not as an officially assigned leap-month patron. All boundaries here are astronomical instants, not fixed civil dates.";
  }
  function makeReading(cal,phase,sky,figs) {
    const p=D.patrons[cal.index];
    const chosen=figs.length?figs[0].c:null;
    const name=p?p.name:"the unassigned interval";
    const theme=p?p.quality.toLowerCase():"the turning of a year";
    $("reading-head").textContent=p?("Under "+name):"Between two Garou years";
    let text="The "+phase.label.toLowerCase()+" casts its "+phase.auspice+" face upon "+
      theme+". ";
    if (chosen) text+="Above the horizon, "+chosen.name+" carries the story of "+chosen.garou+". ";
    text+=p?("This is a season of "+theme+"; its shadow is "+p.vice.toLowerCase()+
      ", and its promise is "+p.virtue.toLowerCase()+"."):
      "The heavens stand between Shantar's final month and the next Nerigal. Rorg remains a sign apart, not a named month.";
    $("reading-copy").textContent=text;
    $("reading-question").textContent=p?p.question:"What might begin when the cycle turns?";
    return $("reading-head").textContent+"\n\n"+text+"\n\n"+$("reading-question").textContent;
  }
  function drawNatal() {
    const born=$("born").value, changed=$("first-change").value;
    if (!born) { $("natal-output").textContent="Choose a birth date to see its patron and lunar face."; return; }
    const formatResult=(label,raw)=>{
      if (!raw) return "";
      const date=new Date(raw),c=A.calendarAt(date),moon=A.lunarPhase(date);
      const p=D.patrons[c.index];
      return '<div class="natal-result"><small>'+esc(label)+" · "+esc(fmt(date))+'</small><br><strong>'+
        esc(p?p.name:"Between named months")+'</strong><p>'+esc(moon.label+" · "+moon.auspice)+
        (p?" · "+esc(p.quality):" · unnamed intercalary lunation")+'</p></div>';
    };
    try {
      const birth=A.calendarAt(new Date(born));
      const change=changed?A.calendarAt(new Date(changed)):null;
      $("natal-output").innerHTML=formatResult("Birth",born)+formatResult("First Change",changed)+
        (change&&birth.sign&&birth.sign===change.sign?
          '<p class="small">Both events occur under the same patron—an intensified association in Garou tradition.</p>':"");
    } catch(e) { $("natal-output").textContent=e.message; }
  }
  function update() {
    try {
      const {date,lat,lon,place}=timeAndPlace();
      const cal=A.calendarAt(date),phase=A.lunarPhase(date),sky=skyObjects(date,place);
      const p=D.patrons[cal.index];
      $("month-name").textContent=p?p.name:"Unnamed lunation";
      $("month-caption").textContent=p?(p.title+" · "+p.zodiac):"Between Garou years · Rorg is not assigned";
      $("phase-name").textContent=phase.label;
      $("auspice").textContent=phase.auspice+" · "+Math.round(phase.illumination*100)+"% illuminated";
      const next=A.nextFullMoon(date);
      $("next-full").textContent=next?shortDate(next):"—";
      $("next-full-caption").textContent=next?fmt(next):"";
      const sun=sky.bodies.get("Sun");
      $("sky-condition").textContent=sun.alt>=-6?"Daylight / twilight: stars are plotted, not necessarily visible":"Sky above local horizon";
      drawUmbralFeatures();
      drawChart(sky,date,place);
      const figs=visibleFigures(sky);
      details(sky,cal);
      drawCalendar(cal);
      const reading=makeReading(cal,phase,sky,figs);
      latest={reading,lat,lon};
      showError(null);
    } catch(e) {showError(e.message || String(e));}
  }
  function switchTab(name) {
    activeTab=name;
    for (const button of document.querySelectorAll("[data-tab]")) {
      const active=button.dataset.tab===name;
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");
      else button.removeAttribute("aria-current");
    }
    for(const t of ["sky","calendar","reading"]) $("view-"+t).hidden=t!==name;
  }

  restore();
  $("when").addEventListener("change",update);
  for(const field of ["umbral-toggle","anthelios-toggle","tribe-lens"]){
    $(field).addEventListener("change",()=>{
      save(Number($("latitude").value),Number($("longitude").value));
      if(field==="umbral-toggle")selected=null;
      update();
    });
  }
  for(const field of ["latitude","longitude"]){$(field).addEventListener("change",()=>{
    const lat=Number($("latitude").value),lon=Number($("longitude").value);
    if (Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180) save(lat,lon);
    update();
  });}
  $("now").addEventListener("click",()=>{$("when").value=inputDate(new Date());update();});
  $("here").addEventListener("click",()=>{
    if (!navigator.geolocation) {showError("Geolocation is not available here. Enter coordinates manually.");return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat=+pos.coords.latitude.toFixed(4),lon=+pos.coords.longitude.toFixed(4);
      $("latitude").value=lat;$("longitude").value=lon;
      $("location-note").textContent="Coordinates obtained with permission and saved only in this browser.";
      save(lat,lon);update();
    },()=>showError("Location permission wasn't granted. Manual coordinates work just as well."),
    {enableHighAccuracy:false,timeout:12000,maximumAge:600000});
  });
  document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  document.addEventListener("click",event=>{
    const target=event.target.closest("[data-target]");
    if(!target)return;
    const [type,...keyParts]=target.dataset.target.split(":");
    selected={type,key:keyParts.join(":")};
    if(latest){update();if(type!=="body"&&type!=="star")switchTab("sky");}
  });
  $("sky").addEventListener("keydown",event=>{
    if((event.key==="Enter"||event.key===" ")&&event.target.closest("[data-target]")){
      event.preventDefault();event.target.closest("[data-target]").dispatchEvent(new MouseEvent("click",{bubbles:true}));
    }
  });
  $("copy-reading").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(latest?.reading||"");$("copy-reading").textContent="Copied";
      setTimeout(()=>$("copy-reading").textContent="Copy reading",1500);
    }catch{showError("Copy isn't available. Select the text and copy manually.");}
  });
  $("cast").addEventListener("click",drawNatal);
  update();
})();