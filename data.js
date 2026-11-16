/* ============================================================
   WASTELAND RPG — GAME DATA
   All content tables live here: items, enemies, allies,
   locations (POIs), events, C.A.M.P. structures and recipes.
   game.js reads these; nothing in here mutates at runtime.
============================================================ */

const RARITIES = ["Common", "Uncommon", "Rare", "Legendary"];

const RARITY_WEAPON_MULTIPLIER = { Common: 1.0, Uncommon: 1.2, Rare: 1.5, Legendary: 2.0 };
const RARITY_ARMOR_MULTIPLIER  = { Common: 1.0, Uncommon: 1.3, Rare: 1.6, Legendary: 2.0 };
const RARITY_VALUE_MULTIPLIER  = { Common: 1.0, Uncommon: 1.3, Rare: 1.7, Legendary: 2.5 };

/* ---------------------------
   ITEMS
   type: weapon | armor | consumable | junk
--------------------------- */
const ITEMS = {
  /* ---- WEAPONS ---- */
  rusty_pistol:   { name: "Rusty Pistol",       type: "weapon", damage: 5,  rarity: "Common",    value: 10,  desc: "Held together with tape and prayers." },
  pipe_pistol:    { name: "Pipe Pistol",        type: "weapon", damage: 6,  rarity: "Common",    value: 15,  desc: "A crude zip gun favored by raiders." },
  baseball_bat:   { name: "Baseball Bat",       type: "weapon", damage: 6,  rarity: "Common",    value: 12,  desc: "America's pastime, now with nails." },
  pistol_9mm:     { name: "9mm Pistol",         type: "weapon", damage: 7,  rarity: "Uncommon",  value: 25,  desc: "Reliable pre-war sidearm." },
  machete:        { name: "Machete",            type: "weapon", damage: 7,  rarity: "Common",    value: 18,  desc: "Favored blade of Legion recruits." },
  pistol_10mm:    { name: "10mm Pistol",        type: "weapon", damage: 8,  rarity: "Common",    value: 30,  desc: "The Vault-Tec standard issue." },
  pipe_rifle:     { name: "Pipe Rifle",         type: "weapon", damage: 8,  rarity: "Common",    value: 25,  desc: "Long barrel, short reliability." },
  service_rifle:  { name: "Service Rifle",      type: "weapon", damage: 8,  rarity: "Uncommon",  value: 45,  desc: "NCR infantry's trusty semi-auto." },
  laser_pistol:   { name: "Laser Pistol",       type: "weapon", damage: 10, rarity: "Rare",      value: 40,  desc: "AEP7 energy sidearm.", energy: true },
  hunting_rifle:  { name: "Hunting Rifle",      type: "weapon", damage: 11, rarity: "Common",    value: 55,  desc: "Bolt-action. One shot, one kill." },
  ripper:         { name: "Ripper",             type: "weapon", damage: 12, rarity: "Uncommon",  value: 70,  desc: "A handheld chainsaw. Loud and messy." },
  lever_action:   { name: "Lever-Action Rifle", type: "weapon", damage: 13, rarity: "Uncommon",  value: 75,  desc: "Frontier classic, chambered in .45-70." },
  combat_shotgun: { name: "Combat Shotgun",     type: "weapon", damage: 14, rarity: "Uncommon",  value: 80,  desc: "Devastating at close range." },
  power_fist:     { name: "Power Fist",         type: "weapon", damage: 15, rarity: "Uncommon",  value: 100, desc: "Pneumatic gauntlet. Punches through steel." },
  laser_rifle:    { name: "Laser Rifle",        type: "weapon", damage: 15, rarity: "Uncommon",  value: 110, desc: "AER9 military energy rifle.", energy: true },
  super_sledge:   { name: "Super Sledge",       type: "weapon", damage: 18, rarity: "Uncommon",  value: 140, desc: "Rocket-assisted sledgehammer." },
  plasma_rifle:   { name: "Plasma Rifle",       type: "weapon", damage: 19, rarity: "Rare",      value: 160, desc: "Melts targets into green goo.", energy: true },
  minigun:        { name: "Minigun",            type: "weapon", damage: 22, rarity: "Rare",      value: 220, desc: "Spin up. Hold trigger. Problem solved." },
  gauss_rifle:    { name: "Gauss Rifle",        type: "weapon", damage: 26, rarity: "Rare",      value: 300, desc: "Electromagnetic coilgun.", energy: true },
  alien_blaster:  { name: "Alien Blaster",      type: "weapon", damage: 30, rarity: "Legendary", value: 400, desc: "Not of this world. Ammo is... unusual.", energy: true },
  fat_man:        { name: "Fat Man",            type: "weapon", damage: 40, rarity: "Legendary", value: 600, desc: "Portable mini-nuke launcher." },

  /* ---- ARMOR ---- */
  vault_suit:         { name: "Vault Jumpsuit",           type: "armor", defense: 1,  hpBoost: 4,  rarity: "Common",    value: 10,  desc: "Blue and yellow. Comfortable." },
  raider_armor:       { name: "Raider Armor",             type: "armor", defense: 1,  hpBoost: 8,  rarity: "Uncommon",  value: 15,  desc: "Scrap metal and tire treads." },
  leather_armor:      { name: "Leather Armor",            type: "armor", defense: 2,  hpBoost: 10, rarity: "Common",    value: 20,  desc: "Tanned brahmin hide." },
  reinforced_leather: { name: "Reinforced Leather Armor", type: "armor", defense: 3,  hpBoost: 12, rarity: "Uncommon",  value: 30,  desc: "Leather with sewn-in plates." },
  metal_armor:        { name: "Metal Armor",              type: "armor", defense: 5,  hpBoost: 12, rarity: "Common",    value: 60,  desc: "Heavy, loud, effective." },
  combat_armor:       { name: "Combat Armor",             type: "armor", defense: 8,  hpBoost: 20, rarity: "Rare",      value: 70,  desc: "Pre-war military composite." },
  synth_armor:        { name: "Synth Armor",              type: "armor", defense: 9,  hpBoost: 22, rarity: "Uncommon",  value: 120, desc: "Institute polymer plating." },
  ncr_ranger:         { name: "NCR Ranger Armor",         type: "armor", defense: 11, hpBoost: 26, rarity: "Rare",      value: 200, desc: "Duster and helmet of a Veteran Ranger." },
  marine_armor:       { name: "Marine Armor",             type: "armor", defense: 13, hpBoost: 28, rarity: "Rare",      value: 260, desc: "Amphibious assault plating." },
  t45:                { name: "T-45 Power Armor",         type: "armor", defense: 14, hpBoost: 35, rarity: "Rare",      value: 320, desc: "First-generation power armor." },
  t51:                { name: "T-51b Power Armor",        type: "armor", defense: 17, hpBoost: 40, rarity: "Rare",      value: 420, desc: "Liberated Anchorage's finest." },
  t60:                { name: "T-60 Power Armor",         type: "armor", defense: 19, hpBoost: 45, rarity: "Legendary", value: 520, desc: "Brotherhood standard issue." },
  x01:                { name: "X-01 Power Armor",         type: "armor", defense: 23, hpBoost: 55, rarity: "Legendary", value: 700, desc: "Experimental. Unmatched protection." },

  /* ---- CONSUMABLES ---- */
  stimpak:         { name: "Stimpak",                  type: "consumable", heal: 15, value: 15, desc: "Restores 15 HP." },
  super_stimpak:   { name: "Super Stimpak",            type: "consumable", heal: 40, value: 45, desc: "Restores 40 HP." },
  radaway:         { name: "RadAway",                  type: "consumable", radHeal: 40, value: 30, desc: "Flushes 40 rads." },
  rad_x:           { name: "Rad-X",                    type: "consumable", buff: { id: "radx", name: "Rad-X", radResist: 0.5, secs: 90 }, value: 20, desc: "Halves radiation taken for 90s." },
  nuka_cola:       { name: "Nuka-Cola",                type: "consumable", heal: 5, ap: 3, rads: 1, value: 10, desc: "+5 HP, +3 AP. Zap that thirst!" },
  nuka_quantum:    { name: "Nuka-Cola Quantum",        type: "consumable", heal: 15, ap: 99, rads: 3, value: 50, desc: "+15 HP, fully restores AP." },
  purified_water:  { name: "Purified Water",           type: "consumable", heal: 6, radHeal: 2, value: 8, desc: "+6 HP. Clean, for once." },
  dirty_water:     { name: "Dirty Water",              type: "consumable", heal: 4, rads: 5, value: 2, desc: "+4 HP, +5 rads." },
  cram:            { name: "Cram",                     type: "consumable", heal: 8, rads: 1, value: 8, desc: "+8 HP. Mystery meat in a can." },
  fancy_lads:      { name: "Fancy Lads Snack Cakes",   type: "consumable", heal: 10, rads: 2, value: 10, desc: "+10 HP. Still fresh after 200 years." },
  sugar_bombs:     { name: "Sugar Bombs",              type: "consumable", heal: 8, rads: 3, value: 8, desc: "+8 HP. Part of a balanced breakfast." },
  iguana_stick:    { name: "Iguana on a Stick",        type: "consumable", heal: 12, value: 12, desc: "+12 HP. Bob's finest." },
  tato:            { name: "Tato",                     type: "consumable", heal: 4, value: 3, desc: "+4 HP. Mutant potato-tomato." },
  mutfruit:        { name: "Mutfruit",                 type: "consumable", heal: 5, value: 4, desc: "+5 HP. Sweet and purple." },
  radroach_meat:   { name: "Radroach Meat",            type: "consumable", heal: 3, rads: 3, value: 2, desc: "+3 HP, +3 rads. Cook it first." },
  molerat_meat:    { name: "Mole Rat Meat",            type: "consumable", heal: 5, rads: 3, value: 4, desc: "+5 HP, +3 rads." },
  brahmin_meat:    { name: "Brahmin Meat",             type: "consumable", heal: 6, rads: 2, value: 6, desc: "+6 HP, +2 rads." },
  mirelurk_meat:   { name: "Mirelurk Meat",            type: "consumable", heal: 8, rads: 4, value: 8, desc: "+8 HP, +4 rads." },
  deathclaw_meat:  { name: "Deathclaw Meat",           type: "consumable", heal: 20, rads: 5, value: 30, desc: "+20 HP, +5 rads." },
  grilled_radroach:{ name: "Grilled Radroach",         type: "consumable", heal: 10, value: 8, desc: "+10 HP. Crunchy." },
  molerat_steak:   { name: "Mole Rat Steak",           type: "consumable", heal: 15, value: 12, desc: "+15 HP." },
  brahmin_steak:   { name: "Brahmin Steak",            type: "consumable", heal: 20, value: 15, desc: "+20 HP." },
  mirelurk_cake:   { name: "Mirelurk Cake",            type: "consumable", heal: 25, value: 20, desc: "+25 HP. A coastal delicacy." },
  deathclaw_steak: { name: "Deathclaw Steak",          type: "consumable", heal: 45, buff: { id: "dcsteak", name: "Deathclaw Steak", str: 2, secs: 120 }, value: 80, desc: "+45 HP, +2 STR for 120s." },
  tato_stew:       { name: "Tato Stew",                type: "consumable", heal: 25, value: 20, desc: "+25 HP. Hearty." },
  buffout:         { name: "Buffout",                  type: "consumable", buff: { id: "buffout", name: "Buffout", str: 3, secs: 60 }, value: 25, desc: "+3 STR for 60s." },
  psycho:          { name: "Psycho",                   type: "consumable", buff: { id: "psycho", name: "Psycho", dmgMult: 0.25, secs: 60 }, value: 30, desc: "+25% damage for 60s." },
  med_x:           { name: "Med-X",                    type: "consumable", buff: { id: "medx", name: "Med-X", dr: 5, secs: 60 }, value: 25, desc: "+5 DR for 60s." },
  mentats:         { name: "Mentats",                  type: "consumable", buff: { id: "mentats", name: "Mentats", per: 2, int: 2, secs: 60 }, value: 25, desc: "+2 PER, +2 INT for 60s." },
  jet:             { name: "Jet",                      type: "consumable", ap: 6, value: 20, desc: "+6 AP. Time slows down, man." },

  /* ---- JUNK / MATERIALS ---- */
  scrap:          { name: "Scrap",            type: "junk", value: 1,   material: true, desc: "Assorted metal bits. Used everywhere." },
  wood:           { name: "Wood",             type: "junk", value: 1,   material: true, desc: "Planks and branches." },
  steel:          { name: "Steel",            type: "junk", value: 2,   material: true, desc: "Structural steel." },
  cloth:          { name: "Cloth",            type: "junk", value: 2,   material: true, desc: "Fabric scraps." },
  adhesive:       { name: "Adhesive",         type: "junk", value: 3,   material: true, desc: "Wonderglue and duct tape." },
  circuitry:      { name: "Circuitry",        type: "junk", value: 5,   material: true, desc: "Pre-war circuit boards." },
  nuclear:        { name: "Nuclear Material", type: "junk", value: 8,   material: true, desc: "Glowing. Handle carefully." },
  bloodleaf:      { name: "Bloodleaf",        type: "junk", value: 2,   material: true, desc: "Medicinal red herb." },
  glowing_fungus: { name: "Glowing Fungus",   type: "junk", value: 3,   material: true, desc: "Faintly radioactive mushrooms." },
  fusion_core:    { name: "Fusion Core",      type: "junk", value: 60,  material: true, desc: "Powers armor and generators." },
  deathclaw_hide: { name: "Deathclaw Hide",   type: "junk", value: 40,  material: true, desc: "Nearly impenetrable leather." },
  mothman_wing:   { name: "Mothman Wing",     type: "junk", value: 50,  material: true, desc: "Shimmers with an eerie light." },
  alien_alloy:    { name: "Alien Alloy",      type: "junk", value: 60,  material: true, desc: "Impossible metal. Very light." },
  teddy_bear:     { name: "Teddy Bear",       type: "junk", value: 4,   breakdown: { cloth: 2 }, desc: "Missing an eye. Breaks down into Cloth." },
  desk_fan:       { name: "Desk Fan",         type: "junk", value: 5,   breakdown: { steel: 1, circuitry: 1 }, desc: "Breaks down into Steel and Circuitry." },
  duct_tape:      { name: "Duct Tape",        type: "junk", value: 4,   breakdown: { adhesive: 2, cloth: 1 }, desc: "Breaks down into Adhesive and Cloth." },
  tin_can:        { name: "Tin Can",          type: "junk", value: 1,   breakdown: { steel: 1 }, desc: "Breaks down into Steel." },
  prewar_money:   { name: "Pre-War Money",    type: "junk", value: 10,  desc: "Worthless paper. Merchants pay for it anyway." },
  bobblehead:     { name: "Vault Boy Bobblehead", type: "junk", value: 50, desc: "A collector's item. Sells well." },
  holotape:       { name: "Pre-War Holotape", type: "junk", value: 15,  desc: "Someone's last recorded message." },

  /* ---- KEY ITEMS (can't be sold, dropped, scrapped or lost on death) ---- */
  vault_map:      { name: "The Vault-Tec Vault Map", type: "key", rarity: "Legendary", value: 1000,
                    desc: "A laminated Vault-Tec field map with every vault in the region circled in red. While you carry it, every vault appears on your Pip-Boy map." }
};

