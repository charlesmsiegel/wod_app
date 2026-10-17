# Changeling cantrip deck: design and review notes

The catalogue models 168 physical card identities, each with an independently replaceable art face and printed reverse. A card table provides a sandbox; a separate personal kit models first-edition cantrip casting, so browsing or a practice draw cannot consume a character's cards. Both views use the same catalogue and inspection panel.

The casting model holds one Art, one or more Realms, and the drawn Bunks until the effect ends. Ending an effect discards one used card or records one Glamour spent to retain it; retained Bunks return to the shuffled personal deck. Nightmares apply immediately and leave that deck permanently. Refreshing restores discarded ordinary cards but never releases active cards or resurrects Nightmares.

Implementation plan: pin catalogue/image confinement and casting transitions with Python/Node tests; add the stdlib loader and importer; build the two responsive views; verify the server route, static build, existing suite, and browser.

Reused: the existing `serve.py` generated-data route and static build, standard-library JSON/Path/URL quoting, and the repository's vanilla DOM and Node-test conventions. The sandbox and personal kit deliberately have separate zones: merging them would let a practice draw consume a character's active spell components. Replacing a card's image or correcting its text changes its manifest entry, without a new state transition.

Sources: *Changeling: The Dreaming* (1995), printed pp. 191–195 (PDF 193–197), Arts/Realms pp. 195–211, Bunks/Nightmares pp. 212–215 (PDF 214–217), and the recovered Cantrip Cards. Short card summaries are paraphrases, not complete power descriptions. The Players Kit p. 3 offers an optional Bunk-selection/fixed-success variation; this app uses the original core-book successes and does not silently apply that variation.

The source archive reports 157 confirmed fronts; eleven Nightmare fronts and two incorrectly duplicated Nature text backs remain unrecovered. AI companions and partial candidates are never selected by the importer. Artwork is local and ignored by Git; no sourcebook PDF or card scan belongs in this change.

Assumptions and limits: one local player's kit, held in memory for the tab session; no oathmate card sharing, automatic dice, character-sheet accounting, or adjudication of Realm applicability. The advanced same-suit success bonus is described but not automated. Nightmares are selected during kit setup; Recurring Nightmare's extra taboo draw is handled at the table. The Storyteller determines effects, witnesses' Banality, Nightmare consequences, and when rest/Reverie/Rapture permits refresh. The recovered Raw Material reverse omits an Ability; the core book p. 209 supplies Science. Sovereign's Attribute is Charisma (core p. 205).
