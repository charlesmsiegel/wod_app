/* Card identities live in the catalogue. Table play is a sandbox; a kit holds
 * first-edition components until their cantrip ends. All transitions return new
 * state, so a rejected action cannot partly consume a deck or charge Glamour. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CantripDeck = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const unique = values => [...new Set(values)];
  const byId = cards => new Map(cards.map(card => [card.id, card]));
  function shuffle(values, random = Math.random) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function filterCards(cards, {query = '', category = '', family = ''} = {}) {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return cards.filter(card => {
      const text = [card.name, card.family, card.category, card.summary, ...(card.aliases || [])].join(' ').toLocaleLowerCase();
      return (!category || card.category === category) && (!family || card.family === family)
        && words.every(word => text.includes(word));
    });
  }
  function createTable(cards, random = Math.random) {
    return {stock: shuffle(cards.map(card => card.id), random), hand: [], discard: []};
  }
  function moveCard(state, id, zone) {
    if (!['stock', 'hand', 'discard'].includes(zone)) throw new Error('Unknown card zone.');
    if (![...state.stock, ...state.hand, ...state.discard].includes(id)) throw new Error('Unknown card.');
    const next = Object.fromEntries(['stock', 'hand', 'discard'].map(key => [key, state[key].filter(value => value !== id)]));
    next[zone].push(id);
    return next;
  }
  function drawCards(state, count, eligible = state.stock) {
    if (!Number.isInteger(count) || count < 1) throw new Error('Choose a positive draw count.');
    const allowed = new Set(eligible);
    const drawn = state.stock.filter(id => allowed.has(id)).slice(0, count);
    return {stock: state.stock.filter(id => !drawn.includes(id)), hand: [...state.hand, ...drawn], discard: [...state.discard]};
  }
  function shuffleTable(state, random = Math.random) {
    return {stock: shuffle([...state.stock, ...state.discard], random), hand: [...state.hand], discard: []};
  }
  function createKit(cards, known, pool, random = Math.random) {
    const lookup = byId(cards);
    if (unique([...known, ...pool]).length !== known.length + pool.length) throw new Error('A kit cannot contain duplicate cards.');
    if (!known.length || known.some(id => !['Art', 'Realms'].includes(lookup.get(id)?.category))) throw new Error('Choose known Art and Realm cards.');
    if (!pool.length || pool.some(id => lookup.get(id)?.category !== 'Bunks')) throw new Error('Choose a personal Bunk pool.');
    return {known: [...known], pool: [...pool], deck: shuffle(pool, random), discard: [],
      removedNightmares: [], casts: [], glamourSpent: 0, nextCast: 1};
  }
  function availableKnown(state) {
    const held = new Set(state.casts.flatMap(cast => [cast.art, ...cast.realms]));
    return state.known.filter(id => !held.has(id) && !state.discard.includes(id));
  }
  function beginCantrip(state, cards, {art, realms, drawCount = 1}) {
    const lookup = byId(cards), available = availableKnown(state);
    if (![1, 2].includes(drawCount)) throw new Error('Draw one or two Bunk cards, chosen before drawing.');
    if (!Array.isArray(realms) || !realms.length) throw new Error('Choose at least one Realm.');
    if (unique(realms).length !== realms.length) throw new Error('Do not play duplicate Realms.');
    if (lookup.get(art)?.category !== 'Art' || !available.includes(art)
        || realms.some(id => lookup.get(id)?.category !== 'Realms' || !available.includes(id))) {
      throw new Error('Choose available Art and Realm cards; discarded or held cards cannot be reused.');
    }
    if (state.deck.length < drawCount) throw new Error('Not enough available Bunk cards in your personal deck.');
    const drawn = state.deck.slice(0, drawCount);
    const nightmares = drawn.filter(id => lookup.get(id).family === 'Nightmare');
    const cast = {id: state.nextCast, phase: 'drawn', art, realms: [...realms],
      bunks: drawn.filter(id => !nightmares.includes(id)), nightmares, effect: '', successes: null};
    cast.draft = {effect: '', fulfilled: false, nightmaresAcknowledged: false,
      context: 'enchanted', successes: String(successCap(cast, cards)), disposition: ''};
    return {...state, deck: state.deck.slice(drawCount), casts: [...state.casts, cast],
      removedNightmares: [...state.removedNightmares, ...nightmares],
      glamourSpent: state.glamourSpent + realms.length - 1 + (drawCount === 2 ? 1 : 0), nextCast: state.nextCast + 1};
  }
  function successCap(cast, cards) {
    const lookup = byId(cards);
    return cast.bunks.reduce((sum, id) => sum + (lookup.get(id).successes || 0), 0);
  }
  function updateCantripDraft(state, castId, changes) {
    const cast = state.casts.find(item => item.id === castId);
    if (!cast) throw new Error('Unknown cantrip.');
    if (Object.keys(changes).some(key => !Object.hasOwn(cast.draft, key))) throw new Error('Unknown cantrip draft field.');
    return {...state, casts: state.casts.map(item => item.id === castId
      ? {...item, draft: {...item.draft, ...changes}} : item)};
  }
  function weaveCantrip(state, cards, castId, {fulfilled, nightmaresAcknowledged = false, effect, successes}) {
    const cast = state.casts.find(item => item.id === castId);
    if (!cast || cast.phase !== 'drawn') throw new Error('This cantrip is not awaiting its Bunks.');
    if (!fulfilled || !cast.bunks.length) throw new Error('The Bunk requirements must be fulfilled; a Nightmare alone grants no successes.');
    if (cast.nightmares.length && !nightmaresAcknowledged) throw new Error('Apply and acknowledge the Nightmare with your Storyteller first.');
    if (!String(effect || '').trim()) throw new Error('Describe the intended effect.');
    if (!Number.isInteger(successes) || successes < 1 || successes > successCap(cast, cards)) throw new Error('Enter successes from 1 up to the Bunk success cap.');
    return {...state, casts: state.casts.map(item => item.id === castId
      ? {...item, phase: 'active', effect: effect.trim(), successes} : item)};
  }
  function endCantrip(state, castId, {discardId, payGlamour = false}, random = Math.random) {
    const cast = state.casts.find(item => item.id === castId);
    if (!cast) throw new Error('Unknown cantrip.');
    const components = [cast.art, ...cast.realms, ...cast.bunks];
    if (payGlamour && discardId) throw new Error('Choose a discard or spend Glamour, not both.');
    if (!payGlamour && !components.includes(discardId)) throw new Error('Choose one used card to discard, or spend one Glamour.');
    return {...state, casts: state.casts.filter(item => item.id !== castId),
      discard: payGlamour ? [...state.discard] : [...state.discard, discardId],
      deck: shuffle([...state.deck, ...cast.bunks.filter(id => id !== discardId)], random),
      glamourSpent: state.glamourSpent + (payGlamour ? 1 : 0)};
  }
  function refreshKit(state, count = Infinity, random = Math.random) {
    let restored;
    if (Array.isArray(count)) {
      if (!count.length) throw new Error('Choose at least one discarded card to refresh.');
      if (unique(count).length !== count.length || count.some(id => !state.discard.includes(id))) throw new Error('Only discarded cards can be selected for refresh.');
      restored = count;
    } else {
      if (count !== Infinity && (!Number.isInteger(count) || count < 1)) throw new Error('Choose a positive number of cards to refresh.');
      restored = state.discard.slice(0, count);
    }
    return {...state, discard: state.discard.filter(id => !restored.includes(id)),
      deck: shuffle([...state.deck, ...restored.filter(id => state.pool.includes(id))], random)};
  }
  return {shuffle, filterCards, createTable, moveCard, drawCards, shuffleTable,
    createKit, availableKnown, beginCantrip, successCap, updateCantripDraft, weaveCantrip, endCantrip, refreshKit};
});