const VAULT_MAP_CHANCE = 0.01; // per enemy loot roll, scavenge, and Overseer's Office search

/* Names from saves made before the item catalog existed */
const LEGACY_ITEM_NAMES = {
  "Rusty Pistol": "rusty_pistol", "Stimpak": "stimpak", "Leather Armor": "leather_armor",
  "9mm Pistol": "pistol_9mm", "Reinforced Leather Armor": "reinforced_leather",
  "Laser Pistol": "laser_pistol", "Combat Armor": "combat_armor", "Service Rifle": "service_rifle",
  "Raider Armor": "raider_armor", "Scrap": "scrap", "Alien Alloy": "alien_alloy",
  "Deathclaw Hide": "deathclaw_hide", "Mothman Wing": "mothman_wing"
};

/* ---------------------------
   ENEMIES
   loot: [itemKey, chance, min, max]
--------------------------- */
const ENEMIES = {
  radroach:        { name: "Radroach",          hp: 8,   dmg: 2,  xp: 12,  caps: [0, 4],   loot: [["radroach_meat", .6, 1, 1]], desc: "An overgrown cockroach. Disgusting." },
  bloatfly:        { name: "Bloatfly",          hp: 8,   dmg: 3,  xp: 12,  caps: [0, 3],   loot: [["scrap", .4, 1, 1]], desc: "A bloated, larval-shooting fly." },
  bloodbug:        { name: "Bloodbug",          hp: 14,  dmg: 4,  xp: 15,  caps: [0, 3],   loot: [["bloodleaf", .4, 1, 2]], desc: "A mutated mosquito the size of a dog." },
  mole_rat:        { name: "Mole Rat",          hp: 12,  dmg: 3,  xp: 15,  caps: [0, 5],   loot: [["molerat_meat", .6, 1, 1]], desc: "Burrowing rodent with a nasty bite." },
  wasteland_dog:   { name: "Wasteland Dog",     hp: 16,  dmg: 5,  xp: 18,  caps: [0, 5],   loot: [["scrap", .3, 1, 1]], desc: "Feral, hungry and fast." },
  raider:          { name: "Raider",            hp: 20,  dmg: 6,  xp: 25,  caps: [5, 20],  loot: [["scrap", .6, 1, 3], ["pipe_pistol", .12, 1, 1], ["raider_armor", .2, 1, 1], ["jet", .12, 1, 1], ["stimpak", .25, 1, 1]], desc: "Chem-addled thug looking for an easy mark." },
  raider_psycho:   { name: "Raider Psycho",     hp: 26,  dmg: 8,  xp: 32,  caps: [8, 25],  loot: [["psycho", .3, 1, 1], ["baseball_bat", .2, 1, 1], ["scrap", .5, 1, 3]], desc: "Hopped up on Psycho and screaming." },
  powder_ganger:   { name: "Powder Ganger",     hp: 22,  dmg: 7,  xp: 26,  caps: [5, 18],  loot: [["scrap", .5, 1, 2], ["pistol_9mm", .1, 1, 1], ["vault_suit", .15, 1, 1]], desc: "Escaped convict with a fondness for dynamite." },
  fiend:           { name: "Fiend",             hp: 25,  dmg: 8,  xp: 28,  caps: [5, 20],  loot: [["jet", .3, 1, 2], ["psycho", .2, 1, 1], ["med_x", .15, 1, 1]], desc: "A chem-crazed Vegas outskirts junkie." },
  gunner:          { name: "Gunner",            hp: 32,  dmg: 9,  xp: 35,  caps: [10, 30], loot: [["pistol_10mm", .2, 1, 1], ["combat_armor", .07, 1, 1], ["stimpak", .3, 1, 1], ["steel", .4, 1, 2]], desc: "Professional mercenary. Well equipped." },
  legionary:       { name: "Caesar's Legionary",hp: 30,  dmg: 9,  xp: 32,  caps: [5, 20],  loot: [["machete", .3, 1, 1], ["cloth", .5, 1, 2]], desc: "Fanatical soldier of the Legion." },
  feral_ghoul:     { name: "Feral Ghoul",       hp: 22,  dmg: 6,  xp: 25,  caps: [0, 10],  rads: 2, loot: [["scrap", .4, 1, 2], ["prewar_money", .25, 1, 2], ["teddy_bear", .1, 1, 1]], desc: "A ghoul whose mind is long gone." },
  glowing_one:     { name: "Glowing One",       hp: 45,  dmg: 9,  xp: 50,  caps: [0, 15],  rads: 6, loot: [["nuclear", .5, 1, 2], ["glowing_fungus", .6, 1, 3]], desc: "Saturated with radiation. It glows." },
  scorched:        { name: "Scorched",          hp: 25,  dmg: 7,  xp: 28,  caps: [3, 15],  rads: 2, loot: [["scrap", .5, 1, 2], ["pipe_rifle", .1, 1, 1], ["stimpak", .2, 1, 1]], desc: "Infected by the Scorched Plague." },
  radscorpion:     { name: "Radscorpion",       hp: 40,  dmg: 10, xp: 45,  caps: [0, 8],   rads: 2, loot: [["adhesive", .3, 1, 2]], desc: "Giant venomous scorpion." },
  cazador:         { name: "Cazador",           hp: 30,  dmg: 11, xp: 40,  caps: [0, 5],   loot: [["adhesive", .3, 1, 1]], desc: "Mutated tarantula hawk. Fast and deadly." },
  nightstalker:    { name: "Nightstalker",      hp: 32,  dmg: 9,  xp: 38,  caps: [0, 6],   loot: [["bloodleaf", .3, 1, 2]], desc: "Coyote-rattlesnake hybrid." },
  mirelurk:        { name: "Mirelurk",          hp: 35,  dmg: 8,  xp: 38,  caps: [0, 6],   loot: [["mirelurk_meat", .7, 1, 2]], desc: "Armored crab-like mutant." },
  gulper:          { name: "Gulper",            hp: 45,  dmg: 11, xp: 48,  caps: [0, 15],  rads: 2, loot: [["prewar_money", .3, 1, 3], ["holotape", .15, 1, 1]], desc: "Swallows wanderers whole." },
  yao_guai:        { name: "Yao Guai",          hp: 60,  dmg: 14, xp: 60,  caps: [0, 10],  loot: [["cloth", .5, 1, 3]], desc: "A massive mutated bear." },
  super_mutant:    { name: "Super Mutant",      hp: 45,  dmg: 10, xp: 45,  caps: [5, 25],  loot: [["steel", .5, 1, 3], ["hunting_rifle", .1, 1, 1], ["stimpak", .3, 1, 1], ["metal_armor", .07, 1, 1]], desc: "Hulking green FEV mutant." },
  protectron:      { name: "Protectron",        hp: 30,  dmg: 6,  xp: 30,  caps: [0, 10],  loot: [["circuitry", .6, 1, 2], ["steel", .5, 1, 2]], desc: "Slow pre-war security robot." },
  mr_gutsy:        { name: "Mr. Gutsy",         hp: 40,  dmg: 10, xp: 45,  caps: [5, 20],  loot: [["circuitry", .6, 1, 2], ["nuclear", .2, 1, 1], ["desk_fan", .2, 1, 1]], desc: "Military robot with a flamer and a mouth." },
  assaultron:      { name: "Assaultron",        hp: 55,  dmg: 14, xp: 60,  caps: [5, 25],  loot: [["circuitry", .7, 2, 3], ["fusion_core", .2, 1, 1]], desc: "Fast robot with a head laser." },
  synth:           { name: "Gen-2 Synth",       hp: 40,  dmg: 10, xp: 45,  caps: [0, 15],  loot: [["circuitry", .5, 1, 2], ["laser_rifle", .08, 1, 1], ["synth_armor", .08, 1, 1]], desc: "An Institute android." },
  enclave_soldier: { name: "Enclave Soldier",   hp: 70,  dmg: 15, xp: 80,  caps: [20, 50], loot: [["plasma_rifle", .1, 1, 1], ["fusion_core", .3, 1, 1], ["stimpak", .4, 1, 2]], desc: "Power-armored remnant of the US government." },
  wendigo:         { name: "Wendigo",           hp: 50,  dmg: 13, xp: 55,  caps: [0, 10],  loot: [["bloodleaf", .4, 1, 2]], desc: "Emaciated, shrieking cryptid." },
  snallygaster:    { name: "Snallygaster",      hp: 60,  dmg: 12, xp: 60,  caps: [0, 10],  rads: 4, loot: [["glowing_fungus", .5, 1, 2], ["nuclear", .25, 1, 1]], desc: "Slimy, one-eyed abomination." },
  flatwoods:       { name: "Flatwoods Monster", hp: 70,  dmg: 12, xp: 70,  caps: [0, 20],  rads: 5, loot: [["alien_alloy", .3, 1, 1], ["nuclear", .3, 1, 1]], desc: "A glowing figure in a hooded shroud." },
  grafton_monster: { name: "Grafton Monster",   hp: 100, dmg: 14, xp: 90,  caps: [10, 30], loot: [["cloth", .5, 2, 4], ["adhesive", .4, 1, 2]], desc: "Headless, towering and very angry." },
  alien:           { name: "Alien Invader",     hp: 30,  dmg: 8,  xp: 50,  caps: [0, 20],  loot: [["alien_alloy", .7, 1, 1], ["stimpak", .5, 1, 1], ["alien_blaster", .04, 1, 1]], desc: "A visitor from beyond the stars." },
  /* Legacy names so old saves/encounters still resolve */
  mutant:          { name: "Mutant",            hp: 35,  dmg: 10, xp: 40,  caps: [5, 20],  loot: [["steel", .4, 1, 2], ["stimpak", .3, 1, 1]], desc: "A twisted thing, barely human." },
  deathclaw_cub:   { name: "Deathclaw Cub",     hp: 35,  dmg: 10, xp: 45,  caps: [0, 10],  loot: [["deathclaw_meat", .4, 1, 1]], desc: "Small, but already lethal." },
  /* ---- BOSSES ---- */
  deathclaw:       { name: "Deathclaw",         hp: 250, dmg: 18, xp: 250, caps: [60, 120], boss: true, loot: [["deathclaw_hide", 1, 1, 1], ["deathclaw_meat", .8, 1, 2]], desc: "Apex predator of the wasteland. Run." },
  mothman:         { name: "Mothman",           hp: 250, dmg: 14, xp: 250, caps: [60, 120], boss: true, loot: [["mothman_wing", 1, 1, 1], ["bobblehead", .3, 1, 1]], desc: "Its eyes glow in the dark. Watching." },
  sentry_bot:      { name: "Sentry Bot",        hp: 160, dmg: 18, xp: 180, caps: [30, 80], boss: true, loot: [["fusion_core", .6, 1, 2], ["circuitry", 1, 3, 5], ["minigun", .15, 1, 1]], desc: "A walking tank with miniguns and missiles." },
  behemoth:        { name: "Super Mutant Behemoth", hp: 300, dmg: 22, xp: 300, caps: [50, 120], boss: true, loot: [["steel", 1, 4, 8], ["super_sledge", .25, 1, 1]], desc: "Three stories of muscle with a fire hydrant club." },
  scorchbeast:     { name: "Scorchbeast",       hp: 280, dmg: 20, xp: 300, caps: [60, 140], boss: true, rads: 6, loot: [["nuclear", 1, 2, 4], ["gauss_rifle", .15, 1, 1], ["alien_alloy", .2, 1, 1]], desc: "A colossal irradiated bat. Its scream melts stone." },
  mirelurk_queen:  { name: "Mirelurk Queen",    hp: 260, dmg: 19, xp: 260, caps: [40, 100], boss: true, rads: 3, loot: [["mirelurk_meat", 1, 3, 5], ["marine_armor", .2, 1, 1]], desc: "A house-sized armored horror." }
};

