(function () {
  'use strict';

  const { evaluateHandle, composeHermetic, generateSecret, formatSecret, isSyllable } = window.MageNames;
  const el = id => document.getElementById(id);
  const slots = Array.from({ length: 10 }, (_, index) => el(`syllable-${index + 1}`));
  let adeptCopy = '';
  let registryCopy = '';
  let trueCopy = '';

  // Native optgroups keep era distinctions accessible without blocking a choice.
  const houseGroups = new Map();
  for (const house of window.HermeticHouses) {
    if (!houseGroups.has(house.group)) {
      const group = document.createElement('optgroup');
      group.label = house.group;
      houseGroups.set(house.group, group);
      el('house').appendChild(group);
    }
    const option = document.createElement('option');
    option.value = house.name;
    option.textContent = house.name + (house.aliases.length ? ` (${house.aliases.join(' / ')})` : '');
    houseGroups.get(house.group).appendChild(option);
  }

  const essenceDescriptions = {
    Primordial: 'Deep roots, old mysteries, and the instinctive forces beneath the surface.',
    Pattern: 'Structure, continuity, and the forms that give a changing world its shape.',
    Dynamic: 'New possibilities, restless change, and the impulse to make something different.',
    Questing: 'The journey toward a purpose: seeking, testing limits, and moving onward.',
  };

  function renderAdept() {
    const input = el('handle').value;
    const result = evaluateHandle(input);
    adeptCopy = '';
    el('copy-adept').disabled = !result.valid;
    el('adept-empty').hidden = result.valid;
    el('adept-result').hidden = !result.valid;
    el('adept-message').textContent = input ? result.error || '' : '';
    el('handle').setAttribute('aria-invalid', String(Boolean(input && !result.valid)));
    if (!result.valid) return;
    const letters = `${result.letters.map(item => `${item.character}(${item.value})`).join(' + ')} = ${result.sum}`;
    const reduction = result.reductions.length === 1 ? `${result.root} is already one digit.` :
      result.reductions.slice(0, -1).map((value, index) =>
        `${value} → ${String(value).split('').join(' + ')} = ${result.reductions[index + 1]}`).join('; ');
    const quotient = Number(result.quotient.toFixed(4)) + (result.root % 3 ? '…' : '');
    const division = `${result.root} ÷ 3 = ${quotient} → ${result.rounded} (${result.essence})`;
    el('essence-number').textContent = String(result.rounded);
    el('essence-name').textContent = result.essence;
    el('essence-description').textContent = essenceDescriptions[result.essence];
    el('letter-trace').textContent = letters;
    el('reduction-trace').textContent = reduction;
    el('division-trace').textContent = division;
    adeptCopy = `${result.handle}\n${letters}\n${reduction}\n${division}\n${essenceDescriptions[result.essence]}`;
  }

  function renderHermetic() {
    const fields = {
      givenName: el('given-name').value,
      craftName: el('craft-name').value,
      house: el('house').value,
      titles: el('titles').value,
      shadowOverride: el('shadow-override').value,
      syllables: slots.map(slot => slot.value),
    };
    const result = composeHermetic(fields);
    const house = window.HermeticHouses.find(item => item.name === fields.house);
    el('house-note').textContent = house
      ? `${house.note} Source: ${house.citation}.`
      : 'Choose a House to see its history and source. All eras remain selectable.';
    const started = Boolean(fields.givenName || fields.craftName || fields.shadowOverride);
    const secret = formatSecret(fields.syllables);
    el('craft-output').textContent = result.craft || 'Enter a craft name to begin.';
    el('shadow-output').textContent = result.shadow || 'The birth name and craft name will meet here.';
    el('true-output').textContent = result.trueName || 'Complete the names and ten syllables below.';
    el('hermetic-message').textContent = started ? [result.errors.givenName, result.errors.craftName].filter(Boolean).join(' ') : '';
    el('given-name').setAttribute('aria-invalid', String(Boolean(started && result.errors.givenName)));
    el('craft-name').setAttribute('aria-invalid', String(Boolean(started && result.errors.craftName)));
    for (const slot of slots) {
      slot.setAttribute('aria-invalid', String(!isSyllable(slot.value)));
    }
    el('secret-preview').textContent = secret || 'Complete all ten syllable slots.';
    el('secret-count').textContent = `${fields.syllables.filter(isSyllable).length} / 10 slots`;
    el('secret-message').textContent = result.errors.secret || '';
    trueCopy = result.trueName;
    registryCopy = [
      result.craft && `Public craft name: ${result.craft}`,
      result.shadow && `Shadow Name: ${result.shadow}`,
      result.trueName && `True Name: ${result.trueName}`,
    ].filter(Boolean).join('\n');
    el('copy-true').disabled = !trueCopy;
    el('copy-registry').disabled = !registryCopy;
  }

  function regenerate() {
    try {
      const syllables = generateSecret();
      slots.forEach((slot, index) => { slot.value = syllables[index]; });
      renderHermetic();
    } catch (error) {
      renderHermetic();
      el('secret-message').textContent = error.message;
    }
  }

  async function copy(text, label) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      el('copy-status').textContent = `${label} copied.`;
    } catch (_) {
      el('copy-status').textContent = 'Clipboard unavailable. Select the output text and copy it manually.';
    }
  }

  for (const radio of document.querySelectorAll('input[name="mode"]')) {
    radio.addEventListener('change', () => {
      const hermetic = radio.value === 'hermetic';
      document.body.dataset.mode = hermetic ? 'hermetic' : 'adept';
      el('adept-view').hidden = hermetic;
      el('hermetic-view').hidden = !hermetic;
      el('copy-status').textContent = '';
    });
  }
  el('handle').addEventListener('input', () => { el('copy-status').textContent = ''; renderAdept(); });
  el('adept-example').addEventListener('click', () => {
    el('handle').value = 'C0y0te';
    el('copy-status').textContent = '';
    renderAdept();
    el('handle').focus();
  });
  for (const field of ['given-name', 'craft-name', 'titles', 'shadow-override'].map(el).concat(slots)) {
    field.addEventListener('input', () => { el('copy-status').textContent = ''; renderHermetic(); });
  }
  el('house').addEventListener('change', () => { el('copy-status').textContent = ''; renderHermetic(); });
  el('generate-secret').addEventListener('click', () => { el('copy-status').textContent = ''; regenerate(); });
  el('copy-adept').addEventListener('click', () => copy(adeptCopy, 'Analysis'));
  el('copy-registry').addEventListener('click', () => copy(registryCopy, 'Register'));
  el('copy-true').addEventListener('click', () => copy(trueCopy, 'True Name'));
  renderAdept();
  regenerate();
})();
