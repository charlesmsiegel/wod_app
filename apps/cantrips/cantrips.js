(function () {
  'use strict';
  const D = window.CantripDeck, $ = id => document.getElementById(id);
  let catalogue, cards, lookup, table, kit = null, mode = 'table', selection, face = 'front';
  const pool = new Set();
  const artFamilies = ['Chicanery','Legerdemain','Primal','Soothsay','Sovereign','Wayfare'];
  const realmFamilies = ['Actor','Fae','Nature','Prop','Scene'];
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  function button(text, action, className) {
    const element = node('button',text,className);
    element.type = 'button'; element.addEventListener('click',action); return element;
  }
  function option(value, text) { const item=node('option',text); item.value=value; return item; }
  function message(text) { $('status').textContent = text; $('error').hidden = true; }
  function act(action) {
    try { action(); $('error').hidden = true; }
    catch (error) { $('error').textContent = error.message; $('error').hidden = false; }
  }
  function label(card) { return `${card.family}: ${card.name}`; }
  function statistics(card) {
    return [card.category,card.family,card.level ? `Level ${card.level}` : '',
      card.successes ? `${card.successes} successes` : ''].filter(Boolean).join(' · ');
  }
  function inspect(id) {
    selection=id; face='front'; renderInspector();
    if (window.matchMedia('(max-width: 760px)').matches) $('inspect-title').scrollIntoView({block:'start'});
  }
  function cardFace(card, side = 'front', compact = false, hiddenName = false) {
    const element = node('div',undefined,'card-face' + (side === 'back' ? ' reverse' : ''));
    const reverse = side === 'back', common = reverse && card.backKind === 'bunk';
    element.append(node('span',common ? 'Bunk reverse' : `${card.family} · ${reverse ? 'Text reverse' : card.category}`,'suit'));
    element.append(node('strong',common ? 'Glamour makes its demands' : card.name));
    if (!common && card.level) element.append(node('span','●'.repeat(card.level),'dots'));
    if (!common) element.append(node('p',card.summary,'short'));
    element.append(node('span',reverse ? (common ? 'Interface placeholder' : 'Brief text paraphrase') : 'Text card','text-mark'));
    const imageURL = card[side+'Image'];
    if (imageURL) {
      const image = node('img'); image.src=imageURL;
      image.alt = hiddenName ? 'Face-down card' : `${label(card)} — ${reverse ? 'printed reverse' : 'art face'}`;
      image.loading='lazy'; image.addEventListener('error',()=>image.remove()); element.append(image);
    }
    if (compact) element.classList.add('compact');
    return element;
  }
  function renderInspector() {
    const card=lookup.get(selection); if(!card)return;
    $('inspect-title').textContent=card.name; $('inspect-meta').textContent=statistics(card);
    $('inspect-front').setAttribute('aria-pressed',String(face==='front'));
    $('inspect-back').setAttribute('aria-pressed',String(face==='back'));
    $('inspect-back').textContent=card.backKind==='bunk'?'Bunk reverse':'Text reverse';
    $('inspect-face').replaceChildren(cardFace(card,face));
    $('inspect-summary').textContent=card.summary;
    $('inspect-rules').textContent=[card.attribute ? `Art Attribute: ${card.attribute}` : '',
      card.ability ? `Realm Ability: ${card.ability}` : '',
      card.category==='Bunks' && card.family!=='Nightmare' ? `Level ${card.level}; ${card.successes} successes (original core table).` : '',
      card.category==='Art' && !card.attribute ? 'Confirm this Art’s Attribute from your sheet/book.' : '',
      card.category==='Realms' && !card.ability ? 'No Ability is printed on this recovered reverse; confirm the roll with your Storyteller.' : ''].filter(Boolean).join(' · ');
    const sourceAvailable=Boolean(card.source[face]);
    $('inspect-image-note').textContent=card[face+'Image'] ? (face==='back' && card.backKind==='text' ? 'This is this card’s individual printed text reverse.' : 'Local image installed.')
      : sourceAvailable ? 'No local image installed in this slot. The text card is ready to use.'
      : 'No confirmed original image is available for this side. The text is a sourcebook paraphrase.';
    $('inspect-source').textContent=`${card.reference}. Recovery: ${card.recovery}. ${card.source.pdfPage ? `Front source scan PDF page ${card.source.pdfPage}.` : ''} ${card.source[face] ? `Archive mapping: ${card.source[face]}.` : 'No confirmed archive mapping for this side.'}`;
    $('inspect-notes').textContent=[card.notes,card.aliases.length ? `Checklist aliases: ${card.aliases.join(', ')}.` : '',`Replaceable slot: ${card[face]}`].filter(Boolean).join(' ');
  }
  function filtered() {return D.filterCards(cards,{query:$('search').value,category:$('category').value,family:$('family').value});}
  function renderCatalogue() {
    const visible=filtered(), fragment=document.createDocumentFragment();
    $('results-count').textContent=`${visible.length} / ${cards.length} cards`;
    for(const card of visible) {
      const article=node('article',undefined,'catalogue-card');
      const show=button('',()=>inspect(card.id)); show.className='card-face-button';
      show.setAttribute('aria-label',`Inspect ${label(card)}`); show.append(cardFace(card,'front',true)); article.append(show);
      if(mode==='table') {
        const held=table.hand.includes(card.id);
        const take=button(held?'In your hand':'Add to hand',()=>act(()=>{table=D.moveCard(table,card.id,'hand');renderTable();renderCatalogue();message(`${card.name} added to your practice hand.`);}), 'take'+(held?' selected':''));
        take.disabled=held; article.append(take);
      } else if(!kit && card.category==='Bunks') {
        article.append(button(pool.has(card.id)?'Remove from pool':'Add to pool',()=>{pool.has(card.id)?pool.delete(card.id):pool.add(card.id);renderPool();renderCatalogue();},'take'+(pool.has(card.id)?' selected':'')));
      }
      fragment.append(article);
    }
    if(!visible.length)fragment.append(node('p','No cards match these filters.','empty'));
    $('cards').replaceChildren(fragment);
  }
  function renderFamilies() {
    const current=$('family').value, category=$('category').value;
    const families=[...new Set(cards.filter(c=>!category||c.category===category).map(c=>c.family))].sort();
    $('family').replaceChildren(option('','All families'),...families.map(f=>option(f,f)));
    if(families.includes(current))$('family').value=current;
  }
  function renderTable() {
    $('table-counts').textContent=`${table.stock.length} in stock · ${table.hand.length} in hand · ${table.discard.length} discarded`;
    $('table-discard-count').textContent=`Table discards (${table.discard.length})`;
    const fragment=document.createDocumentFragment(), backs=$('face-down').checked;
    for(const [index,id] of table.hand.entries()) {
      const card=lookup.get(id), wrap=node('div',undefined,'hand-card');
      const show=button('',()=>inspect(id)); show.setAttribute('aria-label',backs?`Inspect face-down card ${index+1}`:`Inspect ${label(card)}`);
      show.className='card-face-button'; show.append(cardFace(card,backs?'back':'front',true,backs)); wrap.append(show);
      wrap.append(button('Discard',()=>{table=D.moveCard(table,id,'discard');renderTable();renderCatalogue();message('Card moved to table discards.');})); fragment.append(wrap);
    }
    if(!table.hand.length)fragment.append(node('p','An open table. Draw a card or choose one from the cabinet.','empty'));
    $('hand').replaceChildren(fragment);
    $('table-discards').replaceChildren(...table.discard.map(id=>button(lookup.get(id).name,()=>inspect(id))));
  }
  function makeRatings(target,families,prefix) {
    for(const family of families) {
      const row=node('label',family,'rating'), select=node('select');select.id=`${prefix}-${family}`;
      select.setAttribute('aria-label',`${family} rating`);
      select.append(...Array.from({length:6},(_,i)=>option(String(i),String(i))));
      select.addEventListener('change',renderPool);row.append(select);$(target).append(row);
    }
  }
  function knownCards() {
    return cards.filter(card=>['Art','Realms'].includes(card.category)
      &&card.level<=Number($(`${card.category==='Art'?'art':'realm'}-${card.family}`).value)).map(card=>card.id);
  }
  function renderPool() {
    const expected=artFamilies.reduce((sum,f)=>sum+Number($('art-'+f).value),0);
    const ordinary=[...pool].filter(id=>lookup.get(id).family!=='Nightmare').length;
    const nightmares=pool.size-ordinary;
    $('pool-count').textContent=`${ordinary} / ${expected} ordinary Bunks selected${nightmares?` · ${nightmares} Storyteller-added Nightmares`:''}`;
    $('pool').replaceChildren(...[...pool].map(id=>button(`${lookup.get(id).name} ×`,()=>{pool.delete(id);renderPool();renderCatalogue();})));
  }
  function cost() {
    const realms=$('casting-realms').querySelectorAll('input:checked').length;
    const total=Math.max(0,realms-1)+(Number($('bunk-count').value)===2?1:0);
    $('cast-cost').textContent=`${total} Glamour committed before this draw. Update your character sheet; this app records spending, not your balance.`;
  }
  function components(cast) {return [cast.art,...cast.realms,...cast.bunks];}
  function renderCast(cast) {
    const section=node('article',undefined,'cast');section.dataset.cast=String(cast.id);
    section.append(node('p',`Cantrip ${cast.id} · ${cast.phase==='active'?'effect active — cards held':'Bunks drawn — awaiting fulfillment'}`,'cast-title'));
    section.append(node('h3',lookup.get(cast.art).name));
    const chips=node('div',undefined,'chips');
    for(const id of [cast.art,...cast.realms])chips.append(button(label(lookup.get(id)),()=>inspect(id)));
    section.append(chips);
    for(const id of [...cast.nightmares,...cast.bunks]) {
      const card=lookup.get(id), nightmare=card.family==='Nightmare';
      const requirement=node('div',undefined,'bunk-requirement'+(nightmare?' nightmare':''));
      requirement.append(node('h4',`${nightmare?'Nightmare · ':''}${card.name}`),node('p',card.summary),node('p',nightmare?'Apply immediately. Permanently removed from your deck.':`${card.successes} successes · level ${card.level}`,'muted'),button('Inspect card',()=>inspect(id)));
      section.append(requirement);
    }
    const cap=D.successCap(cast,cards);
    if(cast.phase==='drawn') {
      section.append(node('h3','3 · Fulfill, describe, establish success'));
      if(!cap)section.append(node('p','No ordinary Bunk was drawn, so no Bunk successes are available. Resolve the Nightmare with your Storyteller and settle this attempt. No replacement is drawn automatically.','muted'));
      else {
        const form=node('form'), fulfilled=node('input');fulfilled.type='checkbox';fulfilled.name='fulfilled';
        const check=node('label',undefined,'check');check.append(fulfilled,document.createTextNode('Every drawn Bunk requirement has been fulfilled.'));form.append(check);
        let acknowledged;
        if(cast.nightmares.length) { acknowledged=node('input');acknowledged.type='checkbox';const row=node('label',undefined,'check');row.append(acknowledged,document.createTextNode('Nightmare consequences applied and continuation agreed with the Storyteller.'));form.append(row); }
        const effectLabel=node('label','Intended effect'), effect=node('textarea');effect.name='effect';effect.maxLength=2000;effect.required=true;effectLabel.append(effect);form.append(effectLabel);
        const context=node('select');context.name='context';context.append(option('enchanted','Enchanted target / freehold · Bunk total'),option('banality','Mortal target, witness or Banality resistance · roll'));
        const contextLabel=node('label','4 · Establish successes ');contextLabel.append(context);form.append(contextLabel);
        const instruction=node('p',undefined,'muted');form.append(instruction);
        const successes=node('input');successes.type='number';successes.min='1';successes.max=String(cap);successes.value=String(cap);successes.name='successes';
        const successesLabel=node('label',`Successes · maximum ${cap} `);successesLabel.append(successes);form.append(successesLabel);
        function rollContext() {
          successes.readOnly=context.value==='enchanted';
          if(successes.readOnly)successes.value=String(cap);
          const art=lookup.get(cast.art), abilities=cast.realms.map(id=>lookup.get(id).ability||'confirm Realm Ability').join(' / ');
          instruction.textContent=context.value==='enchanted'?`No Banality roll required: the Bunks give ${cap} successes.`:`Roll ${art.attribute||'confirm Art Attribute'} + ${abilities} against the highest relevant Banality. Ask the Storyteller which Ability applies with multiple Realms. Enter the successful result, capped at ${cap}. A failed roll adds temporary Banality; a botch adds permanent Banality. Settle a failed attempt below.`;
        }
        context.addEventListener('change',rollContext);rollContext();
        const submit=node('button','Keep effect active','primary');submit.type='submit';form.append(submit);
        form.addEventListener('submit',event=>{event.preventDefault();act(()=>{kit=D.weaveCantrip(kit,cards,cast.id,{fulfilled:fulfilled.checked,nightmaresAcknowledged:Boolean(acknowledged?.checked),effect:effect.value,successes:Number(successes.value)});renderGuided();message('Cantrip active. Its component cards remain held until the effect ends.');});});
        section.append(form);
      }
    } else section.append(node('p',cast.effect),node('p',`${cast.successes} successes · effect active`,'muted'));
    const settle=node('div',undefined,'settle');settle.append(node('h3','5 · When the effect ends / attempt fails'));
    const disposition=node('select');disposition.setAttribute('aria-label',`Cantrip ${cast.id} discard choice`);
    disposition.append(option('','Choose one used card to discard…'),...components(cast).map(id=>option(id,`Discard ${lookup.get(id).name}`)),option('__glamour','Spend 1 Glamour · retain all used cards'));
    settle.append(disposition,button(cast.phase==='active'?'End effect & settle':'End attempt & settle',()=>act(()=>{kit=D.endCantrip(kit,cast.id,{discardId:disposition.value==='__glamour'?undefined:disposition.value,payGlamour:disposition.value==='__glamour'});renderGuided();message('Used cards settled. Retained Bunks have been shuffled back into your personal deck.');}), 'primary'));
    section.append(settle);return section;
  }
  function renderGuided() {
    $('kit-setup').hidden=Boolean(kit);$('kit-session').hidden=!kit;
    if(!kit){renderPool();return;}
    const available=D.availableKnown(kit), arts=available.map(id=>lookup.get(id)).filter(c=>c.category==='Art');
    $('kit-counts').textContent=`${kit.deck.length} Bunks in deck · ${kit.casts.length} cantrips held · ${kit.discard.length} cards discarded · ${kit.glamourSpent} Glamour spent`;
    const previous=$('casting-art').value;
    $('casting-art').replaceChildren(option('','Choose an available Art…'),...arts.map(c=>option(c.id,`${c.family} ${c.level} · ${c.name}`)));
    if(arts.some(c=>c.id===previous))$('casting-art').value=previous;
    $('casting-realms').replaceChildren(...available.map(id=>lookup.get(id)).filter(c=>c.category==='Realms').map(card=>{
      const row=node('label'), input=node('input');input.type='checkbox';input.name='realm';input.value=card.id;row.append(input,document.createTextNode(`${card.family} ${card.level} · ${card.name}`));return row;
    }));
    $('casts').replaceChildren(...kit.casts.map(renderCast));
    $('kit-discards').replaceChildren(...kit.discard.map(id=>{const row=node('label'),input=node('input');input.type='checkbox';input.value=id;row.append(input,document.createTextNode(label(lookup.get(id))));return row;}));
    $('nightmares-removed').textContent=kit.removedNightmares.length?`Nightmares applied and removed: ${kit.removedNightmares.map(id=>lookup.get(id).name).join(', ')}.`:'';
    cost();
  }
  function setMode(next) {
    mode=next;$('table-view').hidden=mode!=='table';$('guided-view').hidden=mode!=='guided';
    $('return-view').href=mode==='table'?'#table-title':'#guided-title';
    $('return-view').textContent=mode==='table'?'↑ Return to table':'↑ Return to cantrip';
    $('table-mode').setAttribute('aria-pressed',String(mode==='table'));$('guided-mode').setAttribute('aria-pressed',String(mode==='guided'));renderCatalogue();
  }
  function wire() {
    makeRatings('art-ratings',artFamilies,'art');makeRatings('realm-ratings',realmFamilies,'realm');
    $('table-mode').addEventListener('click',()=>setMode('table'));$('guided-mode').addEventListener('click',()=>setMode('guided'));
    $('inspect-front').addEventListener('click',()=>{face='front';renderInspector();});$('inspect-back').addEventListener('click',()=>{face='back';renderInspector();});
    $('search').addEventListener('input',renderCatalogue);$('category').addEventListener('change',()=>{renderFamilies();renderCatalogue();});$('family').addEventListener('change',renderCatalogue);
    $('draw').addEventListener('click',()=>act(()=>{const count=Number($('draw-count').value);if(!Number.isInteger(count)||count<1||count>20)throw new Error('Choose between 1 and 20 cards.');const before=table.hand.length;table=D.drawCards(table,count,filtered().map(c=>c.id));renderTable();renderCatalogue();message(`${table.hand.length-before} cards drawn from the filtered stock. Discards stay out until shuffled.`);}));
    $('shuffle').addEventListener('click',()=>{table=D.shuffleTable(table);renderTable();renderCatalogue();message('Stock and discards shuffled. Your hand stays on the table.');});
    $('return-hand').addEventListener('click',()=>{for(const id of [...table.hand])table=D.moveCard(table,id,'stock');renderTable();renderCatalogue();message('Hand returned to the practice stock.');});
    $('face-down').addEventListener('change',renderTable);
    $('browse-bunks').addEventListener('click',()=>{$('category').value='Bunks';$('search').value='';renderFamilies();renderCatalogue();$('catalogue-title').scrollIntoView({block:'start'});});
    $('example').addEventListener('click',()=>{for(const f of artFamilies)$('art-'+f).value=f==='Wayfare'?'3':'0';for(const f of realmFamilies)$('realm-'+f).value=f==='Fae'?'2':'0';pool.clear();for(const id of ['bunks-wayfare-runemarks','bunks-wayfare-graffiti','bunks-wayfare-spinning-top'])pool.add(id);renderPool();renderCatalogue();message('Example: Wayfare 3, Fae 2, and three Bunks. Adjust these to your own character.');});
    $('prepare-kit').addEventListener('click',()=>act(()=>{const known=knownCards(), arts=known.filter(id=>lookup.get(id).category==='Art'), realms=known.filter(id=>lookup.get(id).category==='Realms');const ordinary=[...pool].filter(id=>lookup.get(id).family!=='Nightmare');if(!arts.length||!realms.length)throw new Error('Choose at least one Art rating and one Realm rating.');if(ordinary.length!==arts.length)throw new Error(`Choose ${arts.length} ordinary Bunks, one per total Art dot. Nightmares are additional.`);kit=D.createKit(cards,known,[...pool]);renderGuided();renderCatalogue();message('Personal kit ready. Choose one Art and the Realm cards for your first cantrip.');}));
    $('casting-realms').addEventListener('change',cost);$('bunk-count').addEventListener('change',cost);
    $('cast-form').addEventListener('submit',event=>{event.preventDefault();act(()=>{const realms=[...$('casting-realms').querySelectorAll('input:checked')].map(input=>input.value);kit=D.beginCantrip(kit,cards,{art:$('casting-art').value,realms,drawCount:Number($('bunk-count').value)});renderGuided();message('Bunks drawn. Apply any Nightmare immediately, then fulfill every ordinary Bunk before weaving.');});});
    $('refresh-selected').addEventListener('click',()=>act(()=>{const chosen=[...$('kit-discards').querySelectorAll('input:checked')].map(input=>input.value);kit=D.refreshKit(kit,chosen);renderGuided();message(`${chosen.length} cards refreshed. Confirm the rest or epiphany allowance with your Storyteller.`);}));
    $('refresh-all').addEventListener('click',()=>{kit=D.refreshKit(kit);renderGuided();message('Discarded cards refreshed after rest. Active components stay held; Nightmares remain gone.');});
    $('new-kit').addEventListener('click',()=>{kit=null;renderGuided();renderCatalogue();message('Session cleared. Adjust your ratings and Bunks for a new kit.');});
  }
  async function init() {
    try {
      const response=await fetch('data.json');if(!response.ok)throw new Error(`Could not load the card catalogue (HTTP ${response.status}).`);
      catalogue=await response.json();if(catalogue.error)throw new Error(catalogue.error);
      cards=catalogue.cards;lookup=new Map(cards.map(card=>[card.id,card]));table=D.createTable(cards);selection=cards[0].id;
      wire();renderFamilies();renderCatalogue();renderTable();renderGuided();renderInspector();
      $('catalogue-status').textContent=`168 card identities · original first-edition rules · ${catalogue.imagesInstalled} local art faces installed`;
      $('artwork-status').textContent=`The source archive confirms 157 of 168 fronts. Eleven Nightmare fronts and two Nature text reverses remain unrecovered. ${catalogue.imagesInstalled} fronts and ${catalogue.backsInstalled} reverses are installed locally. No AI derivative or partial candidate is substituted.`;
      $('app').hidden=false;
    } catch(error) { $('catalogue-status').textContent='The card cabinet could not be opened.';$('error').textContent=error.message+' Run python serve.py, or use its static build on a web server.';$('error').hidden=false; }
  }
  init();
})();