/* ---------------------------
   ALLIES
   perk: medic | scavenger | sniper | tank | charm
--------------------------- */
const ALLY_PERKS = {
  medic:     "MEDIC — heals you 2 HP each combat round",
  scavenger: "SCAVENGER — +1 find when scavenging",
  sniper:    "SHARPSHOOTER — +5% critical chance",
  tank:      "BODYGUARD — draws enemy attacks, takes half damage",
  charm:     "SILVER TONGUE — 10% better vendor prices"
};

const ALLIES = {
  settler:              { name: "Settler",              cost: 20,  damage: 2,  hp: 15, rarity: "Common",    boost: 0, desc: "Just wants a safe place to live." },
  minuteman:            { name: "Minuteman",            cost: 25,  damage: 3,  hp: 18, rarity: "Common",    boost: 0, desc: "Ready at a minute's notice." },
  vault_dweller:        { name: "Vault Dweller",        cost: 30,  damage: 4,  hp: 20, rarity: "Uncommon",  boost: 1, desc: "Fresh out of the vault and eager." },
  ncr_trooper:          { name: "NCR Trooper",          cost: 60,  damage: 7,  hp: 30, rarity: "Rare",      boost: 2, desc: "Disciplined Republic soldier." },
  power_armor_soldier:  { name: "Power Armor Soldier",  cost: 100, damage: 10, hp: 40, rarity: "Rare",      boost: 2, perk: "tank", desc: "Walking fortress in T-45." },
  brotherhood_paladin:  { name: "Brotherhood Paladin",  cost: 120, damage: 11, hp: 44, rarity: "Rare",      boost: 2, perk: "tank", desc: "Ad Victoriam." },
  the_ghoul:            { name: "The Ghoul",            cost: 50,  damage: 6,  hp: 25, rarity: "Legendary", boost: 3, unique: true, perk: "sniper", desc: "200 years of grudges and a revolver." },
  lucy:                 { name: "Lucy MacLean",         cost: 75,  damage: 8,  hp: 30, rarity: "Legendary", boost: 3, unique: true, perk: "charm", desc: "Okey-dokey! Vault 33's finest." },
  maximus:              { name: "Maximus",              cost: 95,  damage: 10, hp: 40, rarity: "Rare",      boost: 2, unique: true, perk: "tank", desc: "Brotherhood squire with something to prove." },
  dogmeat:              { name: "Dogmeat",              cost: 40,  damage: 6,  hp: 22, rarity: "Uncommon",  boost: 1, unique: true, perk: "scavenger", desc: "Good boy. Finds things." },
  codsworth:            { name: "Codsworth",            cost: 45,  damage: 5,  hp: 30, rarity: "Uncommon",  boost: 1, unique: true, perk: "medic", desc: "Mister Handy butler. Ever so loyal." },
  preston:              { name: "Preston Garvey",       cost: 70,  damage: 7,  hp: 32, rarity: "Rare",      boost: 2, unique: true, perk: "charm", desc: "Another settlement needs your help." },
  piper:                { name: "Piper Wright",         cost: 50,  damage: 6,  hp: 24, rarity: "Uncommon",  boost: 1, unique: true, perk: "charm", desc: "Reporter for Publick Occurrences." },
  nick:                 { name: "Nick Valentine",       cost: 80,  damage: 8,  hp: 34, rarity: "Rare",      boost: 2, unique: true, perk: "scavenger", desc: "Synth detective with a heart of gold." },
  cait:                 { name: "Cait",                 cost: 55,  damage: 8,  hp: 24, rarity: "Uncommon",  boost: 1, unique: true, perk: "sniper", desc: "Irish brawler from the Combat Zone." },
  danse:                { name: "Paladin Danse",        cost: 150, damage: 12, hp: 50, rarity: "Legendary", boost: 3, unique: true, perk: "tank", desc: "Brotherhood Paladin. Duty above all." },
  strong:               { name: "Strong",               cost: 110, damage: 11, hp: 48, rarity: "Rare",      boost: 2, unique: true, perk: "tank", desc: "Super mutant seeking the milk of human kindness." },
  boone:                { name: "Craig Boone",          cost: 90,  damage: 11, hp: 28, rarity: "Rare",      boost: 2, unique: true, perk: "sniper", desc: "Ex-NCR sniper. Doesn't talk much." },
  ed_e:                 { name: "ED-E",                 cost: 50,  damage: 6,  hp: 26, rarity: "Uncommon",  boost: 1, unique: true, perk: "scavenger", desc: "Eyebot with a mysterious past." },
  veronica:             { name: "Veronica Santangelo",  cost: 85,  damage: 10, hp: 30, rarity: "Rare",      boost: 2, unique: true, perk: "medic", desc: "Brotherhood scribe with a power fist." },
  arcade:               { name: "Arcade Gannon",        cost: 60,  damage: 7,  hp: 26, rarity: "Uncommon",  boost: 1, unique: true, perk: "medic", desc: "Followers of the Apocalypse doctor." },
  raul:                 { name: "Raul Tejada",          cost: 75,  damage: 8,  hp: 30, rarity: "Rare",      boost: 2, unique: true, perk: "scavenger", desc: "Ghoul vaquero and master mechanic." },
  cass:                 { name: "Rose of Sharon Cassidy", cost: 55, damage: 8, hp: 26, rarity: "Uncommon",  boost: 1, unique: true, perk: "sniper", desc: "Hard-drinking caravaneer." },
  charon:               { name: "Charon",               cost: 90,  damage: 10, hp: 34, rarity: "Rare",      boost: 2, unique: true, perk: "tank", desc: "Ghoul bodyguard. Bound by contract." }
};

