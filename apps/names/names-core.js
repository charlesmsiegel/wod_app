(function (root) {
  'use strict';

  // The source specifies letters and demonstrates zero in C0y0te. Do not
  // transliterate Unicode or assign speculative values to other digits.
  const ROUNDING = [null, 0, 1, 1, 1, 2, 2, 2, 3, 3];
  const ESSENCES = ['Primordial', 'Pattern', 'Dynamic', 'Questing'];

  function evaluateHandle(input) {
    const invalid = error => ({ valid: false, error });
    if (typeof input !== 'string' || input.length > 200) {
      return invalid('Use a handle of at most 200 characters.');
    }
    if (/[^A-Za-z0 '\-]/.test(input)) {
      return invalid("Use ASCII A–Z and zero (0). Only spaces, hyphens and straight apostrophes are ignored; other digits and Unicode are unsupported.");
    }
    const handle = input.replace(/[ '\-]/g, '');
    if (!handle) return invalid('Enter a handle to calculate its Essence.');
    const letters = Array.from(handle, character => ({
      character,
      value: character === '0' ? 0 : character.toUpperCase().charCodeAt(0) - 64,
    }));
    const sum = letters.reduce((total, item) => total + item.value, 0);
    if (sum === 0) return invalid('A handle made only of zeros has no positive root. Add a letter.');
    const reductions = [sum];
    let digit = sum;
    while (digit > 9) {
      digit = Array.from(String(digit), Number).reduce((total, value) => total + value, 0);
      reductions.push(digit);
    }
    return {
      valid: true, handle, letters, sum, reductions, root: digit,
      quotient: digit / 3, rounded: ROUNDING[digit], essence: ESSENCES[ROUNDING[digit]],
    };
  }

  // A slot represents one intended syllable. Arbitrary edited text is never
  // passed through an English syllable counter; boundaries are explicit.
  function isSyllable(value) {
    return typeof value === 'string' && value.length >= 1 && value.length <= 12 && !/[^A-Za-z]/.test(value);
  }

  function validSecret(syllables) {
    return Array.isArray(syllables) && syllables.length === 10 &&
      Array.from(syllables).every(isSyllable);
  }

  function formatSecret(syllables) {
    if (!validSecret(syllables)) return '';
    return [syllables.slice(0, 2), syllables.slice(2, 5), syllables.slice(5, 7), syllables.slice(7, 10)]
      .map(group => group.join('-')).join(' ');
  }

  function composeHermetic(fields = {}) {
    const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    const given = clean(fields.givenName);
    const craft = clean(fields.craftName);
    const override = clean(fields.shadowOverride);
    const titles = typeof fields.titles === 'string'
      ? fields.titles.split(/\r?\n/).map(clean).filter(Boolean) : [];
    const errors = {};
    if (!given) errors.givenName = 'Enter the given / birth name.';
    if (!craft) errors.craftName = 'Enter the craft / shadow name.';
    if (!validSecret(fields.syllables)) {
      errors.secret = 'Fill all ten syllable slots with 1–12 ASCII letters each; no spaces or hyphens inside a slot.';
    }
    const withTitles = name => [name, ...titles].join(', ');
    let shadow = '';
    if (!errors.givenName && !errors.craftName) {
      const [first, ...rest] = craft.split(' ');
      shadow = withTitles(override || [first, given, ...rest].join(' '));
    }
    return {
      valid: Object.keys(errors).length === 0, errors,
      craft, shadow,
      trueName: shadow && !errors.secret ? `${shadow}; In Caligine Abditus, ${formatSecret(fields.syllables)}` : '',
    };
  }

  function secureIndex(count) {
    if (!root.crypto || typeof root.crypto.getRandomValues !== 'function') {
      throw new Error('Secure randomness is unavailable. Enter ten syllables manually.');
    }
    // Reject the incomplete final interval rather than biasing the modulo.
    const limit = Math.floor(0x100000000 / count) * count;
    const buffer = new Uint32Array(1);
    do { root.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return buffer[0] % count;
  }

  function generateSecret(randomIndex = secureIndex) {
    // Original sound construction, not a canonical table or a translation.
    const onsets = ['zh', 'kh', 'vr', 'zl', 'sh', 'th', 'ph', 'kr', 'dr', 'gr', 'tr', 'br'];
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const codas = ['m', 'n', 'l', 'r', 'k', 's'];
    return Array.from({ length: 10 }, () =>
      onsets[randomIndex(onsets.length)] + vowels[randomIndex(vowels.length)] + codas[randomIndex(codas.length)]);
  }

  const api = { evaluateHandle, composeHermetic, generateSecret, formatSecret, isSyllable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MageNames = api;
})(globalThis);
