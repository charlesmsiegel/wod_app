(function (root) {
  'use strict';

  // Named Houses and sub-Houses, not a claim that every entry coexisted.
  // The groups describe the Revised-era sources; historical entries stay usable.
  // Aliases belong to the same lineage. See docs/hermetic-houses.md for evidence.
  const revised = 'Order of Hermes Revised, pp. 34–35 (PDF 36–37)';
  const houses = [
    { name: 'Bonisagus', group: 'Great Houses — Revised era', aliases: [],
      note: 'Founding House of magical theory and research; still active after the Reckoning.', citation: revised },
    { name: 'Ex Miscellanea', group: 'Great Houses — Revised era', aliases: ['Order of Miscellany'],
      note: 'An umbrella for smaller, former and newly developing Hermetic Houses.', citation: 'Order of Hermes Revised, pp. 35, 50–51 (PDF 37, 52–53)' },
    { name: 'Flambeau', group: 'Great Houses — Revised era', aliases: ['Ignis'],
      note: 'Founding House of fire-wizards and the Order’s defenders. Ignis is another name for this House.', citation: 'Order of Hermes Revised, pp. 34, 51 (PDF 36, 53)' },
    { name: 'Fortunae', group: 'Great Houses — Revised era', aliases: [],
      note: 'Seers, mathematical mystics and masters of fortune; promoted from Ex Miscellanea in 1936.', citation: revised },
    { name: 'Quaesitor', group: 'Great Houses — Revised era', aliases: ['Guernicus'],
      note: 'The Order’s judges. The earlier book calls Guernicus its unused official name; Revised instead says its founder chose Quaesitor.', citation: 'Order of Hermes (1997), p. 42 (PDF 44); Revised, p. 55 (PDF 57)' },
    { name: 'Shaea', group: 'Great Houses — Revised era', aliases: ['House of Seshat', 'House of the Crescent Moon'],
      note: 'Egyptian-rooted scholars of language and records; a full House since 1982. Earlier names include the House of Seshat and House of the Crescent Moon. The books differ on when it first entered Ex Miscellanea.', citation: 'Order of Hermes Revised, p. 35 (PDF 37); Guide to the Traditions, p. 100 (PDF 102)' },
    { name: 'Solificati', group: 'Great Houses — Revised era', aliases: ['Children of Knowledge'],
      note: 'Alchemists who joined the Order in 1999. Their earlier independent Tradition and Craft are part of their history, not additional Hermetic Houses.', citation: 'Order of Hermes Revised, p. 35 (PDF 37); Blood Treachery, p. 21 (PDF 23)' },
    { name: 'Tytalus', group: 'Great Houses — Revised era', aliases: [],
      note: 'Founding House devoted to Will and challenge; censured and rebuilding after the Second Massassa War.', citation: 'Order of Hermes Revised, pp. 33, 35, 59–60 (PDF 35, 37, 61–62)' },
    { name: 'Verditius', group: 'Great Houses — Revised era', aliases: [],
      note: 'Founding House of enchanters and artisans; its restored Great House absorbed most of Thig in late 2002.', citation: 'Order of Hermes Revised, pp. 35, 60–61 (PDF 37, 62–63)' },

    { name: 'Batini', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'A handful of Ahl-i-Batin disciples joined Ex Miscellanea before World War II as House Batini. The whole Ahl-i-Batin did not join the Order.', citation: 'Guide to the Traditions, p. 101 (PDF 103)' },
    { name: 'Criamon', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'Founding House of ecstatic seers, now within Ex Miscellanea and badly diminished. The books differ on when it lost full House status.', citation: 'Order of Hermes (1997), p. 34 (PDF 36); Revised, pp. 34, 50 (PDF 36, 52)' },
    { name: 'Hong Lei', group: 'Smaller Houses & Ex Miscellanea', aliases: ['House of Crimson Thunder'],
      note: 'Wu Lung-descended ritualists, admitted around 2000 under probation and described within Ex Miscellanea.', citation: 'Order of Hermes Revised, pp. 35, 50 (PDF 37, 52)' },
    { name: 'Jerbiton', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'Founding House of artists and diplomats, surviving within Ex Miscellanea. Its date of absorption differs between editions.', citation: 'Order of Hermes (1997), p. 34 (PDF 36); Revised, pp. 35, 50 (PDF 37, 52)' },
    { name: 'Merinita', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'Founding House of faerie mystics, now within Ex Miscellanea; weakened by its disappearing otherworldly ties.', citation: 'Order of Hermes Revised, pp. 35, 50 (PDF 37, 52)' },
    { name: 'Ngoma', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'African high ritualists admitted in 2001; described among the Houses within Ex Miscellanea.', citation: 'Order of Hermes Revised, pp. 34–35, 50 (PDF 36–37, 52)' },
    { name: 'Skopos', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'A small House founded in 2000, applying Hermetic theory to perception, noetics and quantum reality.', citation: 'Order of Hermes Revised, pp. 35, 51 (PDF 37, 53)' },
    { name: 'Xaos', group: 'Smaller Houses & Ex Miscellanea', aliases: [],
      note: 'Discordian and chaos-oriented dissidents from Thig, founded in 2001 within Ex Miscellanea.', citation: 'Order of Hermes Revised, pp. 34–35, 51 (PDF 36–37, 53)' },

    { name: 'Bjornaer', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'Founding House of Germanic shapechangers; its members passed into the Verbena during the Grand Convocation.', citation: 'Order of Hermes Revised, p. 34 (PDF 36)' },
    { name: 'Castrovinci', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'A Christian miracle-working family and sub-House of Ex Miscellanea, broken by the Inquisition; some escaped. Its later institutional survival is unspecified.', citation: 'Order of Hermes (1997), p. 65 (PDF 67); Blood Treachery, p. 89 (PDF 91)' },
    { name: 'Diedne', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'Founding House of Druidic wizards, destroyed in the Schism War; rumors of survivors remain.', citation: 'Order of Hermes Revised, p. 34 (PDF 36)' },
    { name: 'Golo', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'A scientific sub-House founded in 1171; departed in 1188, with members later joining other Houses or the early Order of Reason.', citation: revised },
    { name: 'Janissary', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'Established in 1700; active in Blood Treachery, then destroyed and renounced in the Revised-era account (2001).', citation: 'Blood Treachery, p. 20 (PDF 22); Order of Hermes Revised, pp. 33, 35 (PDF 35, 37)' },
    { name: 'Luxor', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'An American House bridging science, spiritualism and religion (1872–1936); later subsumed into the Sons of Ether.', citation: revised },
    { name: 'Mercere', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'Founding House of communicators and political operators; passed through Ex Miscellanea and into Fortunae during the 1930s.', citation: revised },
    { name: 'Tharsis', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'A House of weather and sea magic (1522–1897), destroyed by the Order for diabolic corruption.', citation: revised },
    { name: 'Thig', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'Modernist technomystics, still prominent in Blood Treachery. Revised’s timeline gives 1846–1999, but its detailed account has most survivors merging into Verditius in late 2002; others founded Xaos.', citation: 'Blood Treachery, p. 21 (PDF 23); Order of Hermes Revised, pp. 35, 51, 60–61 (PDF 37, 53, 62–63)' },
    { name: 'Tremere', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'A founding Hermetic House expelled after its turn to vampirism. This historical affiliation does not make the modern vampire clan a current Hermetic House.', citation: 'Order of Hermes Revised, p. 35 (PDF 37); Blood Treachery, p. 54 (PDF 56)' },
    { name: 'Validas', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'An English House (1557–1700), weakened by the Nasby Catastrophe and renounced for diabolism; a later Infernal sect may survive.', citation: revised },
    { name: 'Ziracah', group: 'Historical, departed & absorbed Houses', aliases: [],
      note: 'A House of desire magic (1327–1780), weakened at Nasby and destroyed after conflict with King George III.', citation: revised },
  ];

  const catalogue = Object.freeze(houses.map(house => Object.freeze({
    ...house, aliases: Object.freeze(house.aliases),
  })));
  if (typeof module !== 'undefined' && module.exports) module.exports = catalogue;
  else root.HermeticHouses = catalogue;
})(globalThis);