/* Generic allies that may wander into a C.A.M.P. with a Recruitment Beacon */
const WANDERER_POOL = ["settler", "minuteman", "vault_dweller", "ncr_trooper", "power_armor_soldier", "brotherhood_paladin"];

/* ---------------------------
   EVENTS (triggered on arrival)
--------------------------- */
const EVENTS = {
  caps_rain:          { name: "Caps Rain",             type: "caps",   min: 10, max: 40, text: "Bottle caps rain down from a busted casino sign!" },
  high_roller:        { name: "High Roller Night",     type: "gamble", text: "A dealer invites you to one hand of Caravan." },
  invaders:           { name: "Invaders From Beyond",  type: "spawn",  enemy: "alien", text: "A craft streaks across the sky. Aliens!" },
  ash_storm:          { name: "Ash Storm",             type: "storm",  dmg: [3, 8], rads: 3, text: "Burning ash fills the air." },
  mutant_raid:        { name: "Super Mutant Raid",     type: "spawn",  enemy: "super_mutant", text: "Super mutants charge out of the smoke!" },
  vault_distress:     { name: "Vault Distress Signal", type: "cache",  loot: [["stimpak", 1, 2], ["scrap", 2, 4], ["vault_suit", 1, 1]], text: "You follow a distress beacon to an abandoned supply cache." },
  caravan_ambush:     { name: "Caravan Ambush",        type: "spawn",  enemy: "raider", text: "Raiders hit a caravan. They spot you too." },
  raider_roadblock:   { name: "Raider Roadblock",      type: "spawn",  enemy: "raider_psycho", text: "A raider blocks the road demanding a toll." },
  ncr_patrol:         { name: "NCR Patrol",            type: "gift",   loot: [["stimpak", 1, 1]], text: "An NCR patrol shares some supplies." },
  bos_patrol:         { name: "Brotherhood Patrol",    type: "heal",   text: "A Brotherhood medic patches you up." },
  vault_drill:        { name: "Vault Emergency Drill", type: "xp",     amount: 20, text: "You run the drill like a pro. Overseer approves." },
  radstorm:           { name: "Radstorm",              type: "rads",   amount: 12, text: "Green lightning cracks overhead. Rads spike." },
  pitt_uprising:      { name: "Slave Uprising",        type: "reward", caps: 30, xp: 30, text: "You help workers break their chains. They pay you back." },
  trader_caravan:     { name: "Trader Caravan",        type: "sale",   text: "A caravan arrives. Prices drop 20%." },
  scorched_ambush:    { name: "Scorched Ambush",       type: "spawn",  enemy: "scorched", text: "The Scorched shamble out of a burned house." },
  mothman_sighting:   { name: "Mothman Sighting",      type: "spawn",  enemy: "mothman", text: "Wings beat overhead. The Mothman descends." },
  deathclaw_hunt:     { name: "Deathclaw Nest",        type: "spawn",  enemy: "deathclaw", text: "You stumbled into a nest. Something big wakes up." },
  supply_drop:        { name: "Vertibird Supply Drop", type: "cache",  loot: [["stimpak", 1, 2], ["radaway", 1, 1], ["fusion_core", 0, 1]], text: "A vertibird drops a crate nearby." },
  mysterious_stranger:{ name: "Mysterious Stranger",   type: "caps",   min: 25, max: 50, text: "A man in a trench coat tips his hat and leaves you caps." },
  feral_horde:        { name: "Feral Horde",           type: "spawn",  enemy: "glowing_one", text: "A pack of ferals pours out, led by a Glowing One." },
  sentry_patrol:      { name: "Sentry Bot Patrol",     type: "spawn",  enemy: "sentry_bot", text: "A sentry bot stomps around the corner. TARGET ACQUIRED." },
  behemoth_roar:      { name: "Behemoth Roar",         type: "spawn",  enemy: "behemoth", text: "The ground shakes. A Behemoth approaches." },
  scorchbeast_attack: { name: "Scorchbeast Attack",    type: "spawn",  enemy: "scorchbeast", text: "An ear-splitting shriek. A Scorchbeast dives!" },
  queen_emerges:      { name: "Mirelurk Queen",        type: "spawn",  enemy: "mirelurk_queen", text: "The water churns. A Mirelurk Queen rises." },
  bobblehead_find:    { name: "Lucky Find",            type: "gift",   loot: [["bobblehead", 1, 1]], text: "A Vault Boy bobblehead grins at you from a shelf." }
};

/* ---------------------------
   LOCATIONS / POIs
   x,y = map position (%), rads = rads on arrival,
   vendor = item keys sold, ally = recruitable ally key,
   events = event keys, nocamp = can't deploy C.A.M.P.
--------------------------- */
const REGIONS = [
  "West Virginia", "Pennsylvania", "Ohio", "Maryland", "Capital Wasteland",
  "Massachusetts", "Nevada", "California"
];

