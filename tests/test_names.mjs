import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { evaluateHandle, composeHermetic, generateSecret, formatSecret } = require('../apps/names/names-core.js');

test('C0y0te follows the published sum, reduction, division and rounding', () => {
  const result = evaluateHandle('C0y0te');
  assert.equal(result.valid, true);
  assert.deepEqual(result.letters.map(item => item.value), [3, 0, 25, 0, 20, 5]);
  assert.equal(result.sum, 53);
  assert.deepEqual(result.reductions, [53, 8]);
  assert.equal(result.root, 8);
  assert.equal(result.quotient, 8 / 3);
  assert.equal(result.rounded, 3);
  assert.equal(result.essence, 'Questing');
});

test('all nine roots map through the source rounding table, including Primordial zero', () => {
  const cases = [
    ['A', 1, 0, 'Primordial'], ['B', 2, 1, 'Pattern'], ['C', 3, 1, 'Pattern'],
    ['D', 4, 1, 'Pattern'], ['E', 5, 2, 'Dynamic'], ['F', 6, 2, 'Dynamic'],
    ['G', 7, 2, 'Dynamic'], ['H', 8, 3, 'Questing'], ['I', 9, 3, 'Questing'],
  ];
  for (const [name, root, rounded, essence] of cases) {
    const result = evaluateHandle(name);
    assert.equal(result.root, root, name);
    assert.equal(result.rounded, rounded, name);
    assert.equal(result.essence, essence, name);
  }
});

test('reduction repeats until one decimal digit, with no master-number exemption', () => {
  const result = evaluateHandle('A'.repeat(99));
  assert.deepEqual(result.reductions, [99, 18, 9]);
  assert.equal(result.essence, 'Questing');
  assert.deepEqual(evaluateHandle('K').reductions, [11, 2]);
});

test('ASCII case and the documented space, hyphen and apostrophe separators do not affect the sum', () => {
  assert.equal(evaluateHandle("c0-y0'te ").sum, 53);
  assert.equal(evaluateHandle("c0-y0'te ").essence, 'Questing');
});

test('empty, zero-only and separator-only handles never receive an Essence', () => {
  for (const input of ['', ' ', "--'' ", '0', '0000', '0 - 0']) {
    const result = evaluateHandle(input);
    assert.equal(result.valid, false, input);
    assert.equal(result.essence, undefined, input);
  }
});

test('other digits, punctuation and Unicode are rejected instead of silently transliterated', () => {
  for (const input of ['C1yote', '2', '3', '4', '5', '6', '7', '8', '9', 'Coyote!', 'a_b', '<img>', 'Cöyote', 'é', 'e\u0301', 'Ｃoyote', 'Сoyote', 'ß', 'A\nB', 'A\tB', 'A\n', '0\n']) {
    const result = evaluateHandle(input);
    assert.equal(result.valid, false, input);
    assert.equal(result.essence, undefined, input);
    assert.ok(result.error.length > 0, input);
  }
});

test('malformed and oversized handles fail without throwing', () => {
  for (const input of [null, undefined, 7, {}, 'A'.repeat(201)]) {
    assert.equal(evaluateHandle(input).valid, false);
  }
});

const syllables = ['Lah', 'ru', 'Si', 'u', 'me', 'Ta', 'nek', 'Ke', 're', 'mot'];
const base = {
  givenName: 'Erin Justine Connell',
  craftName: 'Alexia Elizabeth Cavanaugh',
  titles: 'bani Tytalus\nKeeper of the Glass Door',
  shadowOverride: '',
  syllables,
};

test('the birth name sits after the first craft-name word, followed by supplied titles', () => {
  const result = composeHermetic(base);
  assert.equal(result.valid, true);
  assert.equal(result.craft, 'Alexia Elizabeth Cavanaugh');
  assert.equal(result.shadow, 'Alexia Erin Justine Connell Elizabeth Cavanaugh, bani Tytalus, Keeper of the Glass Door');
  assert.equal(result.trueName, 'Alexia Erin Justine Connell Elizabeth Cavanaugh, bani Tytalus, Keeper of the Glass Door; In Caligine Abditus, Lah-ru Si-u-me Ta-nek Ke-re-mot');
});

