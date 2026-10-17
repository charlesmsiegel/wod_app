/* Small, stand-alone Garou sky-reader. No framework, server, account, or API key. */
(() => {
  "use strict";
  const A = window.GarouAstro;
  const D = window.GarouData;
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
      if (Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) {
        $("latitude").value = saved.lat;
        $("longitude").value = saved.lon;
        $("location-note").textContent = "Using coordinates saved in this browser. Change them anytime.";
      }
    } catch { /* storage may be unavailable */ }
  }
  function save(lat,lon) {
    try { localStorage.setItem(settingsKey,JSON.stringify({lat,lon})); } catch { /* private browsing */ }
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
  function drawChart(sky) {
    const parts = [
      '<circle class="horizon" r="220"/>',
      '<circle class="ring" r="73.33"/><circle class="ring" r="146.67"/>',
      '<path class="axis" d="M 0 -220 V 220 M -220 0 H 220"/>',
      svgText(0,-240,"N","cardinal"),svgText(240,4,"E","cardinal"),
      svgText(0,247,"S","cardinal"),svgText(-240,4,"W","cardinal")
    ];
    for (const c of D.constellations) {
      const segments = c.path.slice(1).map((key,i)=>[c.path[i],key]).concat(c.extra||[]);
      for (const [a,b] of segments) {
        const sa=sky.stars.get(a),sb=sky.stars.get(b);
        if (!sa||!sb||sa.alt<0||sb.alt<0) continue;
        const p1=point(sa),p2=point(sb);
        const selectedClass = selected && selected.type==="constellation" && selected.key===c.name ? " selected" : "";
        parts.push('<path class="constellation'+selectedClass+'" d="M'+p1.x.toFixed(1)+' '+p1.y.toFixed(1)+
          'L'+p2.x.toFixed(1)+' '+p2.y.toFixed(1)+'"/>');
      }
    }
    for (const star of sky.stars.values()) {
      if (star.alt < 0) continue;
      const p=point(star), r=Math.max(1.45,4.0-star.mag*0.65);
      const garou=D.starLore[star.key];
      parts.push('<g data-target="star:'+esc(star.key)+'" tabindex="0" role="button" aria-label="'+esc(star.name)+
        '" ><circle class="star-dot" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+r.toFixed(1)+'"/>'+
        ((garou||star.mag<1.4)?svgText((p.x+5).toFixed(1),(p.y-6).toFixed(1),garou?garou.garou:star.name,"object-label"):"")+'</g>');
    }
    const names={Sun:"Sun",Moon:"Moon",Mercury:"Mercury",Venus:"Venus",
      Mars:"Mars",Jupiter:"Jupiter",Saturn:"Saturn",Uranus:"Uranus",Neptune:"Neptune",Pluto:"Pluto"};
    for (const body of sky.bodies.values()) {
      if (body.alt<0) continue;
      const p=point(body),radius=body.name==="Moon"?6:body.name==="Sun"?7:4.2;
      parts.push('<g data-target="body:'+body.name+'" tabindex="0" role="button" aria-label="'+body.name+
        '"><circle class="planet-dot" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+radius+
        '"/>'+svgText((p.x+8).toFixed(1),(p.y-6).toFixed(1),names[body.name],"object-label planet-label")+'</g>');
    }
    $("sky").innerHTML=parts.join("");
  }
  function visibleFigures(sky) {
    const figs=D.constellations.map(c=>{
      const visible=c.path.filter(k=>sky.stars.get(k)?.alt>0);
      return {c,n:visible.length,highest:Math.max(-90,...visible.map(k=>sky.stars.get(k).alt))};
    }).filter(v=>v.n>0).sort((a,b)=>b.highest-a.highest);
    const constellations=figs.map(v=>'<button data-target="constellation:'+esc(v.c.name)+
      '" type="button">'+esc(v.c.name)+' <span>· '+esc(v.c.garou)+'</span></button>');
    const solos=Object.keys(D.starLore).filter(k=>sky.stars.get(k)?.alt>0).map(k=>{
      const s=sky.stars.get(k);
      return '<button type="button" data-target="star:'+k+'">'+esc(s.name)+' <span>· '+
        esc(D.starLore[k].garou)+'</span></button>';
    });
    $("visible-list").innerHTML=[...solos,...constellations].join("")||"<p>No named figures from the initial catalogue are currently above the horizon.</p>";
    return figs;
  }
  function details(sky,calendar) {
    const selectedItem=selected || {type:"month"};
    const pairs=(items)=>'<dl>'+items.map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join("")+'</dl>';
    let title,body;
    if (selectedItem.type==="star") {
      const star=sky.stars.get(selectedItem.key);
      const lore=D.starLore[selectedItem.key];
      if (!star) return;
      title=lore?lore.garou:star.name;
      body='<p>'+esc(lore?lore.story:star.name+" is a star in the physical night sky.")+'</p>'+
        pairs([["Astronomical name",star.name],["Altitude",star.alt.toFixed(1)+"°"],["Azimuth",star.az.toFixed(1)+"°"]]);
    } else if (selectedItem.type==="constellation") {
      const c=D.constellations.find(v=>v.name===selectedItem.key);
      if (!c) return;
      title=c.garou;
      body='<p>'+esc(c.story)+'</p>'+pairs([["Sky figure",c.name],["Basis","Real constellation; Garou cultural interpretation"]]);
    } else if (selectedItem.type==="body") {
      const b=sky.bodies.get(selectedItem.key);
      if (!b) return;
      const p=D.patrons.find(v=>v.body===b.name);
      title=p?p.name:b.name;
      body='<p>'+esc(p?(p.title+" · "+p.quality+". "+p.question):
        b.name+" in the real sky.")+'</p>'+pairs([["Physical body",b.name],["Altitude",b.alt.toFixed(1)+"°"],["Azimuth",b.az.toFixed(1)+"°"]]);
    } else {
      const patron=D.patrons[calendar.index];
      title=patron?patron.name+" · "+patron.title:"Between the years";
      body=patron?'<p>'+esc(patron.quality+". "+patron.question)+'</p>'+
        pairs([["Realm",patron.body],["Tribe",patron.tribe],["Auspice",patron.auspice],["Traditional zodiac",patron.zodiac]]):
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
      drawChart(sky);
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