const LOCATIONS = [
  /* ---- WEST VIRGINIA (APPALACHIA) ---- */
  { id: "vault", name: "Vault Ruins", region: "West Virginia", danger: "Low", x: 48, y: 30, ally: "vault_dweller", events: ["vault_distress"],
    enemies: ["radroach", "mole_rat", "bloatfly"], desc: "The collapsed entrance of a forgotten vault. Home, once." },
  { id: "vault_76", name: "Vault 76", region: "West Virginia", danger: "Low", x: 40, y: 22, nocamp: true, events: ["vault_drill"],
    enemies: ["radroach", "mole_rat"], vendor: ["stimpak", "purified_water", "vault_suit", "pistol_10mm", "nuka_cola"], desc: "Reclamation Day has come and gone. The vault door still hums." },
  { id: "flatwoods", name: "Flatwoods", region: "West Virginia", danger: "Low", x: 55, y: 45, events: ["scorched_ambush", "bobblehead_find"],
    enemies: ["scorched", "radroach", "mole_rat", "bloatfly"], vendor: ["stimpak", "radaway", "cram", "pipe_rifle", "leather_armor"], desc: "A quiet town the Responders once called home." },
  { id: "highway", name: "Highway Town", region: "West Virginia", danger: "Medium", x: 30, y: 55, ally: "the_ghoul", events: ["caravan_ambush", "raider_roadblock"],
    enemies: ["raider", "wasteland_dog", "feral_ghoul"], vendor: ["pistol_9mm", "stimpak", "scrap", "jet"], desc: "A ramshackle stop along the old interstate." },
  { id: "charleston", name: "Charleston Ruins", region: "West Virginia", danger: "Medium", x: 22, y: 68, events: ["scorched_ambush", "supply_drop"],
    enemies: ["feral_ghoul", "scorched", "raider", "protectron"], desc: "The flooded capitol. Empty offices and full graves." },
  { id: "point_pleasant", name: "Point Pleasant", region: "West Virginia", danger: "Medium", x: 10, y: 50, events: ["mothman_sighting", "bobblehead_find"],
    enemies: ["scorched", "wendigo", "bloodbug"], vendor: ["mothman_wing", "stimpak", "fancy_lads", "mentats"], desc: "Home of the Mothman Museum. The cultists are friendly. Mostly." },
  { id: "whitespring", name: "The Whitespring Resort", region: "West Virginia", danger: "Medium", x: 72, y: 72, nocamp: true, events: ["feral_horde"],
    enemies: ["feral_ghoul", "glowing_one", "mr_gutsy"], vendor: ["combat_armor", "laser_rifle", "super_stimpak", "nuka_quantum", "radaway"], desc: "Luxury golf resort guarded by robots. The ghouls never left." },
  { id: "watoga", name: "Watoga", region: "West Virginia", danger: "High", x: 68, y: 88, events: ["sentry_patrol"],
    enemies: ["protectron", "assaultron", "mr_gutsy"], desc: "The city of the future, run by robots that never got the memo." },
  { id: "burning", name: "Burning Springs", region: "West Virginia", danger: "High", x: 18, y: 85, ally: "power_armor_soldier", events: ["ash_storm", "mutant_raid"],
    enemies: ["super_mutant", "raider_psycho", "scorched"], vendor: ["combat_shotgun", "metal_armor", "psycho", "buffout", "stimpak"], desc: "Burning mine fires and the Rust King's bazaar." },
  { id: "cranberry_bog", name: "Cranberry Bog", region: "West Virginia", danger: "High", x: 86, y: 60, rads: 4, events: ["scorchbeast_attack", "radstorm"],
    enemies: ["snallygaster", "glowing_one", "scorched", "flatwoods"], desc: "Ancient bog, strange glowing flora and the Scorchbeasts' hunting ground." },
  { id: "grafton", name: "Grafton Dam", region: "West Virginia", danger: "Medium", x: 62, y: 18, events: ["mutant_raid"],
    enemies: ["grafton_monster", "super_mutant", "mole_rat"], desc: "A crumbling dam and a monster with no head." },

  /* ---- PENNSYLVANIA ---- */
  { id: "pitt", name: "The Pitt Outskirts", region: "Pennsylvania", danger: "High", x: 30, y: 45, rads: 3, events: ["pitt_uprising", "radstorm"],
    enemies: ["raider_psycho", "glowing_one", "super_mutant"], desc: "Toxic rivers and smokestacks. Freedom is a rumor here." },
  { id: "coal", name: "Coal Ridge Mine", region: "Pennsylvania", danger: "Medium", x: 60, y: 65,
    enemies: ["mole_rat", "radscorpion", "feral_ghoul"], desc: "Collapsed shafts and something burrowing below." },
  { id: "steelyard", name: "The Steelyard", region: "Pennsylvania", danger: "High", x: 45, y: 25, rads: 5,
    enemies: ["glowing_one", "raider_psycho", "feral_ghoul"], desc: "Slag piles and irradiated ingots. Great for steel scavenging." },
  { id: "haven", name: "Haven Settlement", region: "Pennsylvania", danger: "Low", x: 72, y: 38, ally: "minuteman",
    enemies: ["radroach", "bloatfly"], vendor: ["stimpak", "steel", "adhesive", "hunting_rifle", "reinforced_leather"], desc: "A fortified farm commune welcoming travelers." },

  /* ---- OHIO ---- */
  { id: "toledo", name: "Toledo Wastes", region: "Ohio", danger: "Medium", x: 30, y: 30, events: ["radstorm"],
    enemies: ["raider", "wasteland_dog", "radscorpion"], desc: "Dust and broken highways as far as the eye can see." },
  { id: "vault_19", name: "Vault 19", region: "Ohio", danger: "Low", x: 60, y: 60, events: ["vault_drill"],
    enemies: ["radroach", "mole_rat"], desc: "Red vs. Blue — the old vault wars left their mark." },
  { id: "cuyahoga", name: "Cuyahoga River Bend", region: "Ohio", danger: "Medium", x: 75, y: 25,
    enemies: ["mirelurk", "bloatfly", "gulper"], desc: "The river that once caught fire. It still glows a little." },

  /* ---- MARYLAND ---- */
  { id: "dc", name: "Ruins of DC", region: "Maryland", danger: "High", x: 30, y: 60, events: ["bos_patrol"],
    enemies: ["super_mutant", "feral_ghoul", "mutant"], desc: "Shattered monuments and super mutant strongholds." },
  { id: "lucy_crossing", name: "Lucy’s Crossing", region: "Maryland", danger: "Low", x: 65, y: 35, events: ["trader_caravan"],
    enemies: ["radroach", "mole_rat"], vendor: ["reinforced_leather", "stimpak", "purified_water", "iguana_stick"], desc: "A friendly river crossing with a well-stocked trader." },
  { id: "annapolis", name: "Annapolis Harbor", region: "Maryland", danger: "Medium", x: 80, y: 70, events: ["queen_emerges"],
    enemies: ["mirelurk", "gunner"], desc: "A drowned naval town. Mirelurks nest in the hulls." },

  /* ---- CAPITAL WASTELAND ---- */
  { id: "vault_101", name: "Vault 101", region: "Capital Wasteland", danger: "Low", x: 22, y: 38, nocamp: true, events: ["vault_drill"],
    enemies: ["radroach"], desc: "Nobody ever enters. Nobody ever leaves." },
  { id: "megaton", name: "Megaton", region: "Capital Wasteland", danger: "Low", x: 32, y: 52, nocamp: true,
    enemies: ["radroach", "mole_rat"], vendor: ["stimpak", "radaway", "rad_x", "pistol_10mm", "leather_armor", "nuka_cola"], desc: "A town built around an undetonated atomic bomb." },
  { id: "underworld", name: "Underworld", region: "Capital Wasteland", danger: "Medium", x: 55, y: 48, ally: "charon",
    enemies: ["feral_ghoul", "super_mutant"], vendor: ["radaway", "med_x", "combat_shotgun", "metal_armor"], desc: "A ghoul haven inside a museum." },
  { id: "rivet_city", name: "Rivet City", region: "Capital Wasteland", danger: "Low", x: 72, y: 70, nocamp: true,
    enemies: ["mirelurk"], vendor: ["laser_pistol", "combat_armor", "super_stimpak", "mentats"], desc: "A beached aircraft carrier turned city." },
  { id: "gnr", name: "Galaxy News Radio Plaza", region: "Capital Wasteland", danger: "High", x: 62, y: 25, events: ["behemoth_roar", "bos_patrol"],
    enemies: ["super_mutant", "raider_psycho"], desc: "Three Dog's broadcast fortress, under siege." },
  { id: "citadel", name: "The Citadel", region: "Capital Wasteland", danger: "Medium", x: 45, y: 75, nocamp: true, ally: "brotherhood_paladin", events: ["bos_patrol"],
    enemies: ["super_mutant", "feral_ghoul"], vendor: ["laser_rifle", "t45", "fusion_core", "stimpak"], desc: "The Brotherhood of Steel's fortress in the Pentagon ruins." },

  /* ---- MASSACHUSETTS (COMMONWEALTH) ---- */
  { id: "sanctuary", name: "Sanctuary Hills", region: "Massachusetts", danger: "Low", x: 15, y: 18, ally: "codsworth",
    enemies: ["radroach", "bloatfly", "mole_rat"], desc: "Suburban cul-de-sac. Perfect for a C.A.M.P." },
  { id: "vault_111", name: "Vault 111", region: "Massachusetts", danger: "Low", x: 10, y: 30, nocamp: true, events: ["vault_drill"],
    enemies: ["radroach"], desc: "A cryogenic vault. The pods are cold now." },
  { id: "concord", name: "Concord", region: "Massachusetts", danger: "Medium", x: 25, y: 32, ally: "preston", events: ["deathclaw_hunt", "caravan_ambush"],
    enemies: ["raider", "raider_psycho", "bloodbug"], desc: "Raiders have the Museum of Freedom surrounded." },
  { id: "red_rocket", name: "Red Rocket Truck Stop", region: "Massachusetts", danger: "Low", x: 20, y: 24, ally: "dogmeat",
    enemies: ["mole_rat", "wasteland_dog"], desc: "A dog waits by the rocket sign." },
  { id: "corvega", name: "Corvega Assembly Plant", region: "Massachusetts", danger: "Medium", x: 38, y: 48,
    enemies: ["raider", "raider_psycho", "gunner"], desc: "A raider fortress built from a car factory." },
  { id: "cambridge", name: "Cambridge Police Station", region: "Massachusetts", danger: "Medium", x: 55, y: 50, ally: "danse", events: ["feral_horde"],
    enemies: ["feral_ghoul", "synth"], desc: "Brotherhood recon team pinned down by ferals." },
  { id: "diamond_city", name: "Diamond City", region: "Massachusetts", danger: "Low", x: 60, y: 65, nocamp: true, ally: "piper",
    enemies: ["radroach"], vendor: ["stimpak", "super_stimpak", "pistol_10mm", "combat_shotgun", "synth_armor", "fancy_lads", "radaway"], desc: "The Great Green Jewel of the Commonwealth." },
  { id: "goodneighbor", name: "Goodneighbor", region: "Massachusetts", danger: "Medium", x: 72, y: 58, ally: "nick",
    enemies: ["raider", "feral_ghoul"], vendor: ["jet", "psycho", "buffout", "med_x", "ripper", "power_fist"], desc: "Of the people, for the people." },
  { id: "combat_zone", name: "The Combat Zone", region: "Massachusetts", danger: "Medium", x: 78, y: 45, ally: "cait",
    enemies: ["raider", "raider_psycho"], desc: "A theater turned fighting pit." },
  { id: "trinity", name: "Trinity Tower", region: "Massachusetts", danger: "High", x: 68, y: 75, ally: "strong", events: ["behemoth_roar"],
    enemies: ["super_mutant", "mutant"], desc: "Super mutants hold a skyscraper and a couple of prisoners." },
  { id: "glowing_sea", name: "The Glowing Sea", region: "Massachusetts", danger: "High", x: 35, y: 88, rads: 10, events: ["deathclaw_hunt", "radstorm"],
    enemies: ["glowing_one", "radscorpion", "deathclaw_cub"], desc: "Ground zero. The air itself is poison." },

  /* ---- NEVADA (MOJAVE) ---- */
  { id: "goodsprings", name: "Goodsprings", region: "Nevada", danger: "Low", x: 20, y: 70,
    enemies: ["radroach", "bloatfly", "powder_ganger"], vendor: ["stimpak", "pistol_9mm", "leather_armor", "iguana_stick", "dirty_water"], desc: "Where you got shot in the head and lived." },
  { id: "primm", name: "Primm", region: "Nevada", danger: "Medium", x: 25, y: 85, ally: "ed_e", events: ["raider_roadblock"],
    enemies: ["powder_ganger", "nightstalker"], desc: "A small town with a broken rollercoaster." },
  { id: "mojave_outpost", name: "Mojave Outpost", region: "Nevada", danger: "Low", x: 12, y: 92, ally: "cass",
    enemies: ["radroach", "cazador"], vendor: ["service_rifle", "stimpak", "purified_water", "ncr_ranger"], desc: "The NCR's gateway to the Mojave." },
  { id: "novac", name: "Novac", region: "Nevada", danger: "Low", x: 50, y: 78, ally: "boone",
    enemies: ["nightstalker", "wasteland_dog"], vendor: ["hunting_rifle", "stimpak", "radaway", "nuka_cola"], desc: "Look for the dinosaur." },
  { id: "quarry", name: "Quarry Junction", region: "Nevada", danger: "High", x: 35, y: 55, events: ["deathclaw_hunt"],
    enemies: ["deathclaw_cub", "nightstalker"], desc: "The road north is blocked. You know why." },
  { id: "black_mountain", name: "Black Mountain", region: "Nevada", danger: "High", x: 55, y: 55, ally: "raul",
    enemies: ["super_mutant", "nightstalker"], desc: "Tabitha broadcasts from the summit." },
  { id: "freeside", name: "Freeside", region: "Nevada", danger: "Medium", x: 50, y: 30, ally: "arcade", events: ["mysterious_stranger"],
    enemies: ["fiend", "raider"], vendor: ["machete", "jet", "med_x", "stimpak", "metal_armor"], desc: "The rough shell around the Strip." },
  { id: "vegas", name: "New Vegas Strip", region: "Nevada", danger: "High", x: 55, y: 22, nocamp: true, ally: "settler",
    events: ["caps_rain", "high_roller", "invaders"], enemies: ["fiend", "legionary", "gunner"],
    vendor: ["laser_pistol", "stimpak", "combat_armor", "plasma_rifle", "nuka_quantum"], desc: "Neon, gambling, and Mr. House's watchful eye." },
  { id: "station_188", name: "188 Trading Post", region: "Nevada", danger: "Low", x: 68, y: 45, ally: "veronica", events: ["trader_caravan"],
    enemies: ["cazador", "radroach"], vendor: ["stimpak", "lever_action", "reinforced_leather", "adhesive", "circuitry"], desc: "A crossroads market under the highway." },
  { id: "hoover_dam", name: "Hoover Dam", region: "Nevada", danger: "High", x: 88, y: 50,
    enemies: ["legionary", "cazador", "enclave_soldier"], desc: "The prize everyone in the Mojave wants." },

  /* ---- CALIFORNIA ---- */
  { id: "vault_33", name: "Vault 33", region: "California", danger: "Low", x: 30, y: 78, ally: "lucy", events: ["vault_drill"],
    enemies: ["radroach", "mole_rat"], desc: "Okey-dokey! A cheerful vault under the Pacific coast." },
  { id: "santa_monica", name: "Santa Monica Pier", region: "California", danger: "Medium", x: 15, y: 65,
    enemies: ["raider", "mirelurk", "gulper"], desc: "The rides are rusted, but the view is still nice." },
  { id: "filly", name: "Filly", region: "California", danger: "Low", x: 45, y: 62, nocamp: true, ally: "maximus",
    enemies: ["radroach", "bloatfly"], vendor: ["stimpak", "super_stimpak", "hunting_rifle", "combat_armor", "cram", "radaway"], desc: "A trade town of corrugated steel and questionable deals." },
  { id: "vault_4", name: "Vault 4", region: "California", danger: "Medium", x: 55, y: 78,
    enemies: ["gulper", "mole_rat", "radroach"], desc: "Scientific vault. Its residents are... different." },
  { id: "griffith", name: "Griffith Observatory", region: "California", danger: "High", x: 50, y: 40, events: ["sentry_patrol"],
    enemies: ["mr_gutsy", "assaultron", "enclave_soldier"], desc: "Secrets hidden beneath the domes." },
  { id: "shady_sands", name: "Shady Sands Crater", region: "California", danger: "High", x: 75, y: 25, rads: 6, events: ["radstorm", "feral_horde"],
    enemies: ["glowing_one", "feral_ghoul", "radscorpion"], desc: "What's left of the NCR's capital." },
  { id: "ncr", name: "NCR Stronghold", region: "California", danger: "Medium", x: 70, y: 55, ally: "ncr_trooper", events: ["ncr_patrol"],
    enemies: ["raider", "radscorpion", "gunner"], vendor: ["service_rifle", "scrap", "stimpak", "ncr_ranger", "purified_water"], desc: "A fortified Republic outpost." },
  { id: "boneyard", name: "The Boneyard", region: "California", danger: "Medium", x: 35, y: 45,
    enemies: ["raider", "feral_ghoul", "protectron"], desc: "The ruins of Los Angeles." }
];

