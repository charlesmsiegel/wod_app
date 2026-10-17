/* Short, original interpretations of published Garou celestial correspondences.
 * Astronomical stars use approximate J2000 equatorial coordinates (hours/degrees).
 * Validate any expanded tribal variants against Rage Across the Heavens.
 */
(function (root) {
  "use strict";
  const patrons = [
    ["Nerigal","The Ice Warrior","Mars","Aries","Get of Fenris","Ahroun","Ferocity","Courage","Anger","The first spark: what deserves your strength?"],
    ["Eshtarra","The Songteller","Earth","Taurus","Fianna","Galliard","Fruitfulness","Nurture","Excess","What must be protected so that it can flourish?"],
    ["Mitanu","The Clever Rogue","Mercury","Gemini","Bone Gnawers","Ragabash","Quickness","Cleverness","Avarice","What unexpected path has everyone overlooked?"],
    ["Sokhta","The Lambent Lady","Moon","Cancer","Stargazers","Theurge","Mystery","Quiet insight","Envy","What does the reflected light reveal?"],
    ["Katanka-Sonnak","The Wind Rider","Sun","Leo","Wendigo","Ahroun","Warmth","Vigor","Gluttony","Where can you kindle new life?"],
    ["Hakahe","The Ebon Whisperer","Vulcan (Umbral)","Virgo","Uktena","Theurge","Sorcery","Craft","Despair","Which hidden thing is waiting to be made?"],
    ["Tambiyah","The Veiled Mother","Venus","Libra","Black Furies","Galliard","Wisdom","Protection","Lust","What balance can mercy restore?"],
    ["Meros","The Wandering Mystic","Pluto","Scorpio","Silent Striders","Philodox","Movement","Adaptability","Unreliability","What must change before the journey continues?"],
    ["Zarok","The Crowned Ruler","Jupiter","Sagittarius","Silver Fangs","Philodox","Authority","Leadership","Pride","Who will bear responsibility for the next choice?"],
    ["Lu-Bat","The Peaceful Counselor","Saturn","Capricorn","Children of Gaia","Ragabash","Acceptance","Patience","Sloth","Which limit brings wisdom rather than defeat?"],
    ["Ruatma","The Shadowed One","Uranus","Aquarius","Shadow Lords","Theurge","Secrecy","Discretion","Treachery","What truth is concealed in plain sight?"],
    ["Shantar","The Loom Maker","Neptune","Pisces","Glass Walkers","Philodox","Mutability","Invention","Heedlessness","Which pattern is ready to be rewoven?"]
  ].map(([name,title,body,zodiac,tribe,auspice,quality,virtue,vice,question],i) =>
    ({ name,title,body,zodiac,tribe,auspice,quality,virtue,vice,question,number:i+1 }));
  const rorg = {
    name:"Rorg",title:"The Many-Taloned Hunter",body:"Asteroid Belt (Umbral)",
    tribe:"Red Talons",quality:"Instinct",
    note:"A thirteenth sign outside the twelve-month calendar, not a canonical leap-month patron."
  };
  const stars = [
    ["polaris","Polaris",2.5303,89.2641,1.97],["sirius","Sirius",6.7525,-16.7161,-1.46],
    ["betelgeuse","Betelgeuse",5.9195,7.4071,0.5],["rigel","Rigel",5.2423,-8.2016,0.13],
    ["bellatrix","Bellatrix",5.4189,6.3497,1.64],["saiph","Saiph",5.7959,-9.6696,2.07],
    ["mintaka","Mintaka",5.5334,-0.2991,2.23],["alnilam","Alnilam",5.6036,-1.2019,1.69],
    ["alnitak","Alnitak",5.6793,-1.9426,1.74],
    ["dubhe","Dubhe",11.0622,61.7510,1.81],["merak","Merak",11.0307,56.3824,2.34],
    ["phecda","Phecda",11.8972,53.6948,2.41],["megrez","Megrez",12.2570,57.0326,3.31],
    ["alioth","Alioth",12.9005,55.9598,1.76],["mizar","Mizar",13.3987,54.9254,2.27],
    ["alkaid","Alkaid",13.7924,49.3133,1.85],
    ["caph","Caph",0.1529,59.1498,2.28],["schedar","Schedar",0.6751,56.5373,2.24],
    ["gammacas","Gamma Cassiopeiae",0.9451,60.7167,2.15],
    ["ruchbah","Ruchbah",1.4303,60.2353,2.68],["segin","Segin",1.9066,63.6700,3.35],
    ["alpheratz","Alpheratz",0.1398,29.0904,2.06],
    ["mirach","Mirach",1.1622,35.6206,2.07],["almach","Almach",2.0650,42.3297,2.1],
    ["markab","Markab",23.0793,15.2053,2.49],["scheat","Scheat",23.0629,28.0828,2.44],
    ["algenib","Algenib",0.2206,15.1836,2.83],
    ["gienah","Gienah",12.2634,-17.5419,2.59],["kraz","Kraz",12.5731,-23.3968,2.65],
    ["algorab","Algorab",12.4977,-16.5154,2.94],["minkar","Minkar",12.1687,-22.6198,3.0],
    ["acrux","Acrux",12.4433,-63.0991,0.77],["mimosa","Mimosa",12.7953,-59.6886,1.25],
    ["gacrux","Gacrux",12.5194,-57.1132,1.59],["deltacru","Delta Crucis",12.2524,-58.7489,2.79],
    ["alphecca","Alphecca",15.5781,26.7147,2.22],["nusakan","Nusakan",15.4648,29.1057,3.66],
    ["gammacrb","Gamma CrB",15.7120,26.2950,3.84],["deltacrb","Delta CrB",15.8260,26.0688,4.6],
    ["epscrb","Epsilon CrB",15.9590,26.8770,4.15],
    ["alcyone","Alcyone",3.7914,24.1051,2.86],["maia","Maia",3.7637,24.3679,3.87],
    ["electra","Electra",3.7479,24.1133,3.70],["merope","Merope",3.7721,23.9484,4.17],
    ["taygeta","Taygeta",3.7535,24.4673,4.3],
    ["vega","Vega",18.6156,38.7837,0.03],["altair","Altair",19.8464,8.8683,0.76],
    ["deneb","Deneb",20.6905,45.2803,1.25],["arcturus","Arcturus",14.2610,19.1825,-0.05],
    ["capella","Capella",5.2782,45.9980,0.08],["antares","Antares",16.4901,-26.4320,1.06]
  ].map(([key,name,ra,dec,mag])=>({key,name,ra,dec,mag}));
  const constellations = [
    {name:"Orion",garou:"Diana (Black Fury tradition)",story:"The hunter's shape is read differently by different tribes.",path:["betelgeuse","bellatrix","mintaka","alnilam","alnitak","saiph","rigel"],extra:[["betelgeuse","saiph"],["bellatrix","rigel"],["mintaka","rigel"],["alnitak","saiph"]]},
    {name:"Ursa Major",garou:"Fenris (Get of Fenris)",story:"The familiar northern bear and plough carry tribal memories.",path:["dubhe","merak","phecda","megrez","alioth","mizar","alkaid"],extra:[["dubhe","megrez"]]},
    {name:"Cassiopeia",garou:"Cassiopeia",story:"A northern queen among the stars.",path:["caph","schedar","gammacas","ruchbah","segin"]},
    {name:"Andromeda",garou:"Andromeda",story:"One of the constellations given differing tribal readings.",path:["alpheratz","mirach","almach"]},
    {name:"Pegasus",garou:"Pegasus",story:"A figure among the autumn stars.",path:["markab","scheat","alpheratz","algenib","markab"]},
    {name:"Corvus",garou:"Corvus",story:"The raven is significant in the Changing Breeds' star lore.",path:["gienah","algorab","minkar","kraz","gienah"]},
    {name:"Crux",garou:"Yaraan-Doo · The Dying One",story:"The Southern Cross is linked to mourning and loss in Garou accounts.",path:["gacrux","acrux"],extra:[["mimosa","deltacru"]]},
    {name:"Corona Borealis",garou:"Arianrhod (Fianna tradition)",story:"A northern crown given a mythic identity.",path:["nusakan","alphecca","gammacrb","deltacrb","epscrb"]},
    {name:"Pleiades",garou:"Izarra Tarana · The Star Singers",story:"The Star Singers are a bright cluster in Taurus.",path:["electra","maia","taygeta","alcyone","merope"]}
  ];
  const starLore = {
    sirius:{garou:"Matagar · Lord of Beginnings",story:"The Dog Star, named Matagar in Garou sky lore."},
    polaris:{garou:"Vegarda · Lady of the North",story:"The North Star, a fixed guide for travelers."}
  };
  root.GarouData = {patrons,rorg,stars,constellations,starLore};
})(globalThis);
