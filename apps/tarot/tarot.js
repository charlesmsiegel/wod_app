/* Mage Tarot reader.
 *
 * Loads data.json (decks + spreads, built by data.py), lays out the chosen
 * spread, deals cards and shows what each one means. No dependencies.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "mage-tarot-settings";
  const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
  const SUIT_COLORS = {
    questing: "#b4502c",
    primordialism: "#2d6a8a",
    dynamism: "#6f7485",
    pattern: "#4c7537",
  };
  const MAX_CARD_WIDTH = 300;

  const $ = (id) => document.getElementById(id);

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "style") {
        for (const [prop, v] of Object.entries(value)) {
          if (prop.startsWith("--")) node.style.setProperty(prop, v);
          else node.style[prop] = v;
        }
      }
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(child));
    }
    return node;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  /** The tiny bit of Markdown the meanings file uses: **bold** and *italic*. */
  function richText(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function randomInt(n) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % n;
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  // ---- settings -----------------------------------------------------------

  function loadSettings() {
    const defaults = { deckId: null, spreadId: null, reversals: true, majorsOnly: false, significator: "random-court" };
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return defaults;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* private mode etc. */
    }
  }

  // ---- state --------------------------------------------------------------

  const settings = loadSettings();
  let data = null;
  let deck = null;
  let spread = null;
  let reading = null; // { placements: [{ position, card, reversed, revealed }], pile: [card] }
  let selected = null; // index into the current positions
  let tab = "card";
  let slots = []; // [{ slot, label, button }]

  const table = $("table");

  function positions() {
    return reading ? reading.placements.map((p) => p.position) : spread.positions;
  }

  function placement(i) {
    return reading ? reading.placements[i] : null;
  }

  /** Display number for a position: "S" for the significator, 1.. for the rest. */
  function positionNumber(i) {
    const list = positions();
    if (list[i].significator) return "S";
    return String(list.slice(0, i + 1).filter((p) => !p.significator).length);
  }

  function cardById(id) {
    return deck.cards.find((c) => c.id === id) || null;
  }

  function suitOf(card) {
    return card.suit ? deck.suits.find((s) => s.id === card.suit) : null;
  }

  // ---- dealing ------------------------------------------------------------

  function chooseSignificator(pile) {
    const choice = settings.significator;
    if (choice === "none") return null;
    if (choice === "random-court" || choice === "random") {
      const pool = choice === "random-court" ? pile.filter((c) => c.court) : pile;
      const from = pool.length ? pool : pile;
      return from.length ? from[randomInt(from.length)] : null;
    }
    return cardById(choice);
  }

  function deal() {
    let pile = deck.cards.filter((c) => !settings.majorsOnly || c.arcana === "major");
    const needsSignificator = spread.positions.some((p) => p.significator);
    const significator = needsSignificator ? chooseSignificator(pile) : null;
    if (significator) pile = pile.filter((c) => c.id !== significator.id);
    shuffle(pile);

    const placements = spread.positions.map((position) => {
      if (position.significator) {
        return { position, card: significator, reversed: false, revealed: true };
      }
      const card = pile.pop() || null;
      return { position, card, reversed: !!card && settings.reversals && randomInt(2) === 1, revealed: false };
    });
    reading = { placements, pile };
    selected = null;
    buildTable(true);
    renderPanel();
    updateButtons();
  }

  function extend() {
    if (!reading || !spread.extend || !reading.pile.length) return;
    const last = reading.placements[reading.placements.length - 1].position;
    const count = reading.placements.filter((p) => !p.position.significator).length;
    const ext = spread.extend;
    const position = {
      label: (ext.label || "Card {n}").replace("{n}", count + 1),
      meaning: ext.meaning || "",
      x: last.x + (ext.dx || 0),
      y: last.y + (ext.dy || 0),
      rotate: 0,
      significator: false,
    };
    const card = reading.pile.pop();
    reading.placements.push({ position, card, reversed: settings.reversals && randomInt(2) === 1, revealed: false });
    buildTable(false);
    animateIn([slots.length - 1]);
    updateButtons();
    renderPanel();
  }

  function reveal(i) {
    const p = placement(i);
    if (!p || !p.card) return;
    p.revealed = true;
    selected = i;
    tab = "card";
    refresh();
  }

  function next() {
    if (!reading) return deal();
    const list = reading.placements;
    const hidden = list.findIndex((p) => p.card && !p.revealed);
    if (hidden !== -1) return reveal(hidden);
    step(1);
  }

  function step(direction) {
    if (!reading) return;
    const filled = reading.placements.map((p, i) => (p.card ? i : null)).filter((i) => i !== null);
    if (!filled.length) return;
    const at = filled.indexOf(selected);
    const nextIndex = at === -1 ? 0 : (at + direction + filled.length) % filled.length;
    selected = filled[nextIndex];
    tab = "card";
    refresh();
  }

  function revealAll() {
    if (!reading) return;
    reading.placements.forEach((p) => { if (p.card) p.revealed = true; });
    if (selected === null) selected = reading.placements.findIndex((p) => p.card && !p.position.significator);
    if (selected === -1) selected = null;
    refresh();
  }

  // ---- card faces ---------------------------------------------------------

  function cardNumeral(card) {
    if (card.arcana === "major") return ROMAN[card.number] ?? String(card.number);
    return suitOf(card)?.name || "";
  }

  function textFace(card) {
    return el("div", { class: "text-face", style: { "--suit-color": SUIT_COLORS[card.suit] || "" } },
      el("div", { class: "numeral" }, cardNumeral(card)),
      el("div", { class: "name" }, card.name),
      card.subtitle ? el("div", { class: "numeral" }, card.subtitle) : null,
      el("div", { class: "meaning" }, card.meaning));
  }

  function frontFace(card, reversed) {
    const face = el("div", { class: "face front" + (reversed ? " reversed" : "") });
    if (card.image) {
      const img = el("img", { src: card.image, alt: card.name, draggable: "false" });
      img.addEventListener("error", () => img.replaceWith(textFace(card)), { once: true });
      face.append(img);
    } else {
      face.append(textFace(card));
    }
    return face;
  }

  function backFace() {
    const face = el("div", { class: "face back" });
    if (deck.back) {
      const img = el("img", { src: deck.back, alt: "", draggable: "false" });
      img.addEventListener("error", () => img.replaceWith(el("div", { class: "drawn-back" })), { once: true });
      face.append(img);
    } else {
      face.append(el("div", { class: "drawn-back" }));
    }
    return face;
  }

  // ---- table --------------------------------------------------------------

  function labelText(i) {
    const p = placement(i);
    const position = positions()[i];
    const label = el("span", {}, `${positionNumber(i)} · ${position.label}`);
    if (p && p.card && p.revealed && p.reversed) label.append(" ", el("span", { class: "rev", title: "Reversed" }, "↻"));
    return label;
  }

  function buildTable(animate) {
    table.replaceChildren();
    slots = positions().map((position, i) => {
      const slot = el("div", { class: "slot", style: { "--rotate": `${position.rotate || 0}deg` } });
      const p = placement(i);
      let button = null;
      if (p && p.card) {
        button = el("button", {
          class: "card" + (p.revealed ? "" : " face-down"),
          "aria-label": position.label,
          onclick: () => reveal(i),
        }, frontFace(p.card, p.reversed), backFace());
        slot.append(button);
      } else {
        slot.classList.add("empty");
      }
      const label = el("div", { class: "slot-label", title: position.meaning }, labelText(i));
      table.append(slot, label);
      return { slot, label, button };
    });

    if (!reading) {
      table.append(el("p", { class: "table-message" }, "Press Deal to shuffle and lay out the cards."));
    }
    layoutTable();
    updateSlots();
    if (animate) animateIn(slots.map((_, i) => i));
  }

  function animateIn(indexes) {
    for (const i of indexes) slots[i].slot.classList.add("incoming");
    // Let the browser paint the start state before transitioning.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      indexes.forEach((i, n) => setTimeout(() => slots[i]?.slot.classList.remove("incoming"), n * 90));
    }));
  }

  function layoutTable() {
    const list = positions();
    if (!list.length) return;
    const aspect = deck.aspect || 0.58;
    const rect = table.getBoundingClientRect();
    const boxes = list.map((p) => {
      const turned = (((p.rotate || 0) % 180) + 180) % 180 === 90;
      const w = turned ? 1 / aspect : 1;
      const h = turned ? 1 : 1 / aspect;
      return { cx: p.x, cy: p.y / aspect, w, h };
    });
    const minX = Math.min(...boxes.map((b) => b.cx - b.w / 2));
    const maxX = Math.max(...boxes.map((b) => b.cx + b.w / 2));
    const minY = Math.min(...boxes.map((b) => b.cy - b.h / 2));
    const maxY = Math.max(...boxes.map((b) => b.cy + b.h / 2));
    const pad = 0.35;
    const width = Math.max(rect.width, 200);
    const height = Math.max(rect.height, 200);
    const unit = Math.min(width / (maxX - minX + 2 * pad), height / (maxY - minY + 2 * pad), MAX_CARD_WIDTH);
    const offsetX = (width - (maxX - minX) * unit) / 2 - minX * unit;
    const offsetY = (height - (maxY - minY) * unit) / 2 - minY * unit;

    table.style.setProperty("--label-font", `${Math.max(10, Math.min(15, unit * 0.085))}px`);
    table.style.setProperty("--card-font", `${Math.max(9, unit * 0.1)}px`);

    boxes.forEach((b, i) => {
      const { slot, label } = slots[i];
      Object.assign(slot.style, {
        left: `${offsetX + b.cx * unit}px`,
        top: `${offsetY + b.cy * unit}px`,
        width: `${unit}px`,
        height: `${unit / aspect}px`,
        zIndex: String(i + 1),
      });
      Object.assign(label.style, {
        left: `${offsetX + (b.cx - b.w / 2) * unit}px`,
        top: `${offsetY + (b.cy - b.h / 2) * unit}px`,
      });
    });
  }

  function updateSlots() {
    slots.forEach(({ slot, label, button }, i) => {
      const p = placement(i);
      slot.classList.toggle("selected", i === selected);
      if (button) button.classList.toggle("face-down", !p.revealed);
      label.replaceChildren(labelText(i));
    });
  }

  // ---- side panel -----------------------------------------------------------

  function keywordBlock(title, text, extraClass) {
    return el("div", { class: "keywords " + extraClass },
      el("h3", {}, title),
      el("p", {}, text || "—"));
  }

  function cardDetail(card, reversed) {
    const suit = suitOf(card);
    const sub = card.arcana === "major"
      ? `Major Arcana · ${ROMAN[card.number] ?? card.number}`
      : [suit?.name, suit?.fields["tarot suit"]].filter(Boolean).join(" · ");

    const facts = el("dl", { class: "facts" });
    const fact = (term, value) => { if (value) facts.append(el("dt", {}, term), el("dd", {}, value)); };
    fact("Association", card.association);
    if (suit) {
      fact("Faction", suit.fields.faction);
      fact("Element", suit.fields.element);
    }

    const active = reversed
      ? keywordBlock("Reversed", card.reversed, "rev")
      : keywordBlock("Upright", card.upright, "");
    const other = reversed
      ? keywordBlock("Upright", card.upright, "other")
      : keywordBlock("Reversed", card.reversed, "other");

    return [
      el("div", { class: "detail-image", style: { "--aspect": deck.aspect } }, frontFace(card, reversed)),
      el("h2", { class: "card-name" }, card.name,
        el("span", { class: "orientation" + (reversed ? " rev" : "") }, reversed ? "Reversed" : "Upright")),
      el("p", { class: "card-sub" }, [card.subtitle, sub].filter(Boolean).join(" — ")),
      el("p", { class: "meaning-word" }, card.meaning),
      active,
      other,
      facts,
      el("div", { class: "flavor" }, card.text.map((t) => el("p", { html: richText(t) }))),
    ];
  }

  function helpText() {
    return el("div", { class: "empty-help" },
      el("p", {}, reading
        ? "Click a card to turn it over and read it."
        : "Choose a spread and press Deal."),
      el("p", {}, el("kbd", {}, "Space"), " or ", el("kbd", {}, "→"), " turns over the next card; ",
        el("kbd", {}, "←"), " steps back; ", el("kbd", {}, "D"), " deals; ", el("kbd", {}, "A"), " reveals all."));
  }

  function renderCardTab() {
    const body = $("panel-card");
    if (selected === null) {
      body.replaceChildren(spreadAbout(), helpText());
      return;
    }
    const position = positions()[selected];
    const p = placement(selected);
    const head = [
      el("p", { class: "position-head" }, `${positionNumber(selected)} · ${position.label}`),
      position.meaning ? el("p", { class: "position-meaning" }, position.meaning) : null,
    ];
    if (!p || !p.card) {
      body.replaceChildren(...head, el("p", { class: "empty-help" }, "No card here."));
    } else if (!p.revealed) {
      body.replaceChildren(...head, el("p", { class: "empty-help" }, "Face down. Click the card to turn it over."));
    } else {
      body.replaceChildren(...head, ...cardDetail(p.card, p.reversed));
    }
    body.scrollTop = 0;
  }

  function spreadAbout() {
    return el("div", { class: "spread-about" },
      el("h2", {}, spread.name),
      spread.description ? el("p", {}, spread.description) : null);
  }

  function renderReadingTab() {
    const body = $("panel-reading");
    const items = positions().map((position, i) => {
      const p = placement(i);
      let what;
      if (!p) {
        what = el("span", { class: "kw" }, position.meaning);
      } else if (!p.card) {
        what = el("span", { class: "kw" }, "Empty");
      } else if (!p.revealed) {
        what = el("span", { class: "kw" }, "Face down");
      } else {
        what = el("span", {}, p.card.name,
          p.reversed ? el("span", { class: "rev" }, " (reversed)") : null,
          el("span", { class: "kw" }, ` — ${p.card.meaning}`));
      }
      return el("li", { class: i === selected ? "selected" : null },
        el("button", {
          onclick: () => {
            if (p && p.card) reveal(i);
            else { selected = i; tab = "card"; refresh(); }
          },
        },
        el("span", { class: "num" }, positionNumber(i)),
        el("span", { class: "pos" }, position.label),
        el("span", { class: "what" }, what)));
    });
    body.replaceChildren(spreadAbout(), el("ol", { class: "reading-list" }, items));
  }

  function renderPanel() {
    document.querySelectorAll(".tabs button").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    });
    $("panel-card").hidden = tab !== "card";
    $("panel-reading").hidden = tab !== "reading";
    if (tab === "card") renderCardTab();
    else renderReadingTab();
  }

  function refresh() {
    updateSlots();
    renderPanel();
    updateButtons();
  }

  function updateButtons() {
    const anyHidden = !!reading && reading.placements.some((p) => p.card && !p.revealed);
    $("next").disabled = !reading;
    $("reveal-all").disabled = !anyHidden;
    $("copy").disabled = !reading;
    $("extend").hidden = !spread.extend;
    $("extend").disabled = !reading || !reading.pile.length;
  }

  // ---- copy as text ---------------------------------------------------------

  function readingAsText() {
    const lines = [`${deck.name} — ${spread.name}`, ""];
    reading.placements.forEach((p, i) => {
      if (!p.card) return;
      const orientation = p.reversed ? "reversed" : "upright";
      const keywords = p.reversed ? p.card.reversed : p.card.upright;
      lines.push(`${positionNumber(i)}. ${p.position.label}: ${p.card.name}` +
        (p.position.significator ? "" : ` (${orientation})`) +
        ` — ${p.card.meaning}. ${keywords}`);
    });
    return lines.join("\n");
  }

  async function copyReading() {
    if (!reading) return;
    const text = readingAsText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = el("textarea", { style: { position: "fixed", opacity: "0" } }, text);
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast("Reading copied to the clipboard");
  }

  let toastTimer = null;
  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2200);
  }

  // ---- controls -------------------------------------------------------------

  function fillSelect(select, options, value) {
    select.replaceChildren(...options);
    if (value !== null && [...select.options].some((o) => o.value === value)) select.value = value;
  }

  function fillSignificatorSelect() {
    const groups = [el("optgroup", { label: "Major Arcana" },
      deck.cards.filter((c) => c.arcana === "major").map((c) => el("option", { value: c.id }, c.name)))];
    for (const suit of deck.suits) {
      const cards = deck.cards.filter((c) => c.suit === suit.id);
      const courts = cards.filter((c) => c.court);
      const rest = cards.filter((c) => !c.court);
      groups.push(el("optgroup", { label: suit.name },
        [...courts, ...rest].map((c) => el("option", { value: c.id }, c.name))));
    }
    fillSelect($("significator-select"), [
      el("option", { value: "random-court" }, "Random court card"),
      el("option", { value: "random" }, "Random card"),
      el("option", { value: "none" }, "None"),
      ...groups,
    ], settings.significator);
    settings.significator = $("significator-select").value;
  }

  function selectDeck(id) {
    deck = data.decks.find((d) => d.id === id) || data.decks[0];
    settings.deckId = deck.id;
    document.title = deck.name;
    $("deck-title").textContent = deck.name;
    fillSignificatorSelect();
    renderNotices();
  }

  function selectSpread(id) {
    spread = data.spreads.find((s) => s.id === id) || data.spreads[0];
    settings.spreadId = spread.id;
    $("significator-field").hidden = !spread.positions.some((p) => p.significator);
    reading = null;
    selected = null;
    buildTable(false);
    renderPanel();
    updateButtons();
  }

  function renderNotices() {
    const notes = [];
    const folder = `apps/tarot/decks/${deck.id}/images/`;
    if (deck.missingImages.length) {
      notes.push(el("details", {},
        el("summary", {}, `${deck.missingImages.length} of ${deck.cards.length} cards have no image yet and show as text. Drop image files into ${folder}`),
        el("p", {}, deck.missingImages.join(", "))));
    }
    if (deck.unmatchedImages.length) {
      notes.push(el("details", {},
        el("summary", {}, `${deck.unmatchedImages.length} image file(s) in ${folder} didn't match a card name`),
        el("p", {}, deck.unmatchedImages.join(", "))));
    }
    $("notices").replaceChildren(...notes);
    $("notices").hidden = !notes.length;
  }

  function setupControls() {
    const deckSelect = $("deck-select");
    fillSelect(deckSelect, data.decks.map((d) => el("option", { value: d.id }, d.name)), settings.deckId);
    $("deck-field").hidden = data.decks.length < 2;
    deckSelect.addEventListener("change", () => {
      selectDeck(deckSelect.value);
      selectSpread(spread.id);
      saveSettings();
    });

    const spreadSelect = $("spread-select");
    fillSelect(spreadSelect, data.spreads.map((s) => el("option", { value: s.id }, s.name)), settings.spreadId);
    spreadSelect.addEventListener("change", () => { selectSpread(spreadSelect.value); saveSettings(); });

    $("significator-select").addEventListener("change", (e) => { settings.significator = e.target.value; saveSettings(); });

    for (const [id, key] of [["reversals", "reversals"], ["majors-only", "majorsOnly"]]) {
      const box = $(id);
      box.checked = settings[key];
      box.addEventListener("change", () => { settings[key] = box.checked; saveSettings(); });
    }

    $("deal").addEventListener("click", deal);
    $("next").addEventListener("click", next);
    $("reveal-all").addEventListener("click", revealAll);
    $("extend").addEventListener("click", extend);
    $("copy").addEventListener("click", copyReading);

    document.querySelectorAll(".tabs button").forEach((b) => {
      b.addEventListener("click", () => { tab = b.dataset.tab; renderPanel(); });
    });

    document.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest("select, input, textarea")) return;
      const key = e.key.toLowerCase();
      if (key === " " || key === "arrowright") {
        if (e.target.closest("button") && key === " ") return; // let Space press the focused button
        e.preventDefault();
        next();
      } else if (key === "arrowleft") {
        e.preventDefault();
        step(-1);
      } else if (key === "d") {
        deal();
      } else if (key === "a") {
        revealAll();
      } else if (key === "escape") {
        selected = null;
        refresh();
      }
    });

    new ResizeObserver(() => layoutTable()).observe(table);
  }

  function showLoadError(error) {
    document.body.replaceChildren(el("div", { class: "load-error" },
      el("h1", {}, "Couldn't load the cards"),
      el("p", {}, "The tarot reader needs its data file. Start it from the repository folder with ",
        el("code", {}, "python serve.py"), " and it will open in your browser."),
      el("p", {}, String(error))));
  }

  async function init() {
    try {
      const response = await fetch("data.json", { cache: "no-store" });
      data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`);
      if (!data.decks.length || !data.spreads.length) throw new Error("No decks or spreads found.");
    } catch (error) {
      showLoadError(error);
      return;
    }
    selectDeck(settings.deckId);
    setupControls();
    selectSpread(settings.spreadId);
  }

  init();
})();