/* ---- MORE SURFACE POIs ---- */
LOCATIONS.push(
  /* West Virginia */
  { id: "morgantown", name: "Morgantown Airport", region: "West Virginia", danger: "Medium", x: 80, y: 15, events: ["supply_drop", "scorched_ambush"],
    enemies: ["scorched", "mr_gutsy", "protectron"], desc: "Responders once ran relief flights from this terminal." },
  { id: "helvetia", name: "Helvetia", region: "West Virginia", danger: "Low", x: 40, y: 80, ally: "minuteman",
    enemies: ["radroach", "mole_rat", "bloatfly"], vendor: ["cram", "purified_water", "stimpak", "baseball_bat", "cloth"], desc: "A little Swiss mountain village with a big taste for festivals." },
  { id: "top_of_world", name: "Top of the World", region: "West Virginia", danger: "Low", x: 88, y: 38, nocamp: true,
    enemies: ["bloatfly", "radroach"], vendor: ["nuka_cola", "fancy_lads", "hunting_rifle", "reinforced_leather", "radaway"], desc: "A ski resort at the summit. The chairlift still creaks." },
  { id: "sugar_grove", name: "Sugar Grove", region: "West Virginia", danger: "High", x: 92, y: 82, events: ["sentry_patrol"],
    enemies: ["assaultron", "mr_gutsy", "protectron"], desc: "A listening post buried in the hills, guarded by robots that never stood down." },

  /* Pennsylvania */
  { id: "uptown", name: "Pittsburgh Uptown", region: "Pennsylvania", danger: "High", x: 22, y: 25, rads: 3, events: ["feral_horde"],
    enemies: ["feral_ghoul", "glowing_one", "raider_psycho"], desc: "Collapsed towers over choked streets." },
  { id: "erie", name: "Erie Lakeshore", region: "Pennsylvania", danger: "Medium", x: 80, y: 15, events: ["queen_emerges"],
    enemies: ["mirelurk", "bloatfly", "gulper"], desc: "Grey surf and the rusting hulls of lake freighters." },
  { id: "allegheny", name: "Allegheny Woods", region: "Pennsylvania", danger: "Medium", x: 40, y: 80,
    enemies: ["yao_guai", "wasteland_dog", "bloodbug"], desc: "Thick, quiet forest. Too quiet." },

  /* Ohio */
  { id: "columbus", name: "Columbus Ruins", region: "Ohio", danger: "High", x: 50, y: 45, events: ["mutant_raid"],
    enemies: ["super_mutant", "gunner", "feral_ghoul"], desc: "The capital's dome is cracked open like an egg." },
  { id: "cincinnati", name: "Cincinnati Outpost", region: "Ohio", danger: "Low", x: 25, y: 80, events: ["trader_caravan"],
    enemies: ["radroach", "mole_rat"], vendor: ["stimpak", "pistol_10mm", "leather_armor", "brahmin_meat", "steel"], desc: "A riverboat trading post lashed to the bank." },

  /* Maryland */
  { id: "baltimore", name: "Baltimore Docks", region: "Maryland", danger: "High", x: 55, y: 20,
    enemies: ["mirelurk", "gunner", "raider_psycho"], desc: "Container stacks, cranes, and gunfire at night." },
  { id: "frederick", name: "Frederick Farms", region: "Maryland", danger: "Low", x: 15, y: 25, ally: "settler",
    enemies: ["mole_rat", "bloatfly"], vendor: ["tato", "mutfruit", "brahmin_meat", "purified_water", "wood"], desc: "Brahmin pens and rows of tatos." },

  /* Capital Wasteland */
  { id: "tenpenny", name: "Tenpenny Tower", region: "Capital Wasteland", danger: "Low", x: 12, y: 55, nocamp: true,
    enemies: ["radroach"], vendor: ["combat_armor", "laser_rifle", "super_stimpak", "mentats", "nuka_quantum"], desc: "A luxury high-rise for those who can afford to look down on everyone." },
  { id: "paradise_falls", name: "Paradise Falls", region: "Capital Wasteland", danger: "High", x: 40, y: 15,
    enemies: ["raider", "raider_psycho", "gunner"], desc: "A fortified slaver camp in an old shopping mall." },
  { id: "arlington", name: "Arlington Cemetery", region: "Capital Wasteland", danger: "Medium", x: 82, y: 48, events: ["feral_horde"],
    enemies: ["feral_ghoul", "glowing_one"], desc: "Rows of white stones and things that don't stay buried." },

  /* Massachusetts */
  { id: "lexington", name: "Lexington", region: "Massachusetts", danger: "Medium", x: 40, y: 30, events: ["feral_horde"],
    enemies: ["feral_ghoul", "raider", "protectron"], desc: "A ghoul-infested town around a supermarket and a factory." },
  { id: "bunker_hill", name: "Bunker Hill", region: "Massachusetts", danger: "Low", x: 65, y: 38, events: ["trader_caravan"],
    enemies: ["radroach", "mole_rat"], vendor: ["stimpak", "radaway", "pipe_rifle", "metal_armor", "adhesive", "circuitry"], desc: "A walled trading town around the old monument." },
  { id: "fort_hagen", name: "Fort Hagen", region: "Massachusetts", danger: "High", x: 30, y: 62, events: ["sentry_patrol"],
    enemies: ["synth", "gunner", "assaultron"], desc: "A military base with something hiding in its command center." },
  { id: "salem", name: "Salem", region: "Massachusetts", danger: "Medium", x: 85, y: 15, events: ["deathclaw_hunt"],
    enemies: ["mirelurk", "feral_ghoul", "deathclaw_cub"], desc: "A seaside town with a witch museum and a very bad reputation." },

  /* Nevada */
  { id: "nipton", name: "Nipton", region: "Nevada", danger: "Medium", x: 38, y: 94,
    enemies: ["legionary", "radroach"], desc: "Smoke rises from the town hall. A message was sent here." },
  { id: "jacobstown", name: "Jacobstown", region: "Nevada", danger: "Low", x: 30, y: 20, nocamp: true,
    enemies: ["nightstalker"], vendor: ["super_stimpak", "radaway", "buffout", "super_sledge"], desc: "A mountain lodge where peaceful super mutants live." },
  { id: "nellis", name: "Nellis Air Force Base", region: "Nevada", danger: "Medium", x: 75, y: 15,
    enemies: ["raider", "nightstalker"], desc: "Artillery fire warns visitors away from the hangars." },
  { id: "mccarran", name: "Camp McCarran", region: "Nevada", danger: "Low", x: 66, y: 33, nocamp: true, ally: "ncr_trooper", events: ["ncr_patrol"],
    enemies: ["radroach"], vendor: ["service_rifle", "stimpak", "ncr_ranger", "med_x"], desc: "The NCR's headquarters in an old airport terminal." },

  /* California */
  { id: "adytum", name: "Adytum", region: "California", danger: "Low", x: 25, y: 35,
    enemies: ["radroach", "mole_rat"], vendor: ["stimpak", "hunting_rifle", "leather_armor", "cram"], desc: "A walled community in the old city." },
  { id: "junktown", name: "Junktown", region: "California", danger: "Low", x: 85, y: 40, ally: "settler",
    enemies: ["radroach", "wasteland_dog"], vendor: ["pipe_pistol", "stimpak", "iguana_stick", "scrap", "duct_tape"], desc: "A walled town built from car wrecks." },
  { id: "the_glow", name: "The Glow", region: "California", danger: "High", x: 88, y: 75, rads: 8, events: ["radstorm"],
    enemies: ["glowing_one", "feral_ghoul", "radscorpion"], desc: "A crater over a dead research facility. Bring RadAway." },
  { id: "mariposa", name: "Mariposa Military Base", region: "California", danger: "High", x: 60, y: 15, events: ["mutant_raid"],
    enemies: ["super_mutant", "enclave_soldier"], desc: "Where the vats once bubbled." }
);