test('a manual Shadow override is used as entered without inserting the birth name again', () => {
  const result = composeHermetic({ ...base, shadowOverride: 'Aster Erin Justine Connell Voss' });
  assert.equal(result.shadow, 'Aster Erin Justine Connell Voss, bani Tytalus, Keeper of the Glass Door');
  assert.equal(result.trueName.split('Erin Justine Connell').length, 2);
});

test('titles are optional and whitespace is normalized without inventing House or rank', () => {
  const result = composeHermetic({ ...base, craftName: '  Aster   Voss ', givenName: ' Iris  Vale ', titles: ' \n ' });
  assert.equal(result.shadow, 'Aster Iris Vale Voss');
  assert.equal(result.craft, 'Aster Voss');
});

test('Hermetic names preserve Unicode independently of the restricted Adept alphabet', () => {
  const result = composeHermetic({ ...base, givenName: '秦 明', craftName: 'Astra Étoile Séraphin', titles: 'Gardienne de l’Étoile' });
  assert.equal(result.valid, true);
  assert.equal(result.shadow, 'Astra 秦 明 Étoile Séraphin, Gardienne de l’Étoile');
});

test('incomplete fields do not fabricate names and a one-word craft needs the override', () => {
  for (const fields of [{ givenName: '' }, { craftName: '' }, { craftName: 'Aster' }]) {
    const result = composeHermetic({ ...base, ...fields });
    assert.equal(result.valid, false);
    assert.equal(result.trueName, '');
    assert.equal(result.shadow, '');
  }
  assert.equal(composeHermetic({ ...base, craftName: 'Aster', shadowOverride: 'Aster Erin Connell' }).valid, true);
});

test('exactly ten nonempty delimiter-free syllable slots are required for the True Name', () => {
  for (const invalid of [[], Array(10), syllables.slice(1), [...syllables, 'za'], [...syllables.slice(0, 9), ''], [...syllables.slice(0, 9), 'two words'], [...syllables.slice(0, 9), 'a-b'], [...syllables.slice(0, 9), '<img>'], [...syllables.slice(0, 9), 'mot\n']]) {
    const result = composeHermetic({ ...base, syllables: invalid });
    assert.equal(result.valid, false);
    assert.equal(result.trueName, '');
    assert.ok(result.shadow.startsWith('Alexia Erin'));
  }
});

test('manual syllable edits survive composition and inputs are not mutated', () => {
  const edited = Object.freeze(['Zhal', ...syllables.slice(1)]);
  const fields = Object.freeze({ ...base, syllables: edited });
  assert.ok(composeHermetic(fields).trueName.endsWith('Zhal-ru Si-u-me Ta-nek Ke-re-mot'));
  assert.deepEqual(edited, ['Zhal', 'ru', 'Si', 'u', 'me', 'Ta', 'nek', 'Ke', 're', 'mot']);
  assert.equal(fields.craftName, 'Alexia Elizabeth Cavanaugh');
});

test('name and title markup is kept as literal text for safe DOM rendering', () => {
  const result = composeHermetic({ ...base, givenName: '<img src=x onerror=alert(1)>', titles: '<script>alert(2)</script>' });
  assert.equal(result.valid, true);
  assert.ok(result.shadow.includes('<img src=x onerror=alert(1)>'));
  assert.ok(result.shadow.endsWith('<script>alert(2)</script>'));
});

test('formatting exposes exactly ten boundaries grouped 2+3+2+3', () => {
  assert.equal(formatSecret(syllables), 'Lah-ru Si-u-me Ta-nek Ke-re-mot');
});

test('the original generator supplies ten defined syllables and independent output arrays', () => {
  const first = generateSecret(() => 0);
  assert.deepEqual(first, Array(10).fill('zham'));
  const second = generateSecret(() => 0);
  first[0] = 'edit';
  assert.equal(second[0], 'zham');
});

test('browser cryptographic generation always produces ten valid slots', () => {
  const generated = new Set();
  for (let i = 0; i < 300; i++) {
    const secret = generateSecret();
    assert.equal(secret.length, 10);
    assert.ok(secret.every(item => /^[a-z]+$/.test(item)));
    assert.equal(formatSecret(secret).split(/[ -]/).length, 10);
    assert.equal(composeHermetic({ ...base, syllables: secret }).valid, true);
    generated.add(secret.join('-'));
  }
  assert.ok(generated.size > 1);
});
