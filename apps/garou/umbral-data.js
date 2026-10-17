/* The Aetherial overlay draws on Rage Across the Heavens (1999):
 * "Cultural Astrology and the Thirteen Tribes", pp. 63-64, and
 * "Comets, Eclipses and other Aetherial Objects", pp. 80-81.
 *
 * Fictional/Umbral-only locations are explicitly NOT astronomical ephemerides.
 * Except for the physical underlying star positions, all overlay markers and
 * texts are interpretive/story-facing. This tool never presents invented
 * physical coordinates for Umbral Celestines.
 */
((root) => {
  "use strict";

  const constellations = {
    "Orion":{
      title:"Diana · the Huntress",
      tribes:["Black Furies"],
      detail:"Black Furies read the figure commonly called Orion as Diana, reflecting a distinct tribal sky tradition."
    },
    "Ursa Major":{
      title:"Fenris / The Plough",
      tribes:["Get of Fenris","Fianna","Shadow Lords","Silver Fangs"],
      names:{"Get of Fenris":"Fenris","Fianna":"The Plough"},
      detail:"To the Get of Fenris, this is Fenris, not the familiar bear. The Fianna call the same pattern The Plough. Northern European tribal traditions also attend closely to this constellation."
    },
    "Ursa Minor":{
      title:"The northern watch",
      tribes:["Get of Fenris","Shadow Lords","Silver Fangs"],
      detail:"The Lesser Bear and its pole star are particularly important to the northern tribal traditions."
    },
    "Corona Borealis":{
      title:"Arianrhod's Crown",
      tribes:["Fianna"],
      detail:"The Fianna honor the Northern Crown as the home of the Incarna Arianrhod."
    },
    "Pleiades":{
      title:"Izarra Tarana · the Star Singers",
      tribes:["Uktena","Wendigo"],
      names:{"Uktena":"The Seven Sisters","Wendigo":"The Seven Sisters"},
      detail:"The Star Singers inhabit the Pleiades. Uktena and Wendigo also know the cluster as the Seven Sisters."
    },
    "Crux":{
      title:"Yaraan-Doo · the Dying One",
      tribes:["Bunyip"],
      detail:"A Garou celestial patron remembered in connection with the lost Bunyip and the Southern Cross."
    },
    "Hydra":{
      title:"Tiamat · the Water Serpent",
      tribes:["Bone Gnawers","Glass Walkers","Children of Gaia"],
      detail:"Several tribes preserve Babylonian and Sumerian celestial traditions, including Hydra's association with Tiamat."
    },
    "Andromeda":{
      title:"Andromeda",
      tribes:["Black Furies"],
      detail:"The Black Furies give particular attention to female figures in the sky, including Andromeda."
    },
    "Cassiopeia":{
      title:"Cassiopeia",
      tribes:["Black Furies"],
      detail:"Cassiopeia is one of the female figures particularly honored in Black Fury star lore."
    },
    "Pegasus":{
      title:"Pegasus",
      tribes:["Black Furies"],
      detail:"Pegasus is among the celestial figures especially meaningful to the Black Furies."
    },
    "Corvus":{
      title:"Corvus · the Crow",
      tribes:["Get of Fenris","Shadow Lords","Silver Fangs"],
      detail:"The crow is especially prominent in northern European tribal interpretations of the stars."
    },
    "Leo":{
      title:"Leo",
      tribes:[],
      detail:"The Western Lion corresponds to Katanka-Sonnak's lunar zodiac month. The Garou's lunar signs are not defined by the Sun passing through the pictured constellation."
    }
  };

  const starLore = {
    sirius: {
      title:"Matagar · Lord of Beginnings",
      tribes:["Silent Striders","Bone Gnawers","Glass Walkers","Children of Gaia","Red Talons"],
      detail:"The Dog Star recalls the flooding of the Nile and the Egyptian year. Matagar watches over new beginnings, loyalty, persistence and the hunt. Some Red Talons have their own names for this star."
    },
    polaris: {
      title:"Vegarda · Lady of the North",
      tribes:["Get of Fenris","Shadow Lords","Silver Fangs","Stargazers","Children of Gaia","Red Talons"],
      detail:"Vegarda embodies steadfast guidance. Get of Fenris honor her as Yggdrasil's keeper, the Children of Gaia as the Wheel of Transformation's center, and Stargazers as the Unmoved Mover."
    },
    capella: {
      title:"Capella · the Goat Star",
      tribes:["Bone Gnawers","Glass Walkers","Children of Gaia"],
      detail:"A bright northern star honored in the Mesopotamian sky traditions shared by several tribes."
    },
    alphard: {
      title:"Alphard · heart of Hydra",
      tribes:["Bone Gnawers","Glass Walkers","Children of Gaia"],
      detail:"A bright physical marker of Hydra, the Water Serpent associated with Tiamat in the tribes' inherited lore."
    }
  };
  const phenomena = [
    {
      id:"anthelios", name:"Anthelios · Eye of the Wyrm", kind:"Apocalypse-era Umbral star",
      detail:"A newly appearing baleful red presence in the Aetherial Realm. The narrative places it in the sector between Ursa Major and Leo. Its position is not a measured astronomical coordinate, and its manifestation depends on a chronicle's timeline.",
      placement:"Symbolic location only: between Ursa Major and Leo",
      canMap:true
    },
    {
      id:"vulcan", name:"Hakahe · the Ebon Whisperer", kind:"Hidden Umbral planet",
      detail:"The source describes Vulcan as Mercury's hidden orbital counterpart, a dark and secret realm of forging, inward knowledge, and transformation. No real planet is known at that claimed position.",
      placement:"No verified physical position"
    },
    {
      id:"rorg", name:"Rorg · the Many-Taloned Hunter", kind:"Asteroid-belt Incarna",
      detail:"Rorg's body is sundered across the asteroid belt. Rorg is an unofficial thirteenth Garou sign, not a normal lunar month and not a single astronomical point.",
      placement:"Region of the asteroid belt, not a fixed star"
    },
    {
      id:"songan", name:"Songan · the Noble Brother", kind:"Patron of the lost Croatan",
      detail:"Associated in the text with Chiron, a wandering minor body, and with the memory of the Croatan. Precise location needs a Chiron ephemeris not included in this app.",
      placement:"Chiron's astronomical position not calculated"
    },
    {
      id:"yakecen", name:"Yakecen · the Fallen Singer", kind:"Black-hole-associated spirit",
      detail:"An enigmatic distant black hole associated with the Black Spiral Dancers. Some Garou speculate that Anthelios came from this region, but the source does not establish that as certain.",
      placement:"Unknown; no canonical sky coordinates"
    }
  ];

  const tribes = [
    "Black Furies","Bone Gnawers","Children of Gaia","Fianna",
    "Get of Fenris","Glass Walkers","Shadow Lords","Silent Striders",
    "Silver Fangs","Stargazers","Uktena","Wendigo","Red Talons","Bunyip"
  ];
  const milkyWay = {
    title:"Ancestors' Path · the Milky Way",
    tribes:["Uktena","Wendigo"],
    detail:"The Milky Way is the ancestral path to the heavens in Uktena and Wendigo sky lore. The line shown is the real galactic equator, drawn as a stylized luminous path rather than measured brightness."
  };

  // J2000 galactic longitude converted to equatorial Cartesian coordinates
  // via the transpose of the standard IAU galactic-frame matrix.
  // This is a *physical astronomical* great circle; the name is Garou lore.
  function galacticEquator(A, date, observer) {
    const list=[];
    for(let degrees=0;degrees<=360;degrees+=5) {
      const l=degrees*Math.PI/180,c=Math.cos(l),s=Math.sin(l);
      const x=-0.0548755604*c+0.4941094279*s;
      const y=-0.8734370902*c-0.4448296300*s;
      const z=-0.4838350155*c+0.7469822445*s;
      const ra=((Math.atan2(y,x)*12/Math.PI)%24+24)%24;
      const dec=Math.asin(z)*180/Math.PI;
      list.push(A.skyStar({name:"Milky Way",key:"galactic-"+degrees,ra,dec,mag:9},date,observer));
    }
    return list;
  }

  // Symbolic anchor for *the sector*, not a claimed location of Anthelios.
  // The source places it between Ursa Major and Leo, without ephemerides.
  function antiSunSector(A, date, observer) {
    return A.skyStar({
      key:"symbolic-anthelios",name:"Anthelios (illustrative region)",
      ra:11.1,dec:35,mag:8
    },date,observer);
  }

  function relevant(tradition, lens) {
    return lens==="all" || tradition.tribes.includes(lens);
  }

  root.GarouUmbral={
    constellations,starLore,phenomena,tribes,milkyWay,
    galacticEquator,antiSunSector,relevant
  };
})(globalThis);