/* ---- VAULTS ----
   Hidden until discovered (or revealed by the Vault-Tec Vault Map).
   Vaults are shelters: no hostiles, events or radiation inside. */
const VAULT_DEFAULTS = { vault: true, danger: "Low", nocamp: true, enemies: [] };

/* Vaults that already existed as POIs keep their vendors/allies */
["vault_76", "vault_101", "vault_111", "vault_33", "vault_4", "vault_19"].forEach((id) => {
  const loc = LOCATIONS.find((l) => l.id === id);
  if (loc) Object.assign(loc, { vault: true, nocamp: true });
});

LOCATIONS.push(...[
  { id: "vault_94",  name: "Vault 94",  region: "West Virginia", x: 32, y: 38, desc: "A peaceful vault built around a garden. The door was sealed from the inside." },
  { id: "vault_96",  name: "Vault 96",  region: "West Virginia", x: 52, y: 62, desc: "Cryo-storage for animal specimens. Most pods are cracked." },
  { id: "vault_51",  name: "Vault 51",  region: "West Virginia", x: 75, y: 32, desc: "A vault run by a scheming computer that wanted one dweller left standing." },
  { id: "vault_79",  name: "Vault 79",  region: "West Virginia", x: 8,  y: 70, desc: "Rumored to hold a fortune in gold. The vault itself says nothing." },
  { id: "vault_58",  name: "Vault 58",  region: "Pennsylvania",  x: 15, y: 70, desc: "Its steel-mill workshops never stopped running." },
  { id: "vault_46",  name: "Vault 46",  region: "Pennsylvania",  x: 85, y: 75, desc: "A quiet vault whose dwellers left in a hurry." },
  { id: "vault_64",  name: "Vault 64",  region: "Ohio",          x: 80, y: 75, desc: "Pastel corridors and a cafeteria full of untouched trays." },
  { id: "vault_53",  name: "Vault 53",  region: "Maryland",      x: 45, y: 85, desc: "Everything here was designed to break down. Constantly." },
  { id: "vault_87",  name: "Vault 87",  region: "Capital Wasteland", x: 88, y: 18, desc: "An irradiated research vault. Something big was grown here." },
  { id: "vault_92",  name: "Vault 92",  region: "Capital Wasteland", x: 15, y: 15, desc: "A vault for musicians. Static still plays through the speakers." },
  { id: "vault_106", name: "Vault 106", region: "Capital Wasteland", x: 20, y: 80, desc: "The air vents carry a faint, sweet smell. Don't breathe too deep." },
  { id: "vault_112", name: "Vault 112", region: "Capital Wasteland", x: 60, y: 88, desc: "Rows of virtual-reality pods. Their occupants are long gone." },
  { id: "vault_81",  name: "Vault 81",  region: "Massachusetts", x: 48, y: 68, desc: "Still inhabited. They're wary of outsiders but polite about it." },
  { id: "vault_75",  name: "Vault 75",  region: "Massachusetts", x: 88, y: 65, desc: "A 'school' under a high school. The graduation exams were brutal." },
  { id: "vault_95",  name: "Vault 95",  region: "Massachusetts", x: 15, y: 72, desc: "A rehab vault. Someone left a crate of chems by the door." },
  { id: "vault_114", name: "Vault 114", region: "Massachusetts", x: 54, y: 34, desc: "Built for the wealthy, with deliberately terrible accommodations." },
  { id: "vault_3",   name: "Vault 3",   region: "Nevada",        x: 75, y: 80, desc: "Once a model vault until raiders found the door code." },
  { id: "vault_11",  name: "Vault 11",  region: "Nevada",        x: 15, y: 40, desc: "Its dwellers were told to make a terrible choice every year." },
  { id: "vault_21",  name: "Vault 21",  region: "Nevada",        x: 42, y: 24, desc: "A gambler's vault. Disputes were settled with blackjack." },
  { id: "vault_22",  name: "Vault 22",  region: "Nevada",        x: 88, y: 25, desc: "An agricultural vault overgrown with very aggressive plants." },
  { id: "vault_34",  name: "Vault 34",  region: "Nevada",        x: 40, y: 40, desc: "A well-stocked armory and a leaking reactor. Guess which one won." },
  { id: "vault_12",  name: "Vault 12",  region: "California",    x: 42, y: 22, desc: "Its door never fully closed. The radiation came in." },
  { id: "vault_13",  name: "Vault 13",  region: "California",    x: 90, y: 12, desc: "A legendary vault. Its water chip broke a long time ago." },
  { id: "vault_15",  name: "Vault 15",  region: "California",    x: 15, y: 88, desc: "A diverse vault whose dwellers founded more than one town." },
  { id: "vault_32",  name: "Vault 32",  region: "California",    x: 38, y: 88, desc: "Sister vault to 33. The halls are silent." }
].map((v) => ({ ...VAULT_DEFAULTS, ...v })));

/* Lootable rooms inside every vault. They restock over time. */
const VAULT_RESTOCK_MS = 30 * 60 * 1000;
const VAULT_DISCOVERY_BASE = 0.1;  // chance per surface trip (+1% per LCK above 5)
const VAULT_DISCOVERY_XP = 50;
const VAULT_ROOMS = [
  { id: "storage",  name: "Storage Lockers",   icon: "▤", rolls: [2, 4], desc: "Food, drink and household junk.",
    table: [["cram", 12], ["sugar_bombs", 10], ["fancy_lads", 8], ["purified_water", 12], ["nuka_cola", 8], ["scrap", 14], ["cloth", 10], ["duct_tape", 8], ["tin_can", 8], ["teddy_bear", 4], ["wood", 8]] },
  { id: "medical",  name: "Medical Bay",       icon: "✚", rolls: [1, 3], desc: "Stimpaks, RadAway and chems.",
    table: [["stimpak", 30], ["super_stimpak", 8], ["radaway", 20], ["rad_x", 14], ["med_x", 10], ["mentats", 8], ["bloodleaf", 10]] },
  { id: "armory",   name: "Security Armory",   icon: "⌖", rolls: [1, 2], desc: "Weapons and armor from vault security.",
    table: [["pistol_10mm", 18], ["vault_suit", 14], ["combat_shotgun", 8], ["laser_pistol", 8], ["hunting_rifle", 10], ["metal_armor", 10], ["combat_armor", 6], ["laser_rifle", 5], ["plasma_rifle", 2], ["stimpak", 12]] },
  { id: "reactor",  name: "Reactor Level",     icon: "☢", rolls: [2, 3], desc: "Power components and rare materials.",
    table: [["circuitry", 25], ["steel", 25], ["nuclear", 15], ["adhesive", 15], ["desk_fan", 10], ["fusion_core", 5]] },
  { id: "overseer", name: "Overseer's Office", icon: "★", rolls: [1, 2], caps: [20, 60], desc: "Caps, records and the overseer's private stash.",
    table: [["holotape", 25], ["prewar_money", 25], ["mentats", 15], ["bobblehead", 8], ["nuka_quantum", 7], ["super_stimpak", 10]] }
];

/* Default scavenge tables by danger */
const SCAVENGE_TABLE = {
  Low:    [["scrap", 30], ["wood", 25], ["cloth", 15], ["tin_can", 12], ["teddy_bear", 6], ["cram", 6], ["dirty_water", 6], ["bloodleaf", 8], ["stimpak", 3], ["prewar_money", 4], ["duct_tape", 5]],
  Medium: [["scrap", 25], ["steel", 20], ["wood", 15], ["adhesive", 10], ["cloth", 10], ["desk_fan", 8], ["duct_tape", 8], ["circuitry", 6], ["stimpak", 5], ["nuka_cola", 5], ["prewar_money", 6], ["holotape", 3], ["bobblehead", 1]],
  High:   [["steel", 22], ["scrap", 18], ["adhesive", 12], ["circuitry", 12], ["nuclear", 6], ["desk_fan", 6], ["glowing_fungus", 8], ["stimpak", 6], ["radaway", 4], ["fusion_core", 2], ["prewar_money", 6], ["bobblehead", 2], ["super_stimpak", 2]]
};

/* ---------------------------
   C.A.M.P. STRUCTURES
--------------------------- */
const CAMP_DEPLOY_COST = 25;     // caps to move an existing C.A.M.P. (first deploy is free)
const CAMP_FAST_TRAVEL_COST = 5; // caps
const CAMP_BASE_STORAGE = 50;
const CAMP_BASE_HOUSING = 1;
const CAMP_TICK_MS = 60000;      // production cycle

const STRUCTURES = {
  bed:         { name: "Bed",                     icon: "▭", max: 1, cost: { wood: 4, cloth: 3 }, desc: "Rest here to fully heal you and your party." },
  stash:       { name: "Stash Box",               icon: "▣", max: 4, cost: { wood: 3, steel: 4 }, storage: 50, desc: "+50 storage capacity." },
  bunk:        { name: "Bunkhouse",               icon: "⌂", max: 5, cost: { wood: 6, cloth: 2, steel: 2 }, housing: 2, desc: "+2 housing for stationed allies." },
  chem:        { name: "Chemistry Station",       icon: "⚗", max: 1, cost: { steel: 5, adhesive: 2, circuitry: 1 }, desc: "Craft Stimpaks, RadAway and chems." },
  cooking:     { name: "Cooking Station",         icon: "♨", max: 1, cost: { wood: 4, steel: 2 }, desc: "Cook raw meat and crops into hearty meals." },
  weaponBench: { name: "Weapons Workbench",       icon: "⚒", max: 1, cost: { wood: 5, steel: 6, adhesive: 2 }, desc: "Craft and upgrade weapons." },
  armorBench:  { name: "Armor Workbench",         icon: "⛨", max: 1, cost: { wood: 5, steel: 4, cloth: 4 }, desc: "Craft and upgrade armor." },
  generator:   { name: "Fusion Generator",        icon: "⚡", max: 3, cost: { steel: 6, circuitry: 3, nuclear: 2 }, powerOut: 6, desc: "Provides 6 power." },
  crops:       { name: "Crop Plot",               icon: "✿", max: 6, cost: { wood: 2, scrap: 2 }, desc: "Grows Tatos and Mutfruit each cycle." },
  water:       { name: "Water Purifier",          icon: "≈", max: 3, power: 1, cost: { steel: 6, circuitry: 2, adhesive: 1 }, desc: "Produces Purified Water. Needs 1 power." },
  extractor:   { name: "Junk Extractor",          icon: "⛏", max: 1, power: 2, cost: { steel: 8, circuitry: 4, nuclear: 1 }, desc: "Pulls materials from the earth. Needs 2 power." },
  nukaMachine: { name: "Nuka-Cola Machine",       icon: "◘", max: 1, power: 1, cost: { steel: 4, circuitry: 2 }, desc: "Dispenses the occasional Nuka-Cola. Needs 1 power." },
  turret:      { name: "Machine Gun Turret",      icon: "⌖", max: 6, power: 1, cost: { steel: 5, circuitry: 2, adhesive: 2 }, defense: 8, desc: "+8 defense. Keeps raiders and wildlife away. Needs 1 power." },
  beacon:      { name: "Recruitment Beacon",      icon: "⌁", max: 1, power: 2, cost: { steel: 4, circuitry: 3 }, desc: "Broadcasts an invitation. Wanderers may arrive to join you. Needs 2 power." }
};

/* ---------------------------
   CRAFTING RECIPES
   station: field (anywhere) | chem | cooking | weaponBench | armorBench
--------------------------- */
const RECIPES = [
  { id: "field_stim",   station: "field",       out: "stimpak",         qty: 1, cost: { scrap: 3 } },
  { id: "field_breakdown", station: "field",    special: "breakdown",  name: "Break down all junk", cost: {} },

  { id: "stim",         station: "chem",        out: "stimpak",         qty: 2, cost: { bloodleaf: 2, adhesive: 1 } },
  { id: "superstim",    station: "chem",        out: "super_stimpak",   qty: 1, cost: { stimpak: 2, bloodleaf: 2, nuclear: 1 } },
  { id: "radaway",      station: "chem",        out: "radaway",         qty: 1, cost: { glowing_fungus: 2, adhesive: 1 } },
  { id: "radx",         station: "chem",        out: "rad_x",           qty: 1, cost: { glowing_fungus: 1, bloodleaf: 1 } },
  { id: "buffout",      station: "chem",        out: "buffout",         qty: 1, cost: { bloodleaf: 2, scrap: 2 } },
  { id: "medx",         station: "chem",        out: "med_x",           qty: 1, cost: { bloodleaf: 1, glowing_fungus: 1, adhesive: 1 } },
  { id: "psycho",       station: "chem",        out: "psycho",          qty: 1, cost: { glowing_fungus: 2, adhesive: 1 } },
  { id: "jet",          station: "chem",        out: "jet",             qty: 1, cost: { scrap: 2, adhesive: 1 } },

  { id: "c_roach",      station: "cooking",     out: "grilled_radroach",qty: 1, cost: { radroach_meat: 1, wood: 1 } },
  { id: "c_molerat",    station: "cooking",     out: "molerat_steak",   qty: 1, cost: { molerat_meat: 1, wood: 1 } },
  { id: "c_brahmin",    station: "cooking",     out: "brahmin_steak",   qty: 1, cost: { brahmin_meat: 1, wood: 1 } },
  { id: "c_mirelurk",   station: "cooking",     out: "mirelurk_cake",   qty: 1, cost: { mirelurk_meat: 1, tato: 1, wood: 1 } },
  { id: "c_deathclaw",  station: "cooking",     out: "deathclaw_steak", qty: 1, cost: { deathclaw_meat: 1, wood: 2 } },
  { id: "c_stew",       station: "cooking",     out: "tato_stew",       qty: 1, cost: { tato: 2, purified_water: 1, wood: 1 } },
  { id: "c_water",      station: "cooking",     out: "purified_water",  qty: 1, cost: { dirty_water: 1, wood: 1 } },

  { id: "w_pipe",       station: "weaponBench", out: "pipe_pistol",     qty: 1, cost: { scrap: 3, steel: 2 } },
  { id: "w_machete",    station: "weaponBench", out: "machete",         qty: 1, cost: { steel: 3, wood: 1 } },
  { id: "w_hunting",    station: "weaponBench", out: "hunting_rifle",   qty: 1, cost: { steel: 5, wood: 3, adhesive: 2 } },
  { id: "w_shotgun",    station: "weaponBench", out: "combat_shotgun",  qty: 1, cost: { steel: 7, wood: 2, adhesive: 3 } },
  { id: "w_laser",      station: "weaponBench", out: "laser_rifle",     qty: 1, cost: { steel: 6, circuitry: 4, nuclear: 1 } },
  { id: "w_plasma",     station: "weaponBench", out: "plasma_rifle",    qty: 1, cost: { steel: 8, circuitry: 6, nuclear: 3 } },
  { id: "w_sledge",     station: "weaponBench", out: "super_sledge",    qty: 1, cost: { steel: 10, adhesive: 4, circuitry: 2 } },
  { id: "w_gauss",      station: "weaponBench", out: "gauss_rifle",     qty: 1, cost: { steel: 10, circuitry: 8, fusion_core: 1 } },
  { id: "w_blaster",    station: "weaponBench", out: "alien_blaster",   qty: 1, cost: { alien_alloy: 3, circuitry: 6, nuclear: 2 } },
  { id: "w_upgrade",    station: "weaponBench", special: "upgrade", slot: "weapon", name: "Upgrade equipped weapon rarity" },

  { id: "a_leather",    station: "armorBench",  out: "leather_armor",   qty: 1, cost: { cloth: 4, adhesive: 1 } },
  { id: "a_metal",      station: "armorBench",  out: "metal_armor",     qty: 1, cost: { steel: 8, adhesive: 2 } },
  { id: "a_combat",     station: "armorBench",  out: "combat_armor",    qty: 1, cost: { steel: 6, cloth: 4, adhesive: 3 } },
  { id: "a_synth",      station: "armorBench",  out: "synth_armor",     qty: 1, cost: { steel: 6, circuitry: 4, adhesive: 3 } },
  { id: "a_t45",        station: "armorBench",  out: "t45",             qty: 1, cost: { steel: 14, circuitry: 4, fusion_core: 1 } },
  { id: "a_t60",        station: "armorBench",  out: "t60",             qty: 1, cost: { steel: 18, circuitry: 8, fusion_core: 2, deathclaw_hide: 1 } },
  { id: "a_x01",        station: "armorBench",  out: "x01",             qty: 1, cost: { steel: 22, circuitry: 10, fusion_core: 3, alien_alloy: 2 } },
  { id: "a_upgrade",    station: "armorBench",  special: "upgrade", slot: "armor", name: "Upgrade equipped armor rarity" }
];

/* Cost to raise equipped gear's rarity one tier */
const UPGRADE_COSTS = {
  weapon: {
    Common:   { steel: 4, adhesive: 2, scrap: 4 },
    Uncommon: { steel: 6, adhesive: 4, circuitry: 3 },
    Rare:     { steel: 8, circuitry: 4, nuclear: 2, deathclaw_hide: 1 }
  },
  armor: {
    Common:   { cloth: 4, adhesive: 2, steel: 3 },
    Uncommon: { cloth: 6, adhesive: 4, steel: 5 },
    Rare:     { steel: 8, circuitry: 3, nuclear: 2, mothman_wing: 1 }
  }
};

const STATION_LABELS = {
  field: "FIELD CRAFTING",
  chem: "CHEMISTRY STATION",
  cooking: "COOKING STATION",
  weaponBench: "WEAPONS WORKBENCH",
  armorBench: "ARMOR WORKBENCH"
};
