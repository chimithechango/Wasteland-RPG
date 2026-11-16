"use strict";
/* ============================================================
   WASTELAND RPG — ENGINE
   - S.P.E.C.I.A.L. stats with level-up points
   - Weapons / armor with rarity scaling, equip + unequip
   - Hit / crit / dodge combat, V.A.T.S., legendary enemies, bosses
   - Radiation, chems & timed buffs, AP
   - 50+ POIs across 8 regions, location events, scavenging, vendors
   - Allies with HP, perks, downed state; party + C.A.M.P. residents
   - C.A.M.P.: deploy/move, build structures, power, stash storage,
     crafting stations, production cycles, raids, wanderers
   - Save versioning with migration of pre-v2 saves
   Content tables live in data.js.
============================================================ */

const SAVE_KEY = "wastelandSave";
const SAVE_VERSION = 2;
const LOC = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));

const SPECIAL = [
  ["str", "STRENGTH", "+1 damage per point."],
  ["per", "PERCEPTION", "+3% hit chance per point."],
  ["end", "ENDURANCE", "+3 max HP per point."],
  ["cha", "CHARISMA", "Better vendor prices and cheaper recruits."],
  ["int", "INTELLIGENCE", "+5% XP per point above 5 and a chance of bonus crafted aid."],
  ["agi", "AGILITY", "+1 max AP per point, better dodge and flee chance."],
  ["lck", "LUCK", "Critical hit chance and better loot."]
];
const STAT_CAP = 15;
const SCAVENGE_LIMIT = 5;
const SCAVENGE_AP = 3;
const VATS_AP = 4;
const HUNT_AP = 2;
const REGION_FARE = 10;
const MAX_LOG = 250;
const THEMES = ["green", "amber", "blue", "white"];
const POWER_PRIORITY = ["turret", "water", "extractor", "nukaMachine", "beacon"];
const EXTRACTOR_TABLE = [["scrap", 30], ["steel", 25], ["wood", 10], ["adhesive", 15], ["circuitry", 15], ["nuclear", 5]];
const RESIDENT_TABLE = [["scrap", 30], ["wood", 25], ["cloth", 20], ["steel", 15], ["bloodleaf", 10]];
const TYPE_ORDER = { key: -1, weapon: 0, armor: 1, consumable: 2, junk: 3 };
const MAP_ZOOMS = [1, 1.5, 2, 3];

/* ---------------------------
   UTILITIES
--------------------------- */
const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const chance = (p) => Math.random() < p;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pct = (v) => `${Math.round(v)}%`;

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function weightedPick(table) {
  const total = table.reduce((n, [, w]) => n + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of table) {
    r -= w;
    if (r < 0) return key;
  }
  return table[table.length - 1][0];
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/* ---------------------------
   SOUND ENGINE
   Each game sound first looks for your own audio file in sounds/
   (see sounds/README.md for the file names). Any file that's missing
   falls back to a synthesized WebAudio tone, so nothing ever breaks.
--------------------------- */
const SOUND_EXTENSIONS = ["wav", "mp3", "ogg"];
const SOUND_VOLUME = 0.45;

/* game sound -> files to try, in order */
const SOUND_FILES = {
  click:   ["click"],
  nav:     ["pipboy_nav", "click"],
  attack:  ["attack"],
  crit:    ["crit", "attack"],
  miss:    ["miss"],
  hurt:    ["enemy_hit"],
  loot:    ["loot"],
  travel:  ["travel"],
  recruit: ["recruit"],
  levelup: ["levelup"],
  build:   ["build"],
  error:   ["error"],
  alert:   ["alert"],
  boot:    ["pipboy_open"],
  death:   ["death"],
  heal:    ["heal", "stimpak"],
  /* start-up menu */
  power:   ["power_on", "pipboy_open"],
  type:    ["terminal_type"],
  hover:   ["menu_hover", "pipboy_nav", "click"],
  select:  ["menu_select", "click"],
  back:    ["menu_back", "click"],
  start:   ["game_start", "pipboy_open"]
};
const AMBIENCE_FILE = "menu_ambience";
const AMBIENCE_VOLUME = 0.3;
const isMuted = () => (state ? state.settings.muted : prefs.muted);

const Sound = {
  ctx: null,
  samples: {}, // file base name -> loaded Audio element

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
      }
      this.loadSamples();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  },

  ambience: null,

  /* Looping menu background: your menu_ambience file, else a quiet synth hum */
  startAmbience() {
    this.stopAmbience();
    if (isMuted()) return;
    const s = this.samples[AMBIENCE_FILE];
    if (s) {
      const a = s.cloneNode();
      a.loop = true;
      a.volume = AMBIENCE_VOLUME;
      a.play().catch(() => {});
      this.ambience = { synth: false, stop: () => { a.pause(); a.src = ""; } };
      return;
    }
    const ctx = this.ctx;
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.018, ctx.currentTime + 1.5);
    gain.connect(ctx.destination);
    const oscs = [55, 110.6, 164.4].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 1 : 0.25;
      o.connect(g).connect(gain);
      o.start();
      return o;
    });
    this.ambience = {
      synth: true,
      stop: () => {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        oscs.forEach((o) => o.stop(t + 0.45));
      }
    };
  },

  stopAmbience() {
    if (this.ambience) this.ambience.stop();
    this.ambience = null;
  },

  /* Ambience file may finish loading after the menu opens */
  ambienceReady() {
    if (menuOpen && this.ambience && this.ambience.synth) this.startAmbience();
  },

  loadSamples() {
    const names = new Set([...Object.values(SOUND_FILES).flat(), AMBIENCE_FILE]);
    names.forEach((name) => this.tryLoad(name, 0));
  },

  tryLoad(name, extIdx) {
    if (extIdx >= SOUND_EXTENSIONS.length) return;
    let a;
    try { a = new Audio(); } catch (e) { return; }
    a.preload = "auto";
    a.addEventListener("canplaythrough", () => {
      this.samples[name] = a;
      if (name === AMBIENCE_FILE) this.ambienceReady();
    }, { once: true });
    a.addEventListener("error", () => this.tryLoad(name, extIdx + 1), { once: true });
    a.src = `sounds/${name}.${SOUND_EXTENSIONS[extIdx]}`;
    a.load();
  },

  playSample(name) {
    for (const file of SOUND_FILES[name] || []) {
      const s = this.samples[file];
      if (!s) continue;
      const a = s.cloneNode();
      a.volume = SOUND_VOLUME;
      a.play().catch(() => {});
      return true;
    }
    return false;
  },

  tone(freq, dur, { type = "square", vol = 0.035, delay = 0, slide = null } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  noise(dur, vol = 0.05, delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + delay);
  },

  play(name) {
    if (isMuted()) return;
    if (this.playSample(name)) return;
    if (!this.ctx) return;
    const seq = (notes, step, opts) => notes.forEach((f, i) => this.tone(f, step * 1.3, { ...opts, delay: i * step }));
    switch (name) {
      case "click": this.tone(1800, 0.03, { vol: 0.02 }); break;
      case "nav": this.tone(1100, 0.04, { vol: 0.025 }); this.tone(1500, 0.04, { vol: 0.025, delay: 0.04 }); break;
      case "attack": this.noise(0.12, 0.07); this.tone(200, 0.1, { type: "sawtooth", slide: 60 }); break;
      case "crit": this.noise(0.2, 0.09); this.tone(900, 0.2, { type: "sawtooth", slide: 150 }); break;
      case "miss": this.tone(420, 0.1, { slide: 200, vol: 0.025 }); break;
      case "hurt": this.tone(140, 0.2, { type: "sawtooth", slide: 50, vol: 0.06 }); break;
      case "loot": seq([660, 990], 0.08, { type: "triangle" }); break;
      case "travel": this.tone(260, 0.45, { type: "triangle", slide: 900, vol: 0.05 }); break;
      case "recruit": seq([523, 659, 784], 0.1, { type: "triangle" }); break;
      case "levelup": seq([523, 659, 784, 1046], 0.11, { type: "triangle", vol: 0.05 }); break;
      case "build": this.noise(0.06, 0.05); this.tone(500, 0.06, { delay: 0.08 }); this.tone(700, 0.08, { delay: 0.16 }); break;
      case "error": this.tone(130, 0.18, { vol: 0.04 }); break;
      case "alert": this.tone(880, 0.09); this.tone(880, 0.09, { delay: 0.16 }); break;
      case "boot": seq([220, 330, 440, 660], 0.09, { type: "triangle", vol: 0.04 }); break;
      case "death": this.tone(320, 1.3, { type: "sawtooth", slide: 40, vol: 0.06 }); break;
      case "heal": seq([440, 554, 660], 0.07, { type: "sine", vol: 0.05 }); break;
      case "power": this.noise(0.25, 0.04); this.tone(60, 0.9, { type: "sawtooth", slide: 240, vol: 0.05 }); this.tone(4000, 0.5, { type: "sine", vol: 0.01, delay: 0.3 }); break;
      case "type": this.tone(2200 + Math.random() * 900, 0.012, { vol: 0.012 }); break;
      case "hover": this.tone(1350, 0.025, { vol: 0.018 }); break;
      case "select": this.tone(900, 0.05, { vol: 0.03 }); this.tone(1350, 0.07, { vol: 0.03, delay: 0.05 }); break;
      case "back": this.tone(1100, 0.05, { vol: 0.025 }); this.tone(750, 0.07, { vol: 0.025, delay: 0.05 }); break;
      case "start": seq([330, 440, 554, 880], 0.08, { type: "triangle", vol: 0.045 }); break;
    }
  }
};

/* ---------------------------
   STATE
--------------------------- */
let state = null;
let booted = false;
let tickCount = 0;
let modalCallbacks = [];

function createBaseState() {
  return {
    version: SAVE_VERSION,
    nextUid: 1,
    player: {
      name: "Vault Wanderer",
      level: 1,
      xp: 0,
      statPoints: 0,
      hp: 30,
      ap: 10,
      rads: 0,
      caps: 50,
      locationId: "vault",
      special: { str: 5, per: 5, end: 5, cha: 5, int: 5, agi: 5, lck: 5 },
      inventory: [],
      allies: [],
      buffs: [],
      kills: 0,
      dead: false
    },
    enemy: null,
    local: null,
    events: { capsFrenzyActive: false, capsFrenzyTimer: 0 },
    camp: { deployed: false, locationId: null, structures: {}, stash: [], wanderer: null, lastTick: Date.now(), lastProduction: [], lostLast: 0 },
    vaults: {},   // vaultId -> { discoveredAt, rooms: { roomId: lastLootedAt } }
    visited: {},  // locationId -> true
    log: [],
    feed: [],
    settings: { muted: false, theme: "green" },
    ui: { tab: "status", mapRegion: "West Virginia", mapSelected: "vault", mapZoom: 1, invFilter: "all", selectedUid: null, campView: "overview" }
  };
}

function newGame() {
  state = createBaseState();
  const inv = state.player.inventory;
  addItem(inv, "rusty_pistol", 1).equipped = true;
  addItem(inv, "stimpak", 2);
  addItem(inv, "leather_armor", 1);
  addItem(inv, "scrap", 2);
  state.player.hp = effMaxHp();
  state.player.ap = maxAp();
  state.local = rollLocal(LOC.vault);
  state.visited.vault = true;
  log("Welcome to Wasteland RPG — the wastes grow larger every day.", "event");
  log("Tip: deploy your C.A.M.P. to build, store items and house allies.", "info");
  log("Tip: hidden vaults dot the wasteland. Explore and you might stumble onto one.", "info");
}

const P = () => state.player;
const currentLoc = () => LOC[state.player.locationId] || LOC.vault;
const enemyActive = () => !!(state.enemy && !state.enemy.defeated);

/* ---------------------------
   VAULTS
--------------------------- */
const isVaultFound = (id) => !!state.vaults[id];
const hasVaultMap = () => countItem(P().inventory, "vault_map") + countItem(state.camp.stash, "vault_map") > 0;
const inVault = () => !!currentLoc().vault;
/* Can this location be seen on the map / traveled to? */
const isKnown = (loc) => !loc.vault || isVaultFound(loc.id) || hasVaultMap() || loc.id === P().locationId;
const hiddenVaultsIn = (region) => LOCATIONS.filter((l) => l.vault && l.region === region && !isVaultFound(l.id));
const vaultDiscoveryChance = () => clamp(VAULT_DISCOVERY_BASE + (stat("lck") - 5) * 0.01, 0.03, 0.25);

function roomReadyAt(vaultId, roomId) {
  const v = state.vaults[vaultId];
  const t = v && v.rooms && v.rooms[roomId];
  return t ? t + VAULT_RESTOCK_MS : 0;
}

function discoverVault(loc) {
  if (isVaultFound(loc.id)) return false;
  state.vaults[loc.id] = { discoveredAt: Date.now(), rooms: {} };
  log(`VAULT DISCOVERED: ${loc.name} (${loc.region}). It's permanently marked on your map.`, "event");
  addXP(VAULT_DISCOVERY_XP);
  Sound.play("levelup");
  return true;
}

const VAULT_DOOR_ART = [
  "    _.------._",
  "  .'  .----.  '.",
  " /   / .--. \\   \\",
  "|   | ( () ) |   |",
  " \\   \\ '--' /   /",
  "  '._ '----' _.'",
  "     '------'"
].join("\n");

function showVaultDiscovered(vault, intended) {
  showModal({
    title: "VAULT DISCOVERED",
    body: `<pre class="ascii center vault-door">${esc(VAULT_DOOR_ART)}</pre>
      <p class="center"><strong class="big">${esc(vault.name)}</strong></p>
      ${intended ? `<p class="muted small center">On the way to ${esc(intended.name)} you spotted a half-buried Vault-Tec door.</p>` : ""}
      <p>${esc(vault.desc)}</p>
      <p class="muted small">Vaults are shelters: no hostiles, no radiation. Rest, decontaminate and search the rooms for supplies. It's permanently on your map, so you can come back any time.</p>`,
    buttons: [{ label: "ENTER THE VAULT", cls: "btn-primary" }]
  });
}

/* Each loot source rolls this once (enemy loot, scavenging, Overseer's Office) */
function maybeVaultMapDrop() {
  return !hasVaultMap() && chance(VAULT_MAP_CHANCE);
}

function announceVaultMap() {
  log("LEGENDARY FIND: The Vault-Tec Vault Map! Every vault is now marked on your map.", "event");
  toast("★ LEGENDARY: The Vault-Tec Vault Map", "event");
  Sound.play("levelup");
  showModal({
    title: "★ LEGENDARY FIND ★",
    body: `<p class="center"><strong class="big rarity-legendary">The Vault-Tec Vault Map</strong></p>
      <p>${esc(ITEMS.vault_map.desc)}</p>
      <p class="muted small">All ${LOCATIONS.filter((l) => l.vault).length} vaults now appear on your map. Travel to one to unlock it permanently.</p>`,
    buttons: [{ label: "OPEN MAP", cls: "btn-primary", fn: () => { state.ui.tab = "map"; } }, { label: "CLOSE" }]
  });
}

function showVaultMapModal() {
  const rows = REGIONS.map((r) => {
    const vs = LOCATIONS.filter((l) => l.vault && l.region === r);
    const found = vs.filter((v) => isVaultFound(v.id)).length;
    return `<div class="vm-region"><div class="vm-title">${esc(r)} <span class="muted">${found}/${vs.length}</span></div>
      <div class="tag-row">${vs.map((v) => `<span class="tag ${isVaultFound(v.id) ? "tag-here" : "tag-muted"}">${isVaultFound(v.id) ? "✓ " : ""}${esc(v.name)}</span>`).join("")}</div></div>`;
  }).join("");
  showModal({
    title: "VAULT-TEC VAULT MAP",
    body: `<div class="vm-list">${rows}</div><p class="muted small">✓ = unlocked. The rest are marked on your map; travel there to unlock them.</p>`,
    buttons: [{ label: "OPEN MAP", cls: "btn-primary", fn: () => { state.ui.tab = "map"; } }, { label: "CLOSE" }]
  });
}

function searchRoom(roomId) {
  const loc = currentLoc();
  const room = VAULT_ROOMS.find((r) => r.id === roomId);
  if (!loc.vault || !room) return;
  if (!isVaultFound(loc.id)) discoverVault(loc);
  if (roomReadyAt(loc.id, roomId) > Date.now()) return fail(`${room.name} was already searched. It restocks soon.`);
  const p = P();
  const n = rand(room.rolls[0], room.rolls[1]) + (hasPerk("scavenger") ? 1 : 0);
  const found = [];
  for (let i = 0; i < n; i++) {
    const key = weightedPick(room.table);
    const t = ITEMS[key].type;
    const qty = ITEMS[key].material ? rand(1, 3) : 1;
    const rarity = t === "weapon" || t === "armor" ? rollGearRarity(key) : undefined;
    addItem(p.inventory, key, qty, rarity);
    found.push(`${ITEMS[key].name}${rarity && rarity !== "Common" ? ` [${rarity}]` : ""}${qty > 1 ? ` ×${qty}` : ""}`);
  }
  if (room.caps) {
    const c = rand(room.caps[0], room.caps[1]);
    p.caps += c;
    found.push(`${c} caps`);
  }
  state.vaults[loc.id].rooms[roomId] = Date.now();
  log(`Searched ${room.name}: ${found.join(", ")}.`, "loot");
  toast(`${room.name}: ${found.join(", ")}`, "good");
  Sound.play("loot");
  if (room.id === "overseer" && maybeVaultMapDrop()) {
    addItem(p.inventory, "vault_map", 1, "Legendary");
    announceVaultMap();
  }
}

function vaultRest() {
  if (!inVault()) return;
  if (enemyActive()) return fail("Not now!");
  const p = P();
  p.hp = effMaxHp();
  p.ap = maxAp();
  party().forEach((a) => { a.hp = a.maxHp; });
  log("You rest in a vault bunk. HP, AP and your party are fully restored.", "good");
  toast("Rested in the vault", "good");
  Sound.play("heal");
}

function vaultDecon() {
  if (!inVault()) return;
  const p = P();
  if (p.rads <= 0) return fail("You're not irradiated.");
  const r = p.rads;
  p.rads = 0;
  clampVitals();
  log(`The decontamination shower removed ${r} rads.`, "good");
  toast(`-${r} rads`, "good");
  Sound.play("heal");
}


/* ---------------------------
   ITEMS
--------------------------- */
const def = (inst) => ITEMS[inst.key];
const rarityIndex = (r) => Math.max(0, RARITIES.indexOf(r));

function makeItem(key, qty = 1, rarity) {
  return { uid: state.nextUid++, key, quantity: qty, rarity: rarity || ITEMS[key].rarity || "Common", equipped: false };
}

function addItem(list, key, qty = 1, rarity) {
  if (!ITEMS[key] || qty <= 0) return null;
  const r = rarity || ITEMS[key].rarity || "Common";
  const stack = list.find((i) => i.key === key && i.rarity === r && !i.equipped);
  if (stack) {
    stack.quantity += qty;
    return stack;
  }
  const inst = makeItem(key, qty, r);
  list.push(inst);
  return inst;
}

function removeFromStack(list, inst, qty = 1) {
  inst.quantity -= qty;
  if (inst.quantity <= 0) {
    const idx = list.indexOf(inst);
    if (idx >= 0) list.splice(idx, 1);
  }
}

function countItem(list, key) {
  return list.reduce((n, i) => n + (i.key === key && !i.equipped ? i.quantity : 0), 0);
}

function takeItems(list, key, qty) {
  let left = qty;
  for (const inst of [...list]) {
    if (left <= 0) break;
    if (inst.key !== key || inst.equipped) continue;
    const n = Math.min(left, inst.quantity);
    removeFromStack(list, inst, n);
    left -= n;
  }
  return qty - left;
}

const unitCount = (list) => list.reduce((n, i) => n + i.quantity, 0);
const getEquipped = (type) => P().inventory.find((i) => i.equipped && def(i).type === type);
const findInv = (uid) => P().inventory.find((i) => i.uid === uid);

function weaponDamage(inst) {
  return Math.floor(def(inst).damage * (RARITY_WEAPON_MULTIPLIER[inst.rarity] || 1));
}
function armorDefense(inst) {
  return Math.floor((def(inst).defense || 0) * (RARITY_ARMOR_MULTIPLIER[inst.rarity] || 1));
}
function armorHp(inst) {
  return Math.floor((def(inst).hpBoost || 0) * (RARITY_ARMOR_MULTIPLIER[inst.rarity] || 1));
}
function baseValue(key, rarity) {
  return ITEMS[key].value * (RARITY_VALUE_MULTIPLIER[rarity] || 1);
}
function buyPrice(key, rarity) {
  return Math.max(1, Math.ceil(baseValue(key, rarity) * buyMult()));
}
function sellPrice(inst) {
  return Math.max(1, Math.floor(baseValue(inst.key, inst.rarity) * sellMult()));
}

function itemSummary(key, rarity) {
  const d = ITEMS[key];
  if (d.type === "weapon") return `DMG ${Math.floor(d.damage * (RARITY_WEAPON_MULTIPLIER[rarity] || 1))}`;
  if (d.type === "armor") {
    const m = RARITY_ARMOR_MULTIPLIER[rarity] || 1;
    return `DR ${Math.floor(d.defense * m)} · +${Math.floor(d.hpBoost * m)} HP`;
  }
  if (d.type === "consumable") {
    const parts = [];
    if (d.heal) parts.push(`+${d.heal} HP`);
    if (d.ap) parts.push(d.ap >= 99 ? "FULL AP" : `+${d.ap} AP`);
    if (d.radHeal) parts.push(`-${d.radHeal} RADS`);
    if (d.rads) parts.push(`+${d.rads} RADS`);
    if (d.buff) parts.push(`${d.buff.secs}s BUFF`);
    return parts.join(" · ");
  }
  if (d.type === "key") return "KEY ITEM";
  return d.material ? "MATERIAL" : d.breakdown ? "JUNK · SCRAPPABLE" : "JUNK";
}

function itemNameHtml(key, rarity, qty) {
  const d = ITEMS[key];
  const cls = d.type === "weapon" || d.type === "armor" || d.type === "key" ? `rarity-${rarity.toLowerCase()}` : "";
  return `<span class="${cls}">${esc(d.name)}</span>${qty > 1 ? ` <span class="qty">×${qty}</span>` : ""}`;
}

/* ---------------------------
   DERIVED STATS
--------------------------- */
function stat(k) {
  let v = P().special[k];
  P().buffs.forEach((b) => { if (typeof b[k] === "number") v += b[k]; });
  return v;
}
function buffSum(field) {
  return P().buffs.reduce((n, b) => n + (b[field] || 0), 0);
}
function maxHp() {
  const armor = getEquipped("armor");
  return 15 + stat("end") * 3 + P().level * 5 + (armor ? armorHp(armor) : 0);
}
function effMaxHp() {
  return Math.max(1, maxHp() - P().rads);
}
const maxAp = () => 5 + stat("agi");
function playerDamage() {
  const w = getEquipped("weapon");
  const base = 3 + stat("str") + (w ? weaponDamage(w) : 0);
  return Math.round(base * (1 + buffSum("dmgMult")));
}
function playerDR() {
  const a = getEquipped("armor");
  return (a ? armorDefense(a) : 0) + buffSum("dr");
}
const hitChance = () => clamp(70 + stat("per") * 3, 5, 97);
const critChance = () => clamp(stat("lck") * 1.5 + (hasPerk("sniper") ? 5 : 0), 0, 60);
const dodgeChance = () => clamp(stat("agi") * 1, 0, 30);
const fleeChance = () => clamp(50 + stat("agi") * 4, 10, 95);
const xpMult = () => Math.max(0.75, 1 + (stat("int") - 5) * 0.05);
const recruitMult = () => Math.max(0.5, 1.25 - stat("cha") * 0.05);
function buyMult() {
  let m = 1.15 - stat("cha") * 0.03;
  if (hasPerk("charm")) m *= 0.9;
  if (state.local && state.local.sale) m *= 0.8;
  return Math.max(0.5, m);
}
function sellMult() {
  let m = 0.3 + stat("cha") * 0.02;
  if (hasPerk("charm")) m *= 1.1;
  return Math.min(0.9, m);
}
const xpToNext = (level) => Math.floor(100 * Math.pow(1.25, level - 1));
const maxParty = () => Math.min(6, 1 + P().level);

function clampVitals() {
  const p = P();
  p.rads = clamp(Math.round(p.rads), 0, Math.max(0, maxHp() - 1));
  p.hp = clamp(Math.round(p.hp), 0, effMaxHp());
  p.ap = clamp(Math.round(p.ap), 0, maxAp());
  p.allies.forEach((a) => { a.hp = clamp(Math.round(a.hp), 0, a.maxHp); });
}

function addRads(n) {
  if (n <= 0) return 0;
  const resist = clamp(buffSum("radResist"), 0, 0.9);
  const amount = Math.max(1, Math.round(n * (1 - resist)));
  P().rads += amount;
  clampVitals();
  return amount;
}

/* ---------------------------
   ALLIES
--------------------------- */
const party = () => P().allies.filter((a) => !a.stationed);
const stationed = () => P().allies.filter((a) => a.stationed);
const activeAllies = () => party().filter((a) => a.hp > 0);
const hasPerk = (perk) => activeAllies().some((a) => ALLIES[a.key].perk === perk);

function makeAlly(key, paid) {
  const a = ALLIES[key];
  const maxHpVal = a.hp + a.boost * 2;
  return {
    uid: state.nextUid++,
    key,
    name: a.name,
    rarity: a.rarity,
    damage: a.damage + a.boost,
    maxHp: maxHpVal,
    hp: maxHpVal,
    cost: paid != null ? paid : a.cost,
    stationed: false
  };
}

function canRecruitKey(key) {
  const a = ALLIES[key];
  if (!a) return false;
  return !(a.unique && P().allies.some((x) => x.key === key));
}

const allyCost = (key) => Math.max(1, Math.round(ALLIES[key].cost * recruitMult()));

/* ---------------------------
   C.A.M.P. HELPERS
--------------------------- */
const atCamp = () => state.camp.deployed && state.camp.locationId === P().locationId;
const sCount = (key) => state.camp.structures[key] || 0;
const campStorage = () => CAMP_BASE_STORAGE + sCount("stash") * STRUCTURES.stash.storage;
const campHousing = () => CAMP_BASE_HOUSING + sCount("bunk") * STRUCTURES.bunk.housing;
const powerSupply = () => sCount("generator") * STRUCTURES.generator.powerOut;
const powerDemand = () => POWER_PRIORITY.reduce((n, k) => n + sCount(k) * STRUCTURES[k].power, 0);

function poweredCounts() {
  let avail = powerSupply();
  const out = {};
  POWER_PRIORITY.forEach((k) => {
    const per = STRUCTURES[k].power;
    const can = Math.min(sCount(k), Math.floor(avail / per));
    out[k] = can;
    avail -= can * per;
  });
  return out;
}

function campDefense() {
  const turrets = poweredCounts().turret * STRUCTURES.turret.defense;
  const residents = stationed().filter((a) => a.hp > 0).reduce((n, a) => n + a.damage, 0);
  return Math.round(turrets + residents * 1.5);
}

function haveCount(key, useStash) {
  return countItem(P().inventory, key) + (useStash ? countItem(state.camp.stash, key) : 0);
}
function canAfford(cost, useStash) {
  return Object.entries(cost).every(([k, n]) => haveCount(k, useStash) >= n);
}
function payCost(cost, useStash) {
  Object.entries(cost).forEach(([k, n]) => {
    const got = takeItems(P().inventory, k, n);
    if (got < n && useStash) takeItems(state.camp.stash, k, n - got);
  });
}
function costHtml(cost, useStash) {
  const entries = Object.entries(cost);
  if (!entries.length) return `<span class="muted">No materials</span>`;
  return entries.map(([k, n]) => {
    const have = haveCount(k, useStash);
    return `<span class="cost ${have >= n ? "ok" : "missing"}">${esc(ITEMS[k].name)} ${have}/${n}</span>`;
  }).join("");
}

/* ---------------------------
   LOGGING / FEEDBACK
--------------------------- */
function log(msg, cls = "info") {
  state.log.push({ t: Date.now(), msg, cls });
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}

function feed(msg, cls = "info") {
  state.feed.push({ msg, cls });
  if (state.feed.length > 30) state.feed.shift();
}

function toast(msg, cls = "info") {
  const box = $("toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `toast toast-${cls}`;
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add("out"), 3600);
  setTimeout(() => el.remove(), 4100);
}

function fail(msg) {
  toast(msg, "bad");
  Sound.play("error");
}

/* ---------------------------
   LOCATION / TRAVEL / EVENTS
--------------------------- */
function rollLocal(loc) {
  const local = { locationId: loc.id, allyKey: null, vendor: null, event: null, sale: false, scavenges: 0 };
  if (loc.ally && canRecruitKey(loc.ally)) {
    // Named companions are always home; generic hires show up half the time.
    if (ALLIES[loc.ally].unique || chance(0.5)) local.allyKey = loc.ally;
  }
  if (loc.vendor) {
    local.vendor = loc.vendor.map((key) => {
      const t = ITEMS[key].type;
      return { key, rarity: ITEMS[key].rarity || "Common", stock: t === "consumable" || t === "junk" ? rand(3, 8) : rand(1, 2) };
    });
  }
  return local;
}

function arriveAt(loc, { noEncounter = false } = {}) {
  const p = P();
  p.locationId = loc.id;
  state.enemy = null;
  state.feed = [];
  state.local = rollLocal(loc);
  state.ui.mapRegion = loc.region;
  state.ui.mapSelected = loc.id;
  state.visited[loc.id] = true;
  log(`Arrived at ${loc.name}, ${loc.region}.`, "travel");
  if (loc.vault) {
    discoverVault(loc);
    feed("The vault door seals behind you. You're safe here.", "good");
    if (state.local.vendor) log(`A merchant is trading in ${loc.name}.`);
    if (state.local.allyKey) log(`${ALLIES[state.local.allyKey].name} is looking for work here.`);
    return;
  }
  if (loc.rads) {
    const got = addRads(loc.rads);
    log(`Background radiation: +${got} rads.`, "warn");
  }
  if (state.local.vendor) log(`A merchant is trading in ${loc.name}.`);
  if (state.local.allyKey) log(`${ALLIES[state.local.allyKey].name} is looking for work here.`);
  if (atCamp()) log("Home sweet C.A.M.P.", "good");

  if (noEncounter) return;
  const spawned = maybeTriggerEvent(loc);
  if (!spawned && !maybeSpawnEnemy(loc, true)) {
    feed("The area is quiet. A little too quiet...", "muted");
  }
}

function travelTo(id) {
  const loc = LOC[id];
  const p = P();
  if (!loc || p.dead) return;
  if (loc.id === p.locationId) return fail("You're already here.");
  if (!isKnown(loc)) return fail("You don't know where that is.");
  if (enemyActive()) return fail("You can't travel with a hostile in your face. Fight or flee!");
  const fare = loc.region !== currentLoc().region ? REGION_FARE : 0;
  if (p.caps < fare) return fail(`The caravan to ${loc.region} costs ${fare} caps.`);
  if (fare) {
    p.caps -= fare;
    log(`Paid ${fare} caps caravan fare to ${loc.region}.`);
  }
  Sound.play("travel");
  // Surface trips may turn up a hidden vault in the destination region instead.
  if (!loc.vault) {
    const hidden = hiddenVaultsIn(loc.region);
    if (hidden.length && chance(vaultDiscoveryChance())) {
      const vault = pick(hidden);
      arriveAt(vault);
      showVaultDiscovered(vault, loc);
      return;
    }
  }
  const firstTime = loc.vault && !isVaultFound(loc.id);
  arriveAt(loc);
  if (firstTime) showVaultDiscovered(loc, null);
}

function maybeTriggerEvent(loc) {
  const pool = loc.events || [];
  if (!pool.length || !chance(0.45)) return false;
  return applyEvent(pick(pool), loc);
}

/* Returns true if the event spawned an enemy */
function applyEvent(key, loc) {
  const ev = EVENTS[key];
  const p = P();
  if (!ev) return false;
  state.local.event = { key, name: ev.name, text: ev.text };
  log(`EVENT: ${ev.name} — ${ev.text}`, "event");
  feed(`EVENT: ${ev.name}`, "event");
  toast(`EVENT: ${ev.name}`, "event");

  const grant = (loot) => loot.forEach(([k, min, max]) => {
    const n = rand(min, max);
    if (n > 0) {
      addItem(p.inventory, k, n);
      log(`Received ${ITEMS[k].name}${n > 1 ? ` ×${n}` : ""}.`, "loot");
    }
  });

  switch (ev.type) {
    case "caps": {
      let n = rand(ev.min, ev.max);
      if (state.events.capsFrenzyActive) n *= 2;
      p.caps += n;
      log(`+${n} caps.`, "loot");
      break;
    }
    case "gamble":
      if (chance(0.5 + (stat("lck") - 5) * 0.03)) {
        p.caps += 25;
        log("You win the hand! +25 caps.", "good");
      } else {
        const lost = Math.min(10, p.caps);
        p.caps -= lost;
        log(`The house always wins. -${lost} caps.`, "warn");
      }
      break;
    case "spawn":
      spawnEnemy(ev.enemy, loc);
      return true;
    case "storm": {
      let dmg = rand(ev.dmg[0], ev.dmg[1]);
      if (playerDR() >= 5) dmg = Math.ceil(dmg / 2);
      p.hp = Math.max(1, p.hp - dmg);
      const r = addRads(ev.rads);
      log(`The storm deals ${dmg} damage and ${r} rads.`, "warn");
      break;
    }
    case "cache":
    case "gift":
      grant(ev.loot);
      break;
    case "heal":
      p.hp = effMaxHp();
      log("HP fully restored.", "good");
      break;
    case "xp":
      addXP(ev.amount);
      break;
    case "rads": {
      const r = addRads(ev.amount);
      log(`+${r} rads.`, "warn");
      break;
    }
    case "reward":
      p.caps += ev.caps;
      log(`+${ev.caps} caps.`, "loot");
      addXP(ev.xp);
      break;
    case "sale":
      state.local.sale = true;
      break;
  }
  clampVitals();
  return false;
}

/* ---------------------------
   ENEMIES / ENCOUNTERS
--------------------------- */
function maybeSpawnEnemy(loc, onArrival) {
  const p = P();
  if (loc.vault || !loc.enemies.length) return false;
  const bossOk = p.level >= 5 || loc.danger !== "Low";
  const isWV = loc.region === "West Virginia";
  if (bossOk && (isWV || loc.id === "vegas") && chance(1 / 20)) {
    spawnEnemy("deathclaw", loc);
    log("A Deathclaw appears! Good luck... You'll need it.", "crit");
    return true;
  }
  if (bossOk && isWV && chance(1 / 40)) {
    spawnEnemy("mothman", loc);
    log("The Mothman watches you from the dark...", "crit");
    return true;
  }
  let threshold = onArrival ? { Low: 0.4, Medium: 0.6, High: 0.75 }[loc.danger] : 1;
  if (atCamp()) threshold *= Math.max(0, 1 - poweredCounts().turret * 0.2);
  if (chance(threshold)) {
    spawnEnemy(pick(loc.enemies), loc);
    return true;
  }
  return false;
}

function spawnEnemy(key, loc) {
  const d = ENEMIES[key];
  if (!d) return;
  const p = P();
  let lvl, hpMult, dmgMult;
  if (d.boss) {
    lvl = Math.max(10, p.level + 2);
    const over = Math.max(0, p.level - 8);
    hpMult = 1 + over * 0.1;
    dmgMult = 1 + over * 0.06;
  } else {
    const off = { Low: -1, Medium: 0, High: 2 }[loc.danger] || 0;
    lvl = clamp(p.level + off + rand(-1, 1), 1, 99);
    hpMult = 1 + 0.18 * (lvl - 1);
    dmgMult = 1 + 0.1 * (lvl - 1);
  }
  const legendary = !d.boss && lvl >= 3 && chance(0.05);
  if (legendary) {
    hpMult *= 2;
    dmgMult *= 1.3;
  }
  const hp = Math.round(d.hp * hpMult);
  state.enemy = {
    key,
    name: (legendary ? "Legendary " : "") + d.name,
    level: lvl,
    hp,
    maxHp: hp,
    dmg: Math.max(1, Math.round(d.dmg * dmgMult)),
    rads: d.rads || 0,
    boss: !!d.boss,
    legendary,
    defeated: false,
    loot: []
  };
  const e = state.enemy;
  feed(`${e.boss ? "☠ " : legendary ? "★ " : ""}A ${e.name} (LVL ${lvl}) appears!`, "crit");
  log(`Encountered ${e.name} (level ${lvl}).`, "combat");
  if (state.ui.tab !== "combat") toast(`⚠ HOSTILE: ${e.name}`, "bad");
  Sound.play("alert");
}

function randomEncounterCheck() {
  const p = P();
  if (p.dead || state.enemy || !$("modal").classList.contains("hidden")) return false;
  const loc = currentLoc();
  if (loc.vault) return false;
  let c = { Low: 0.06, Medium: 0.1, High: 0.14 }[loc.danger];
  if (atCamp()) c *= Math.max(0, 1 - poweredCounts().turret * 0.2);
  if (!chance(c)) return false;
  return maybeSpawnEnemy(loc, false);
}

function rollGearRarity(key) {
  const base = ITEMS[key].rarity || "Common";
  let idx = rarityIndex(base);
  const luck = 1 + (stat("lck") - 5) * 0.05;
  if (idx < 3 && chance(0.1 * luck)) idx++;
  return RARITIES[idx];
}

function rollLoot(e) {
  const d = ENEMIES[e.key];
  const luck = 1 + (stat("lck") - 5) * 0.03;
  const out = [];
  d.loot.forEach(([key, ch, min, max]) => {
    if (!ITEMS[key] || !chance(Math.min(1, ch * luck))) return;
    const t = ITEMS[key].type;
    out.push({ key, qty: rand(min, max), rarity: t === "weapon" || t === "armor" ? rollGearRarity(key) : undefined });
  });
  if (chance(0.25)) out.push({ key: "stimpak", qty: 1 });
  if (maybeVaultMapDrop()) out.push({ key: "vault_map", qty: 1, rarity: "Legendary" });
  if (e.legendary || (e.boss && chance(0.5))) {
    const cap = 80 + P().level * 40;
    const pool = Object.keys(ITEMS).filter((k) => (ITEMS[k].type === "weapon" || ITEMS[k].type === "armor") && ITEMS[k].value <= cap);
    const key = pick(pool);
    const rolled = chance(0.3) ? "Legendary" : "Rare";
    out.push({ key, qty: 1, rarity: RARITIES[Math.max(rarityIndex(rolled), rarityIndex(ITEMS[key].rarity))] });
  }
  return out;
}

/* ---------------------------
   COMBAT
--------------------------- */
function partyNames(names) {
  if (!names.length) return "You";
  if (names.length === 1) return `You and ${names[0]}`;
  return `You, ${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function playerAttack(vats) {
  const e = state.enemy;
  const p = P();
  if (!e || e.defeated || p.dead) return;
  if (vats) {
    if (p.ap < VATS_AP) return fail(`V.A.T.S. needs ${VATS_AP} AP.`);
    p.ap -= VATS_AP;
  }

  const hit = vats || chance(hitChance() / 100);
  const crit = hit && chance((critChance() * (vats ? 2 : 1) + (vats ? 10 : 0)) / 100);
  let dmg = 0;
  if (hit) {
    dmg = Math.round(playerDamage() * (rand(85, 115) / 100) * (crit ? 1.75 : 1) * (vats ? 1.25 : 1));
  }
  const allies = activeAllies();
  const allyDmg = allies.reduce((n, a) => n + Math.round(a.damage * (rand(85, 115) / 100)), 0);
  const total = dmg + allyDmg;
  const names = allies.map((a) => a.name);

  let msg;
  if (hit) {
    msg = `${vats ? "[V.A.T.S.] " : ""}${crit ? "CRITICAL! " : ""}${partyNames(names)} deal ${total} damage!`;
  } else if (names.length) {
    msg = `You miss, but ${names.join(", ")} deal${names.length === 1 ? "s" : ""} ${allyDmg} damage.`;
  } else {
    msg = "You miss!";
  }
  feed(msg, crit ? "crit" : hit ? "good" : "muted");
  log(msg, "combat");
  Sound.play(crit ? "crit" : hit || allyDmg ? "attack" : "miss");

  e.hp = Math.max(0, e.hp - total);
  if (e.hp <= 0) return winFight();

  enemyTurn();
  if (!p.dead && hasPerk("medic") && p.hp < effMaxHp()) {
    p.hp = Math.min(effMaxHp(), p.hp + 2);
    feed("Your medic patches you up (+2 HP).", "good");
  }
}

function enemyTurn() {
  const e = state.enemy;
  const p = P();
  if (!e || e.defeated || p.dead) return;
  const raw = e.dmg * (rand(85, 115) / 100);
  const allies = activeAllies();
  const tanks = allies.filter((a) => ALLIES[a.key].perk === "tank");
  let target = null;
  if (tanks.length && chance(0.5)) target = pick(tanks);
  else if (allies.length && chance(0.2)) target = pick(allies);

  if (target) {
    const isTank = ALLIES[target.key].perk === "tank";
    const taken = Math.max(1, Math.round(raw * (isTank ? 0.5 : 1)));
    target.hp = Math.max(0, target.hp - taken);
    feed(`${e.name} hits ${target.name} for ${taken}.`, "warn");
    if (target.hp === 0) {
      feed(`${target.name} is down!`, "crit");
      log(`${target.name} was downed. Heal them or rest at your C.A.M.P.`, "warn");
    }
    return;
  }

  if (chance(dodgeChance() / 100)) {
    feed(`You dodge the ${e.name}'s attack!`, "good");
    return;
  }
  const dr = playerDR();
  const taken = Math.max(1, Math.round(raw * (1 - dr / (dr + 25))));
  p.hp = Math.max(0, p.hp - taken);
  let msg = `${e.name} hits you for ${taken}.`;
  if (e.rads) msg += ` (+${addRads(e.rads)} rads)`;
  feed(msg, "bad");
  log(msg, "combat");
  Sound.play("hurt");
  $("pipboy-frame").classList.remove("shake");
  void $("pipboy-frame").offsetWidth;
  $("pipboy-frame").classList.add("shake");
  if (p.hp <= 0) die();
}

function winFight() {
  const e = state.enemy;
  const p = P();
  const d = ENEMIES[e.key];
  e.defeated = true;
  e.hp = 0;
  p.kills++;
  let caps = rand(d.caps[0], d.caps[1]) + rand(2, 6);
  if (e.legendary) caps *= 2;
  if (state.events.capsFrenzyActive) caps *= 2;
  p.caps += caps;
  e.loot = rollLoot(e);
  feed(`You defeated the ${e.name} and gained ${caps} caps!`, "good");
  log(`Defeated ${e.name}. +${caps} caps.`, "loot");
  addXP(d.xp * (1 + 0.1 * (e.level - 1)) * (e.legendary ? 2 : 1));
  Sound.play("loot");
}

function lootEnemy() {
  const e = state.enemy;
  if (!e || !e.defeated) return;
  if (!e.loot.length) {
    feed("Nothing left to loot.", "muted");
  } else {
    e.loot.forEach((l) => {
      if (l.key === "vault_map" && hasVaultMap()) return;
      addItem(P().inventory, l.key, l.qty, l.rarity);
      if (l.key === "vault_map") announceVaultMap();
      const rTag = l.rarity && l.rarity !== "Common" && ["weapon", "armor", "key"].includes(ITEMS[l.key].type) ? ` [${l.rarity}]` : "";
      log(`Looted ${ITEMS[l.key].name}${rTag}${l.qty > 1 ? ` ×${l.qty}` : ""}.`, "loot");
    });
    feed("You loot the remains.", "good");
    Sound.play("loot");
  }
  state.enemy = null;
}

function leaveCorpse() {
  const e = state.enemy;
  if (!e || !e.defeated) return;
  feed("You leave the corpse behind.", "muted");
  log(`Left the remains of ${e.name}.`);
  state.enemy = null;
}

function flee() {
  const e = state.enemy;
  if (!e) return;
  if (e.defeated) return leaveCorpse();
  if (chance(fleeChance() / 100)) {
    feed("You escape!", "good");
    log(`Fled from ${e.name}.`, "combat");
    state.enemy = null;
  } else {
    feed("Failed to escape!", "bad");
    log("Failed to flee.", "combat");
    enemyTurn();
  }
}

function hunt() {
  const p = P();
  if (p.dead || state.enemy) return;
  if (inVault()) return fail("The vault is sealed tight. Nothing to fight in here.");
  if (p.ap < HUNT_AP) return fail(`Searching for trouble needs ${HUNT_AP} AP.`);
  p.ap -= HUNT_AP;
  spawnEnemy(pick(currentLoc().enemies), currentLoc());
}

function quickHeal() {
  const inv = P().inventory;
  const missing = effMaxHp() - P().hp;
  const options = ["stimpak", "super_stimpak"]
    .map((k) => inv.find((i) => i.key === k))
    .filter(Boolean);
  if (!options.length) return fail("No Stimpaks!");
  const choice = missing > 25 && options.find((i) => i.key === "super_stimpak") ? options.find((i) => i.key === "super_stimpak") : options[0];
  useItem(choice.uid);
}

function die() {
  const p = P();
  p.dead = true;
  p.hp = 0;
  state.enemy = null;
  feed("You died in the wastes...", "crit");
  log("GAME OVER — you died in the wastes.", "crit");
  Sound.play("death");
  showDeathModal();
}

function respawn() {
  const p = P();
  const lostCaps = Math.floor(p.caps * 0.1);
  p.caps -= lostCaps;
  let lostJunk = 0;
  p.inventory.filter((i) => def(i).type === "junk").forEach((i) => {
    const n = Math.floor(i.quantity / 2);
    if (n > 0) {
      removeFromStack(p.inventory, i, n);
      lostJunk += n;
    }
  });
  p.dead = false;
  p.allies.forEach((a) => { if (a.hp <= 0) a.hp = 1; });
  const dest = state.camp.deployed ? LOC[state.camp.locationId] : LOC.vault;
  arriveAt(dest, { noEncounter: true });
  p.hp = effMaxHp();
  p.ap = maxAp();
  log(`You wake up at ${dest.name}. Lost ${lostCaps} caps and ${lostJunk} junk.`, "warn");
  toast(`Respawned at ${dest.name}`, "info");
}

/* ---------------------------
   XP / LEVELING
--------------------------- */
function addXP(base) {
  const p = P();
  const amount = Math.max(1, Math.round(base * xpMult()));
  p.xp += amount;
  log(`+${amount} XP.`, "xp");
  let leveled = false;
  while (p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    p.statPoints++;
    leveled = true;
    log(`LEVEL UP! You reached level ${p.level}. +1 S.P.E.C.I.A.L. point.`, "xp");
  }
  if (leveled) {
    p.hp = effMaxHp();
    p.ap = maxAp();
    toast(`LEVEL UP! You are now level ${p.level}`, "good");
    Sound.play("levelup");
  }
}

function addStat(k) {
  const p = P();
  if (p.statPoints <= 0 || !(k in p.special) || p.special[k] >= STAT_CAP) return;
  p.special[k]++;
  p.statPoints--;
  if (k === "end") p.hp += 3;
  clampVitals();
  log(`${k.toUpperCase()} increased to ${p.special[k]}.`, "xp");
}

/* ---------------------------
   INVENTORY ACTIONS
--------------------------- */
function equipItem(inst) {
  const p = P();
  const type = def(inst).type;
  const current = getEquipped(type);
  if (current) unequipItem(current, true);
  let target = inst;
  if (inst.quantity > 1) {
    inst.quantity--;
    target = makeItem(inst.key, 1, inst.rarity);
    p.inventory.push(target);
  }
  target.equipped = true;
  state.ui.selectedUid = target.uid;
  clampVitals();
  log(`Equipped ${def(target).name}.`);
}

function unequipItem(inst, silent) {
  const p = P();
  inst.equipped = false;
  const stack = p.inventory.find((i) => i !== inst && i.key === inst.key && i.rarity === inst.rarity && !i.equipped);
  if (stack) {
    stack.quantity += inst.quantity;
    removeFromStack(p.inventory, inst, inst.quantity);
    if (state.ui.selectedUid === inst.uid) state.ui.selectedUid = stack.uid;
  }
  clampVitals();
  if (!silent) log(`Unequipped ${def(inst).name}.`);
}

function useItem(uid) {
  const p = P();
  const inst = findInv(uid);
  if (!inst || p.dead) return;
  const d = def(inst);

  if (d.type === "weapon" || d.type === "armor") {
    if (inst.equipped) unequipItem(inst);
    else equipItem(inst);
    return;
  }
  if (d.type === "junk") return fail("Junk can't be used. Scrap it, sell it, or craft with it.");
  if (d.type === "key") {
    if (inst.key === "vault_map") showVaultMapModal();
    return;
  }

  // consumable
  const onlyHeals = d.heal && !d.ap && !d.radHeal && !d.buff;
  if (onlyHeals && p.hp >= effMaxHp()) return fail("HP is already full.");
  const parts = [];
  if (d.radHeal) {
    const r = Math.min(p.rads, d.radHeal);
    p.rads -= r;
    if (r) parts.push(`-${r} rads`);
  }
  if (d.rads) parts.push(`+${addRads(d.rads)} rads`);
  if (d.heal) {
    const before = p.hp;
    p.hp = Math.min(effMaxHp(), p.hp + d.heal);
    parts.push(`+${p.hp - before} HP`);
  }
  if (d.ap) {
    const before = p.ap;
    p.ap = Math.min(maxAp(), p.ap + d.ap);
    parts.push(`+${p.ap - before} AP`);
  }
  if (d.buff) {
    p.buffs = p.buffs.filter((b) => b.id !== d.buff.id);
    p.buffs.push({ ...d.buff, expiresAt: Date.now() + d.buff.secs * 1000 });
    parts.push(`${d.buff.name} active`);
  }
  removeFromStack(p.inventory, inst, 1);
  if (!findInv(uid)) state.ui.selectedUid = null;
  clampVitals();
  const msg = `Used ${d.name}${parts.length ? ` (${parts.join(", ")})` : ""}.`;
  log(msg);
  feed(msg, "good");
  Sound.play("heal");
  // Using aid mid-fight gives the enemy an opening.
  if (enemyActive()) enemyTurn();
}

function dropItem(uid) {
  const inst = findInv(uid);
  if (!inst) return;
  if (inst.equipped) return fail("Unequip the item before dropping it.");
  if (def(inst).type === "key") return fail("You can't drop a key item.");
  removeFromStack(P().inventory, inst, 1);
  if (!findInv(uid)) state.ui.selectedUid = null;
  log(`Dropped ${def(inst).name}.`);
}

function scrapYield(inst) {
  const d = def(inst);
  const ri = rarityIndex(inst.rarity);
  if (d.type === "weapon") {
    const y = { steel: 2, scrap: 1 };
    if (d.energy) y.circuitry = 1;
    if (ri >= 2) y.adhesive = 1;
    if (d.value >= 200) y.steel += 2;
    return y;
  }
  if (d.type === "armor") {
    const y = /Power Armor/.test(d.name) ? { steel: 4, circuitry: 1 } : { cloth: 2, steel: 1 };
    if (ri >= 2) y.adhesive = 1;
    return y;
  }
  if (d.breakdown) return { ...d.breakdown };
  return null;
}

function yieldText(y) {
  return Object.entries(y).map(([k, n]) => `${ITEMS[k].name} ×${n}`).join(", ");
}

function scrapItem(uid) {
  const inst = findInv(uid);
  if (!inst) return;
  if (inst.equipped) return fail("Unequip the item before scrapping it.");
  const y = scrapYield(inst);
  if (!y) return fail("That can't be broken down.");
  removeFromStack(P().inventory, inst, 1);
  Object.entries(y).forEach(([k, n]) => addItem(P().inventory, k, n));
  if (!findInv(uid)) state.ui.selectedUid = null;
  log(`Scrapped ${def(inst).name} into ${yieldText(y)}.`, "craft");
  Sound.play("build");
}

function breakdownAllJunk() {
  const inv = P().inventory;
  const totals = {};
  let count = 0;
  inv.filter((i) => def(i).type === "junk" && def(i).breakdown).forEach((i) => {
    Object.entries(def(i).breakdown).forEach(([k, n]) => { totals[k] = (totals[k] || 0) + n * i.quantity; });
    count += i.quantity;
    removeFromStack(inv, i, i.quantity);
  });
  if (!count) return fail("No scrappable junk in your inventory.");
  Object.entries(totals).forEach(([k, n]) => addItem(inv, k, n));
  log(`Broke down ${plural(count, "junk item")} into ${yieldText(totals)}.`, "craft");
  Sound.play("build");
}

/* ---------------------------
   SHOP
--------------------------- */
function buyItem(idx) {
  const p = P();
  const v = state.local && state.local.vendor && state.local.vendor[idx];
  if (!v || v.stock <= 0) return;
  const price = buyPrice(v.key, v.rarity);
  if (p.caps < price) return fail("Not enough caps.");
  p.caps -= price;
  v.stock--;
  addItem(p.inventory, v.key, 1, v.rarity);
  log(`Bought ${ITEMS[v.key].name} for ${price} caps.`, "loot");
  Sound.play("loot");
}

function sellItem(uid) {
  const inst = findInv(uid);
  if (!inst || !state.local || !state.local.vendor) return;
  if (inst.equipped) return fail("Unequip the item before selling it.");
  if (def(inst).type === "key") return fail("This isn't for sale.");
  const price = sellPrice(inst);
  P().caps += price;
  removeFromStack(P().inventory, inst, 1);
  if (!findInv(uid)) state.ui.selectedUid = null;
  log(`Sold ${def(inst).name} for ${price} caps.`, "loot");
  Sound.play("loot");
}

/* ---------------------------
   SCAVENGE / RECRUIT
--------------------------- */
function scavenge() {
  const p = P();
  const L = state.local;
  const loc = currentLoc();
  if (p.dead) return;
  if (enemyActive()) return fail("Deal with the hostile first.");
  if (loc.vault) return fail("Search the vault's rooms instead.");
  if (L.scavenges >= SCAVENGE_LIMIT) return fail("This area has been picked clean. Try somewhere else.");
  if (p.ap < SCAVENGE_AP) return fail(`Scavenging needs ${SCAVENGE_AP} AP.`);
  p.ap -= SCAVENGE_AP;
  L.scavenges++;
  const finds = rand(1, 2) + (hasPerk("scavenger") ? 1 : 0);
  const got = {};
  for (let i = 0; i < finds; i++) {
    const key = weightedPick(SCAVENGE_TABLE[loc.danger]);
    const qty = ITEMS[key].material ? rand(1, 2) : 1;
    got[key] = (got[key] || 0) + qty;
  }
  Object.entries(got).forEach(([k, n]) => addItem(p.inventory, k, n));
  log(`Scavenged: ${yieldText(got)}.`, "loot");
  toast(`Found ${yieldText(got)}`, "good");
  Sound.play("loot");
  if (maybeVaultMapDrop()) {
    addItem(p.inventory, "vault_map", 1, "Legendary");
    announceVaultMap();
  }
  if (loc.rads) addRads(Math.ceil(loc.rads / 2));
  const ambush = { Low: 0.08, Medium: 0.15, High: 0.25 }[loc.danger];
  if (chance(ambush)) {
    log("Your rummaging attracted attention!", "warn");
    spawnEnemy(pick(loc.enemies), loc);
  }
}

function recruitLocal() {
  const p = P();
  const key = state.local && state.local.allyKey;
  if (!key) return;
  if (!canRecruitKey(key)) return fail("They're already with you.");
  if (party().length >= maxParty()) return fail(`Party full (${maxParty()}). Station an ally at your C.A.M.P. or level up.`);
  const cost = allyCost(key);
  if (p.caps < cost) return fail(`Not enough caps to hire ${ALLIES[key].name}.`);
  p.caps -= cost;
  p.allies.push(makeAlly(key, cost));
  state.local.allyKey = null;
  log(`${ALLIES[key].name} (${ALLIES[key].rarity}) recruited at ${currentLoc().name}.`, "good");
  toast(`${ALLIES[key].name} has joined your party!`, "good");
  Sound.play("recruit");
}

/* ---------------------------
   ALLY ACTIONS
--------------------------- */
const findAlly = (uid) => P().allies.find((a) => a.uid === uid);

function allyHeal(uid) {
  const a = findAlly(uid);
  if (!a) return;
  if (a.hp >= a.maxHp) return fail(`${a.name} is already at full health.`);
  const inv = P().inventory;
  const stim = inv.find((i) => i.key === "stimpak") || inv.find((i) => i.key === "super_stimpak");
  if (!stim) return fail("You need a Stimpak.");
  const heal = def(stim).heal * 2;
  const wasDown = a.hp <= 0;
  a.hp = Math.min(a.maxHp, a.hp + heal);
  removeFromStack(inv, stim, 1);
  log(`Used ${def(stim).name} on ${a.name}${wasDown ? " — back on their feet!" : "."}`, "good");
  Sound.play("heal");
}

function allySend(uid) {
  const a = findAlly(uid);
  if (!a || a.stationed) return;
  if (!state.camp.deployed) return fail("Deploy a C.A.M.P. first.");
  if (stationed().length >= campHousing()) return fail("No free housing. Build a Bunkhouse.");
  a.stationed = true;
  log(`${a.name} heads to your C.A.M.P. at ${LOC[state.camp.locationId].name}.`);
}

function allyRecall(uid) {
  const a = findAlly(uid);
  if (!a || !a.stationed) return;
  if (!atCamp()) return fail("You need to be at your C.A.M.P. to pick them up.");
  if (party().length >= maxParty()) return fail(`Party full (${maxParty()}).`);
  a.stationed = false;
  log(`${a.name} rejoins your party.`, "good");
}

function allyDismiss(uid) {
  const a = findAlly(uid);
  if (!a) return;
  const refund = Math.floor((a.cost || 50) * 0.5);
  showModal({
    title: "DISMISS ALLY?",
    body: `<p>Send <strong>${esc(a.name)}</strong> on their way? You'll receive <strong>${refund} caps</strong> back.</p>`,
    buttons: [
      { label: "DISMISS", cls: "btn-danger", fn: () => {
        P().allies = P().allies.filter((x) => x.uid !== uid);
        P().caps += refund;
        log(`You dismissed ${a.name} and received ${refund} caps.`);
      } },
      { label: "CANCEL" }
    ]
  });
}

/* ---------------------------
   C.A.M.P. ACTIONS
--------------------------- */
function deployCamp() {
  const p = P();
  const c = state.camp;
  const loc = currentLoc();
  if (loc.nocamp) return fail(`${loc.name} doesn't allow C.A.M.P.s.`);
  if (enemyActive()) return fail("Not while you're being attacked!");
  if (c.deployed && c.locationId === loc.id) return;
  const cost = c.deployed ? CAMP_DEPLOY_COST : 0;
  const doIt = () => {
    if (p.caps < cost) return fail(`Moving your C.A.M.P. costs ${cost} caps.`);
    p.caps -= cost;
    const first = !c.deployed;
    c.deployed = true;
    c.locationId = loc.id;
    if (first) c.lastTick = Date.now();
    log(`C.A.M.P. ${first ? "deployed" : "moved"} at ${loc.name}.`, "good");
    toast(`C.A.M.P. ${first ? "deployed" : "moved"}!`, "good");
    Sound.play("build");
  };
  if (!c.deployed) return doIt();
  showModal({
    title: "MOVE C.A.M.P.?",
    body: `<p>Move your C.A.M.P. from <strong>${esc(LOC[c.locationId].name)}</strong> to <strong>${esc(loc.name)}</strong> for <strong>${cost} caps</strong>?</p><p class="muted">Structures, stash and residents move with it.</p>`,
    buttons: [{ label: `MOVE (${cost} CAPS)`, cls: "btn-primary", fn: doIt }, { label: "CANCEL" }]
  });
}

function fastTravelCamp() {
  const p = P();
  const c = state.camp;
  if (!c.deployed) return fail("You haven't deployed a C.A.M.P.");
  if (atCamp()) return fail("You're already at your C.A.M.P.");
  if (enemyActive()) return fail("You can't fast travel during combat.");
  if (p.caps < CAMP_FAST_TRAVEL_COST) return fail(`Fast travel costs ${CAMP_FAST_TRAVEL_COST} caps.`);
  p.caps -= CAMP_FAST_TRAVEL_COST;
  Sound.play("travel");
  arriveAt(LOC[c.locationId]);
}

function restAtCamp() {
  const p = P();
  if (!atCamp()) return fail("You need to be at your C.A.M.P.");
  if (!sCount("bed")) return fail("Build a Bed first.");
  if (enemyActive()) return fail("You can't rest with enemies nearby!");
  p.hp = effMaxHp();
  p.ap = maxAp();
  party().forEach((a) => { a.hp = a.maxHp; });
  log("You rest at your C.A.M.P. HP, AP and your party are fully restored.", "good");
  toast("Well rested!", "good");
  Sound.play("heal");
}

function build(key) {
  const s = STRUCTURES[key];
  if (!s) return;
  if (!atCamp()) return fail("You need to be at your C.A.M.P. to build.");
  if (sCount(key) >= s.max) return fail(`You can only build ${s.max} ${s.name}${s.max > 1 ? "s" : ""}.`);
  if (!canAfford(s.cost, true)) return fail("Missing materials.");
  payCost(s.cost, true);
  state.camp.structures[key] = sCount(key) + 1;
  log(`Built ${s.name}.`, "craft");
  Sound.play("build");
}

function dismantle(key) {
  const s = STRUCTURES[key];
  if (!s || !sCount(key)) return;
  if (!atCamp()) return fail("You need to be at your C.A.M.P.");
  if (key === "stash" && unitCount(state.camp.stash) > campStorage() - s.storage) return fail("Empty some stash space first.");
  if (key === "bunk" && stationed().length > campHousing() - s.housing) return fail("Recall a resident first.");
  state.camp.structures[key]--;
  const refund = {};
  Object.entries(s.cost).forEach(([k, n]) => {
    const r = Math.floor(n / 2);
    if (r > 0) {
      refund[k] = r;
      addItem(P().inventory, k, r);
    }
  });
  log(`Dismantled ${s.name}${Object.keys(refund).length ? `, recovered ${yieldText(refund)}` : ""}.`, "craft");
  Sound.play("build");
}

function storeItem(uid, all) {
  if (!atCamp()) return fail("You need to be at your C.A.M.P.");
  const inst = findInv(uid);
  if (!inst) return;
  if (inst.equipped) return fail("Unequip it first.");
  const free = campStorage() - unitCount(state.camp.stash);
  if (free <= 0) return fail("Stash is full. Build another Stash Box.");
  const qty = all ? Math.min(inst.quantity, free) : 1;
  addItem(state.camp.stash, inst.key, qty, inst.rarity);
  removeFromStack(P().inventory, inst, qty);
  if (!findInv(uid)) state.ui.selectedUid = null;
}

function takeItem(uid, all) {
  if (!atCamp()) return fail("You need to be at your C.A.M.P.");
  const stash = state.camp.stash;
  const inst = stash.find((i) => i.uid === uid);
  if (!inst) return;
  const qty = all ? inst.quantity : 1;
  addItem(P().inventory, inst.key, qty, inst.rarity);
  removeFromStack(stash, inst, qty);
}

function storeAllJunk() {
  if (!atCamp()) return fail("You need to be at your C.A.M.P.");
  let free = campStorage() - unitCount(state.camp.stash);
  let moved = 0;
  P().inventory.filter((i) => def(i).type === "junk").forEach((i) => {
    if (free <= 0) return;
    const n = Math.min(i.quantity, free);
    addItem(state.camp.stash, i.key, n, i.rarity);
    removeFromStack(P().inventory, i, n);
    free -= n;
    moved += n;
  });
  if (!moved) return fail(free <= 0 ? "Stash is full." : "No junk to store.");
  log(`Stored ${plural(moved, "junk item")} in your stash.`);
}

function craft(id) {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) return;
  if (r.station !== "field") {
    if (!atCamp()) return fail("You need to be at your C.A.M.P.");
    if (!sCount(r.station)) return fail(`Build a ${STRUCTURES[r.station].name} first.`);
  }
  if (r.special === "breakdown") return breakdownAllJunk();
  if (r.special === "upgrade") return upgradeGear(r.slot);
  const useStash = atCamp();
  if (!canAfford(r.cost, useStash)) return fail("Missing materials.");
  payCost(r.cost, useStash);
  const d = ITEMS[r.out];
  let qty = r.qty;
  if (d.type === "consumable" && chance(Math.max(0, (stat("int") - 5) * 0.04))) {
    qty++;
    toast("INT bonus: crafted an extra!", "good");
  }
  addItem(P().inventory, r.out, qty);
  log(`Crafted ${d.name}${qty > 1 ? ` ×${qty}` : ""}.`, "craft");
  Sound.play("build");
}

function upgradeGear(slot) {
  const eq = getEquipped(slot);
  if (!eq) return fail(`Equip ${slot === "weapon" ? "a weapon" : "armor"} to upgrade it.`);
  if (eq.rarity === "Legendary") return fail("Already Legendary.");
  const cost = UPGRADE_COSTS[slot][eq.rarity];
  if (!canAfford(cost, true)) return fail("Missing materials.");
  payCost(cost, true);
  eq.rarity = RARITIES[rarityIndex(eq.rarity) + 1];
  clampVitals();
  log(`Upgraded ${def(eq).name} to ${eq.rarity}!`, "craft");
  toast(`${def(eq).name} is now ${eq.rarity}!`, "good");
  Sound.play("levelup");
}

function recruitWanderer() {
  const c = state.camp;
  const key = c.wanderer;
  if (!key) return;
  if (!atCamp()) return fail("Meet them at your C.A.M.P.");
  const cost = Math.max(1, Math.round(ALLIES[key].cost * 0.75 * recruitMult()));
  if (P().caps < cost) return fail("Not enough caps.");
  const ally = makeAlly(key, cost);
  if (stationed().length < campHousing()) ally.stationed = true;
  else if (party().length >= maxParty()) return fail("No room in your party or housing.");
  P().caps -= cost;
  P().allies.push(ally);
  c.wanderer = null;
  log(`${ally.name} joined you${ally.stationed ? " and settled in at your C.A.M.P." : "."}`, "good");
  Sound.play("recruit");
}

function campTick(offline) {
  const c = state.camp;
  const produced = {};
  const add = (k, n = 1) => { produced[k] = (produced[k] || 0) + n; };
  const pw = poweredCounts();
  for (let i = 0; i < sCount("crops"); i++) if (chance(0.5)) add(chance(0.6) ? "tato" : "mutfruit");
  for (let i = 0; i < pw.water; i++) add("purified_water");
  if (pw.extractor) add(weightedPick(EXTRACTOR_TABLE), rand(1, 2));
  if (pw.nukaMachine) {
    if (chance(0.03)) add("nuka_quantum");
    else if (chance(0.3)) add("nuka_cola");
  }
  stationed().forEach((a) => {
    if (a.hp < a.maxHp) a.hp = Math.min(a.maxHp, a.hp + Math.ceil(a.maxHp * 0.25));
    if (chance(0.5)) add(weightedPick(RESIDENT_TABLE));
  });

  let free = campStorage() - unitCount(c.stash);
  let lost = 0;
  Object.entries(produced).forEach(([k, n]) => {
    const put = Math.min(n, Math.max(0, free));
    if (put > 0) addItem(c.stash, k, put);
    free -= put;
    lost += n - put;
  });

  if (!offline) {
    c.lastProduction = Object.entries(produced).map(([key, qty]) => ({ key, qty }));
    c.lostLast = lost;
    if (pw.beacon && !c.wanderer && chance(0.2)) {
      c.wanderer = pick(WANDERER_POOL);
      log(`A ${ALLIES[c.wanderer].name} answered your Recruitment Beacon and waits at your C.A.M.P.`, "event");
      toast(`Wanderer at your C.A.M.P.: ${ALLIES[c.wanderer].name}`, "event");
    }
    if (!atCamp() && chance(0.06)) resolveRaid();
  }
  return { produced, lost };
}

function resolveRaid() {
  const c = state.camp;
  const attack = 10 + P().level * 5 + rand(0, 15);
  const defense = campDefense();
  const where = LOC[c.locationId].name;
  if (defense >= attack) {
    const salvage = Math.min(rand(2, 5), Math.max(0, campStorage() - unitCount(c.stash)));
    if (salvage > 0) addItem(c.stash, "scrap", salvage);
    log(`RAID at your C.A.M.P. (${where})! Defenses held (${defense} vs ${attack}).${salvage ? ` Salvaged ${salvage} scrap from the attackers.` : ""}`, "good");
    toast("C.A.M.P. raid repelled!", "good");
    return;
  }
  let stolen = 0;
  c.stash.filter((i) => def(i).type === "junk").forEach((i) => {
    const n = Math.ceil(i.quantity * 0.25);
    removeFromStack(c.stash, i, n);
    stolen += n;
  });
  stationed().forEach((a) => { a.hp = Math.max(0, a.hp - rand(5, 15)); });
  log(`RAID at your C.A.M.P. (${where})! Defenses failed (${defense} vs ${attack}). Raiders stole ${plural(stolen, "junk item")}. Build turrets or station allies.`, "crit");
  toast("Your C.A.M.P. was raided!", "bad");
  Sound.play("alert");
}

function catchUpCamp() {
  const c = state.camp;
  const now = Date.now();
  if (!c.deployed || !c.lastTick) {
    c.lastTick = now;
    return;
  }
  const elapsed = Math.max(0, now - c.lastTick);
  const ticks = Math.min(Math.floor(elapsed / CAMP_TICK_MS), 60);
  if (ticks <= 0) return;
  const totals = {};
  let lost = 0;
  for (let i = 0; i < ticks; i++) {
    const r = campTick(true);
    Object.entries(r.produced).forEach(([k, n]) => { totals[k] = (totals[k] || 0) + n; });
    lost += r.lost;
  }
  c.lastTick = ticks >= 60 ? now : c.lastTick + ticks * CAMP_TICK_MS;
  if (Object.keys(totals).length) {
    log(`While you were away, your C.A.M.P. produced: ${yieldText(totals)}${lost ? ` (${lost} lost — stash full)` : ""}.`, "good");
  }
}

/* ---------------------------
   GLOBAL EVENTS
--------------------------- */
function tickCapsFrenzy() {
  const ev = state.events;
  if (!ev.capsFrenzyActive && rand(1, 600) === 260) {
    ev.capsFrenzyActive = true;
    ev.capsFrenzyTimer = 100;
    log("EVENT: Caps Frenzy has begun! Caps drops are doubled for 100 seconds.", "event");
    toast("EVENT: CAPS FRENZY!", "event");
    return true;
  }
  if (ev.capsFrenzyActive) {
    ev.capsFrenzyTimer--;
    if (ev.capsFrenzyTimer <= 0) {
      ev.capsFrenzyActive = false;
      log("EVENT: Caps Frenzy has ended.", "event");
      return true;
    }
  }
  return false;
}

/* ---------------------------
   SAVE / LOAD
--------------------------- */
/*
  LocalStorage layout
  - wastelandSave          : autosave (same key/format as before; written after
                             every action and every 10s)
  - wastelandSave_slot1..3 : manual save slots (same format + savedAt)
  - wastelandPrefs         : device preferences (sound, theme) used by the menu
*/
const SLOT_COUNT = 3;
const PREFS_KEY = "wastelandPrefs";
const slotKey = (n) => `${SAVE_KEY}_slot${n}`;

const Store = {
  available: (() => {
    try {
      const k = "__wasteland_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })(),
  get(key) {
    if (!this.available) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`Unreadable save data in ${key}:`, e);
      return null;
    }
  },
  set(key, value) {
    if (!this.available) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Failed to write ${key}:`, e);
      return false;
    }
  },
  remove(key) {
    if (!this.available) return;
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
};

const prefs = Object.assign({ muted: false, theme: "green" }, Store.get(PREFS_KEY) || {});
function savePrefs() {
  // In game, the running game's settings are the source of truth;
  // on the start-up menu, prefs are edited directly.
  if (state && booted) {
    prefs.muted = state.settings.muted;
    prefs.theme = state.settings.theme;
  }
  Store.set(PREFS_KEY, prefs);
}

function snapshot() {
  return { ...state, feed: [], savedAt: Date.now() };
}

function saveGame() {
  if (!state) return;
  Store.set(SAVE_KEY, snapshot());
}

/* Shared by autosave, slots and imported files */
function loadFromObject(saved, label) {
  if (!saved || typeof saved !== "object" || !saved.player) return false;
  const previous = state;
  try {
    if (saved.version === SAVE_VERSION) {
      state = normalizeState(saved);
      log(`Welcome back, wanderer.${label ? ` (Loaded ${label})` : ""}`, "info");
    } else {
      state = migrateLegacySave(saved);
      log("Loaded saved game (converted to the new Pip-Boy format).", "warn");
    }
    return true;
  } catch (e) {
    console.error("Save corrupted:", e);
    state = previous;
    return false;
  }
}

function loadGame() {
  return loadFromObject(Store.get(SAVE_KEY));
}

/* Short description of any save (v2 or legacy) for menus */
function saveMeta(saved) {
  if (!saved || !saved.player) return null;
  const p = saved.player;
  const loc = LOC[p.locationId] ? LOC[p.locationId].name : p.location || "Unknown";
  return {
    name: p.name || "Vault Wanderer",
    level: p.level || 1,
    location: loc,
    caps: Math.floor(p.caps || 0),
    dead: !!p.dead,
    savedAt: saved.savedAt || null
  };
}

function formatSavedAt(ts) {
  if (!ts) return "unknown time";
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function metaLine(meta) {
  return `${esc(meta.name)} · LVL ${meta.level} · ${esc(meta.location)} · ${meta.caps}c${meta.dead ? " · DEAD" : ""}`;
}

function saveToSlot(n) {
  if (!state) return;
  if (Store.set(slotKey(n), snapshot())) {
    log(`Game saved to slot ${n}.`, "good");
    toast(`Saved to slot ${n}`, "good");
    Sound.play("build");
  } else {
    fail("Couldn't save — browser storage is unavailable or full.");
  }
}

function deleteSlot(n) {
  Store.remove(slotKey(n));
}

/* Start a loaded/new game: settle camp time, autosave, enter play */
function enterGame() {
  catchUpCamp();
  saveGame();
  savePrefs();
}

function exportSave() {
  if (!state) return;
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = P().name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `wasteland-${safe}-lvl${P().level}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  log("Save exported to a file.", "good");
}

let importDone = null;
function importSave(done) {
  importDone = done;
  const input = $("import-input");
  input.value = "";
  input.click();
}

$("import-input").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data = null;
    try { data = JSON.parse(reader.result); } catch (err) { data = null; }
    const ok = !!saveMeta(data) && loadFromObject(data, "imported file");
    if (importDone) importDone(ok);
    importDone = null;
  };
  reader.readAsText(file);
});

function normalizeState(saved) {
  const base = createBaseState();
  state = base;
  ["player", "events", "camp", "settings", "ui", "vaults", "visited"].forEach((k) => {
    if (saved[k] && typeof saved[k] === "object") Object.assign(base[k], saved[k]);
  });
  base.player.special = { ...createBaseState().player.special, ...(saved.player && saved.player.special) };  base.nextUid = saved.nextUid || 1;
  base.log = Array.isArray(saved.log) ? saved.log.slice(-MAX_LOG) : [];
  const p = base.player;
  p.inventory = (p.inventory || []).filter((i) => i && ITEMS[i.key] && i.quantity > 0);
  p.allies = (p.allies || []).filter((a) => a && ALLIES[a.key]);
  p.buffs = (p.buffs || []).filter((b) => b && b.expiresAt > Date.now());
  base.camp.stash = (base.camp.stash || []).filter((i) => i && ITEMS[i.key] && i.quantity > 0);
  base.camp.structures = Object.fromEntries(Object.entries(base.camp.structures || {}).filter(([k]) => STRUCTURES[k]));
  if (base.camp.wanderer && !ALLIES[base.camp.wanderer]) base.camp.wanderer = null;
  if (base.camp.deployed && !LOC[base.camp.locationId]) base.camp.deployed = false;
  if (!LOC[p.locationId]) p.locationId = "vault";
  base.vaults = Object.fromEntries(Object.entries(base.vaults || {}).filter(([id, v]) => LOC[id] && LOC[id].vault && v && typeof v === "object")
    .map(([id, v]) => [id, { discoveredAt: v.discoveredAt || Date.now(), rooms: v.rooms && typeof v.rooms === "object" ? v.rooms : {} }]));
  markStartingKnowledge(base);
  if (!MAP_ZOOMS.includes(base.ui.mapZoom)) base.ui.mapZoom = 1;
  if (!THEMES.includes(base.settings.theme)) base.settings.theme = "green";
  // Only one equipped item per slot
  ["weapon", "armor"].forEach((type) => {
    p.inventory.filter((i) => i.equipped && ITEMS[i.key].type === type).slice(1).forEach((i) => { i.equipped = false; });
  });
  const maxUid = Math.max(0, ...p.inventory.map((i) => i.uid), ...p.allies.map((a) => a.uid), ...base.camp.stash.map((i) => i.uid));
  base.nextUid = Math.max(base.nextUid, maxUid + 1);
  base.enemy = saved.enemy && ENEMIES[saved.enemy.key] ? saved.enemy : null;
  base.local = saved.local && saved.local.locationId === p.locationId ? saved.local : rollLocal(LOC[p.locationId]);
  if (base.local.vendor) base.local.vendor = base.local.vendor.filter((v) => ITEMS[v.key]);
  if (base.local.allyKey && !ALLIES[base.local.allyKey]) base.local.allyKey = null;
  if (!LOC[base.ui.mapSelected]) base.ui.mapSelected = p.locationId;
  if (!REGIONS.includes(base.ui.mapRegion)) base.ui.mapRegion = LOC[p.locationId].region;
  clampVitals();
  return base;
}

/* Older saves: where you are (and your C.A.M.P.) count as visited/discovered */
function markStartingKnowledge(s) {
  [s.player.locationId, s.camp.deployed ? s.camp.locationId : null].forEach((id) => {
    if (!id || !LOC[id]) return;
    s.visited[id] = true;
    if (LOC[id].vault && !s.vaults[id]) s.vaults[id] = { discoveredAt: Date.now(), rooms: {} };
  });
}

/* Pre-v2 saves stored items/allies by display name and the location by name */
function migrateLegacySave(old) {
  const s = createBaseState();
  state = s;
  const op = old.player || {};
  const p = s.player;
  p.name = op.name || p.name;
  p.level = Math.max(1, Math.floor(op.level || 1));
  p.xp = Math.max(0, Math.floor(op.xp || 0));
  p.caps = Math.max(0, Math.floor(op.caps != null ? op.caps : 50));
  if (op.stats) ["str", "per", "end", "lck"].forEach((k) => {
    if (typeof op.stats[k] === "number") p.special[k] = clamp(Math.round(op.stats[k]), 1, STAT_CAP);
  });
  p.statPoints = p.level - 1;
  const loc = LOCATIONS.find((l) => l.name === op.location);
  p.locationId = loc ? loc.id : "vault";

  (op.inventory || []).forEach((it) => {
    if (!it || !it.name) return;
    const key = LEGACY_ITEM_NAMES[it.name] || Object.keys(ITEMS).find((k) => ITEMS[k].name === it.name);
    if (!key) return;
    const qty = Math.max(1, Math.floor(it.quantity || 1));
    const rarity = RARITIES.includes(it.rarity) ? it.rarity : ITEMS[key].rarity || "Common";
    const type = ITEMS[key].type;
    if (it.equipped && (type === "weapon" || type === "armor") && !p.inventory.some((i) => i.equipped && ITEMS[i.key].type === type)) {
      const inst = makeItem(key, 1, rarity);
      inst.equipped = true;
      p.inventory.push(inst);
      if (qty > 1) addItem(p.inventory, key, qty - 1, rarity);
    } else {
      addItem(p.inventory, key, qty, rarity);
    }
  });

  (op.allies || []).forEach((a) => {
    const key = a && Object.keys(ALLIES).find((k) => ALLIES[k].name === a.name);
    if (key) p.allies.push(makeAlly(key, a.cost));
  });

  if (old.events) {
    s.events.capsFrenzyActive = !!old.events.capsFrenzyActive;
    s.events.capsFrenzyTimer = old.events.capsFrenzyTimer || 0;
  }
  p.hp = op.hp > 0 ? Math.min(Math.round(op.hp), effMaxHp()) : effMaxHp();
  p.ap = maxAp();
  s.ui.mapRegion = LOC[p.locationId].region;
  s.ui.mapSelected = p.locationId;
  s.local = rollLocal(LOC[p.locationId]);
  markStartingKnowledge(s);
  clampVitals();
  return s;
}

/* ============================================================
   RENDERING
============================================================ */
const bar = (value, max, cls = "") =>
  `<div class="bar ${cls}"><div class="fill" style="width:${max > 0 ? clamp((value / max) * 100, 0, 100) : 0}%"></div></div>`;
const dangerTag = (d) => `<span class="tag tag-${d.toLowerCase()}">${d.toUpperCase()}</span>`;
const rarityTag = (r) => `<span class="tag rarity-tag rarity-${r.toLowerCase()}">${r.toUpperCase()}</span>`;
const kv = (k, v) => `<div class="kv-row"><span>${k}</span><span>${v}</span></div>`;
const btn = (label, action, arg, { cls = "", disabled = false, title = "" } = {}) =>
  `<button class="${cls}" data-action="${action}"${arg != null ? ` data-arg="${esc(arg)}"` : ""}${disabled ? " disabled" : ""}${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;

function render() {
  if (!state) return;
  document.documentElement.dataset.theme = state.settings.theme;
  document.querySelectorAll(".tab-button").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.ui.tab));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.toggle("hidden", c.id !== `tab-${state.ui.tab}`));
  renderActive();
  updateHud();
}

function renderActive() {
  const renderers = {
    status: renderStatus, map: renderMap, inventory: renderInventory, combat: renderCombat,
    camp: renderCamp, allies: renderAllies, log: renderLog
  };
  (renderers[state.ui.tab] || renderStatus)();
  updateCountdowns();
}

function updateHud() {
  const p = P();
  const max = maxHp();
  const eff = effMaxHp();
  $("hud-hp-fill").style.width = `${clamp((p.hp / max) * 100, 0, 100)}%`;
  $("hud-rad-fill").style.width = `${clamp(((max - eff) / max) * 100, 0, 100)}%`;
  $("hud-hp-text").textContent = `${p.hp}/${eff}`;
  $("hud-ap-fill").style.width = `${clamp((p.ap / maxAp()) * 100, 0, 100)}%`;
  $("hud-ap-text").textContent = `${p.ap}/${maxAp()}`;
  $("hud-level").textContent = p.level;
  $("hud-xp-fill").style.width = `${clamp((p.xp / xpToNext(p.level)) * 100, 0, 100)}%`;
  $("hud-caps").textContent = p.caps;
  $("hud-rads").textContent = p.rads;
  $("hud-rads-wrap").classList.toggle("hidden", p.rads <= 0);
  $("hud-hp").classList.toggle("low", p.hp <= eff * 0.25);
  const loc = currentLoc();
  $("header-location").innerHTML = `${esc(loc.name)} <span class="muted">· ${esc(loc.region)}</span>${atCamp() ? ' <span class="tag tag-camp">C.A.M.P.</span>' : ""}`;
  $("sound-toggle").textContent = state.settings.muted ? "♪ OFF" : "♪ ON";
  const badge = (tab, on) => document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.toggle("alert", !!on);
  badge("combat", enemyActive());
  badge("status", p.statPoints > 0);
  badge("camp", state.camp.wanderer);
  badge("allies", p.allies.some((a) => !a.stationed && a.hp <= 0));
  $("frenzy-banner").classList.toggle("hidden", !state.events.capsFrenzyActive);
  $("frenzy-banner").textContent = `★ CAPS FRENZY ×2 — ${state.events.capsFrenzyTimer}s ★`;
}

function updateCountdowns() {
  const now = Date.now();
  document.querySelectorAll("[data-until]").forEach((el) => {
    const left = Math.max(0, Math.ceil((Number(el.dataset.until) - now) / 1000));
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  });
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const date = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.2287`;
  $("header-time").innerHTML = `${hh}<span class="blink">:</span>${mm} <span class="muted">${date}</span>`;
}

/* ---------------------------
   STATUS TAB
--------------------------- */
function renderStatus() {
  const p = P();
  const loc = currentLoc();
  const L = state.local || {};
  const need = xpToNext(p.level);
  const special = SPECIAL.map(([k, label, desc]) => {
    const base = p.special[k];
    const diff = stat(k) - base;
    const canAdd = p.statPoints > 0 && base < STAT_CAP;
    return `<div class="special-row" title="${esc(desc)}">
      <span class="special-letter">${label[0]}</span>
      <span class="special-label">${label}</span>
      <span class="special-pips">${bar(base, STAT_CAP, "bar-thin")}</span>
      <span class="special-val">${base}${diff ? `<span class="buffed">${diff > 0 ? "+" : ""}${diff}</span>` : ""}</span>
      ${canAdd ? btn("+", "addStat", k, { cls: "mini" }) : '<span class="mini-spacer"></span>'}
    </div>`;
  }).join("");

  const ally = L.allyKey ? ALLIES[L.allyKey] : null;
  const scavLeft = SCAVENGE_LIMIT - (L.scavenges || 0);
  const busy = enemyActive() || p.dead;
  const c = state.camp;
  let campBtn = "";
  if (!loc.nocamp && !(c.deployed && c.locationId === loc.id)) {
    campBtn = btn(c.deployed ? `MOVE C.A.M.P. HERE <span class="muted">(${CAMP_DEPLOY_COST}c)</span>` : "DEPLOY C.A.M.P.", "deployCamp", null, { disabled: busy });
  }

  const effects = [];
  const now = Date.now();
  p.buffs.forEach((b) => effects.push(`<div class="effect-row"><span>${esc(b.name)}</span><span data-until="${b.expiresAt}">${Math.ceil((b.expiresAt - now) / 1000)}s</span></div>`));
  if (state.events.capsFrenzyActive) effects.push(`<div class="effect-row event"><span>Caps Frenzy (×2 caps)</span><span>${state.events.capsFrenzyTimer}s</span></div>`);
  if (p.rads > 0) effects.push(`<div class="effect-row bad"><span>Radiation: -${p.rads} max HP</span><span>${btn("RADAWAY", "useByKey", "radaway", { cls: "mini-btn", disabled: !countItem(p.inventory, "radaway") })}</span></div>`);
  if (L.sale) effects.push(`<div class="effect-row event"><span>Trader Caravan: 20% off</span><span>HERE</span></div>`);

  $("tab-status").innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <h2 class="panel-title">${esc(p.name)} <span class="muted">· LEVEL ${p.level}</span></h2>
        <div class="xp-line"><span>XP</span>${bar(p.xp, need, "bar-xp")}<span>${p.xp}/${need}</span></div>
        ${p.statPoints > 0 ? `<p class="notice">▲ ${plural(p.statPoints, "S.P.E.C.I.A.L. point")} to spend</p>` : ""}
        <div class="special-list">${special}</div>
      </section>

      <section class="panel">
        <h2 class="panel-title">CURRENT LOCATION</h2>
        <div class="loc-head"><span class="loc-name">${loc.vault ? "⛬ " : ""}${esc(loc.name)}</span>${loc.vault ? '<span class="tag tag-vault">VAULT · SHELTER</span>' : dangerTag(loc.danger)}</div>
        <p class="muted small">${esc(loc.region)}${loc.rads && !loc.vault ? ` · ☢ +${loc.rads} rads on arrival` : ""}${loc.nocamp && !loc.vault ? " · No C.A.M.P.s allowed" : ""}</p>
        <p class="desc">${esc(loc.desc)}</p>
        ${L.event ? `<p class="event-line"><strong>${esc(L.event.name)}</strong> — ${esc(L.event.text)}</p>` : ""}
        ${loc.vault ? vaultPanelHtml(loc) : ""}
        <div class="btn-row">
          ${loc.vault ? "" : btn(`SCAVENGE <span class="muted">(${SCAVENGE_AP} AP)</span>`, "scavenge", null, { disabled: busy || scavLeft <= 0 || p.ap < SCAVENGE_AP })}
          ${L.vendor ? btn("TRADE", "tab", "inventory") : ""}
          ${ally ? btn(`RECRUIT <span class="rarity-${ally.rarity.toLowerCase()}">${esc(ally.name)}</span> <span class="muted">(${allyCost(L.allyKey)}c)</span>`, "recruit") : ""}
          ${campBtn}
          ${enemyActive() ? btn("⚠ HOSTILE — FIGHT", "tab", "combat", { cls: "btn-danger" }) : ""}
        </div>
        <p class="muted small">${loc.vault ? "Sealed from the surface: no hostiles, events or radiation." : scavLeft > 0 ? `${plural(scavLeft, "search")} left here` : "Picked clean"}${ally ? ` · ${esc(ally.name)} is looking for work` : ""}${L.vendor ? " · Vendor present" : ""}</p>
      </section>

      <section class="panel">
        <h2 class="panel-title">COMBAT READINESS</h2>
        <div class="kv">
          ${kv("Damage", playerDamage())}
          ${kv("Damage Resist", playerDR())}
          ${kv("Max HP", `${effMaxHp()}${p.rads ? ` <span class="muted">(${maxHp()} - ${p.rads} rads)</span>` : ""}`)}
          ${kv("Max AP", maxAp())}
          ${kv("Hit Chance", pct(hitChance()))}
          ${kv("Crit Chance", pct(critChance()))}
          ${kv("Dodge", pct(dodgeChance()))}
          ${kv("Flee Chance", pct(fleeChance()))}
          ${kv("Party", `${party().length}/${maxParty()}`)}
          ${kv("Kills", p.kills)}
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">ACTIVE EFFECTS</h2>
        ${effects.length ? effects.join("") : '<p class="empty">No active effects.</p>'}
        <h2 class="panel-title mt">SETTINGS</h2>
        <div class="btn-row">
          ${btn(state.settings.muted ? "SOUND: OFF" : "SOUND: ON", "toggleSound")}
          ${THEMES.map((t) => btn(t.toUpperCase(), "theme", t, { cls: `chip swatch swatch-${t} ${state.settings.theme === t ? "active" : ""}` })).join("")}
        </div>
        <h2 class="panel-title mt">SAVE DATA</h2>
        <div class="btn-row">
          ${btn("SAVE GAME", "saveMenu", null, { cls: "btn-primary", disabled: !Store.available })}
          ${btn("LOAD GAME", "loadMenu", null, { disabled: !Store.available })}
          ${btn("EXPORT", "exportSave", null, { title: "Download your save as a .json file" })}
          ${btn("IMPORT", "importSave", null, { title: "Load a .json save file" })}
        </div>
        <p class="muted small">${Store.available ? `Autosaved to this browser after every action. ${SLOT_COUNT} manual slots are kept separately.` : '<span class="warn">Browser storage is blocked — use EXPORT to keep your progress.</span>'}</p>
        <div class="btn-row">${btn("MAIN MENU", "mainMenu")}${btn("NEW GAME", "newGame", null, { cls: "btn-danger" })}</div>
        <p class="muted small">Keys: 1-7 switch tabs · In combat: A attack, V V.A.T.S., H heal, F flee, L loot</p>
      </section>
    </div>`;
}

function vaultPanelHtml(loc) {
  const p = P();
  const now = Date.now();
  const rooms = VAULT_ROOMS.map((r) => {
    const readyAt = roomReadyAt(loc.id, r.id);
    const ready = readyAt <= now;
    return `<div class="room-row ${ready ? "" : "searched"}">
      <span class="room-icon">${r.icon}</span>
      <span class="room-info"><span>${esc(r.name)}</span><span class="muted small">${esc(r.desc)}</span></span>
      ${ready ? btn("SEARCH", "searchRoom", r.id, { cls: "mini-btn btn-primary" }) : `<span class="muted small">restocks <span data-until="${readyAt}">…</span></span>`}
    </div>`;
  }).join("");
  return `<div class="vault-box">
    <div class="btn-row">
      ${btn("REST IN BUNKS", "vaultRest", null, { disabled: p.hp >= effMaxHp() && p.ap >= maxAp() && party().every((a) => a.hp >= a.maxHp) })}
      ${btn(`DECONTAMINATE${p.rads ? ` <span class="muted">(-${p.rads} rads)</span>` : ""}`, "vaultDecon", null, { disabled: p.rads <= 0 })}
    </div>
    <div class="room-list">${rooms}</div>
  </div>`;
}

/* ---------------------------
   MAP TAB
--------------------------- */
let mapView = null; // { cx, cy } scroll center as fractions, kept across re-renders

function captureMapView() {
  const vp = $("map-viewport");
  if (!vp || !vp.scrollWidth) return;
  mapView = {
    cx: (vp.scrollLeft + vp.clientWidth / 2) / vp.scrollWidth,
    cy: (vp.scrollTop + vp.clientHeight / 2) / vp.scrollHeight
  };
}

function applyMapView() {
  const vp = $("map-viewport");
  if (!vp || !mapView) return;
  vp.scrollLeft = mapView.cx * vp.scrollWidth - vp.clientWidth / 2;
  vp.scrollTop = mapView.cy * vp.scrollHeight - vp.clientHeight / 2;
}

function centerMapOn(loc) {
  mapView = loc ? { cx: loc.x / 100, cy: loc.y / 100 } : { cx: 0.5, cy: 0.5 };
}

function setMapZoom(z, anchor) {
  const zoom = clamp(z, MAP_ZOOMS[0], MAP_ZOOMS[MAP_ZOOMS.length - 1]);
  if (zoom === state.ui.mapZoom) return;
  captureMapView();
  if (anchor && mapView) mapView = { cx: anchor.fx, cy: anchor.fy, ox: anchor.ox, oy: anchor.oy };
  state.ui.mapZoom = zoom;
  renderMap();
  // keep the point under the cursor fixed while zooming with the wheel
  const vp = $("map-viewport");
  if (vp && anchor) {
    vp.scrollLeft = anchor.fx * vp.scrollWidth - anchor.ox;
    vp.scrollTop = anchor.fy * vp.scrollHeight - anchor.oy;
    captureMapView();
  }
}

function stepZoom(dir) {
  const zs = MAP_ZOOMS;
  const i = zs.indexOf(state.ui.mapZoom);
  return zs[clamp((i < 0 ? 0 : i) + dir, 0, zs.length - 1)];
}

const mapDistance = (a, b) => Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 0.6);

function renderMap() {
  const p = P();
  const ui = state.ui;
  const region = ui.mapRegion;
  const here = currentLoc();
  const allInRegion = LOCATIONS.filter((l) => l.region === region);
  const locs = allInRegion.filter(isKnown);
  const sel = LOC[ui.mapSelected] && LOC[ui.mapSelected].region === region && isKnown(LOC[ui.mapSelected]) ? LOC[ui.mapSelected] : (locs.find((l) => l.id === here.id) || locs[0]);
  ui.mapSelected = sel.id;
  const campLoc = state.camp.deployed ? state.camp.locationId : null;
  const zoom = MAP_ZOOMS.includes(ui.mapZoom) ? ui.mapZoom : 1;
  const mapOwned = hasVaultMap();

  captureMapView();

  const chips = REGIONS.map((r) => {
    const found = LOCATIONS.filter((l) => l.vault && l.region === r && isVaultFound(l.id)).length;
    return btn(`${r}${r === here.region ? " ◉" : ""}${found ? ` <span class="muted">⛬${found}</span>` : ""}`, "mapRegion", r, { cls: `chip ${r === region ? "active" : ""}` });
  }).join("");

  const markers = locs.map((l) => {
    const cls = ["map-marker", l.vault ? "is-vault" : `danger-${l.danger.toLowerCase()}`];
    if (l.vault && !isVaultFound(l.id)) cls.push("is-located");
    if (!l.vault && !state.visited[l.id]) cls.push("is-unvisited");
    if (l.id === p.locationId) cls.push("is-here");
    if (l.id === sel.id) cls.push("is-selected");
    if (l.id === campLoc) cls.push("is-camp");
    if (l.x > 60) cls.push("label-left");
    return `<button class="${cls.join(" ")}" style="left:${l.x}%;top:${l.y}%" data-action="mapSelect" data-arg="${l.id}" title="${esc(l.name)}${l.vault ? " (Vault)" : ` (${l.danger})`}">
      <span class="pin">${l.vault ? "⛬" : ""}</span><span class="mlabel">${l.id === campLoc ? "⌂ " : ""}${esc(l.name)}</span></button>`;
  }).join("");

  // route line from you to the selected location (same region only)
  let route = "";
  if (sel.id !== here.id && sel.region === here.region) {
    route = `<svg class="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="${here.x}" y1="${here.y}" x2="${sel.x}" y2="${sel.y}" vector-effect="non-scaling-stroke"></line></svg>`;
  }

  const features = [];
  if (sel.id === p.locationId) features.push('<span class="tag tag-here">YOU ARE HERE</span>');
  if (sel.vault) {
    features.push('<span class="tag tag-vault">⛬ VAULT · SHELTER</span>');
    features.push(isVaultFound(sel.id) ? '<span class="tag tag-here">UNLOCKED</span>' : '<span class="tag tag-event">LOCATED VIA VAULT MAP</span>');
    if (isVaultFound(sel.id)) {
      const ready = VAULT_ROOMS.filter((r) => roomReadyAt(sel.id, r.id) <= Date.now()).length;
      features.push(`<span class="tag">ROOMS READY ${ready}/${VAULT_ROOMS.length}</span>`);
    }
  } else {
    features.push(state.visited[sel.id] ? '<span class="tag tag-muted">VISITED</span>' : '<span class="tag tag-event">UNEXPLORED</span>');
  }
  if (sel.id === campLoc) features.push('<span class="tag tag-camp">YOUR C.A.M.P.</span>');
  if (sel.vendor) features.push('<span class="tag">VENDOR</span>');
  if (sel.ally && canRecruitKey(sel.ally)) features.push(`<span class="tag">RECRUIT: ${esc(ALLIES[sel.ally].name)}</span>`);
  if (sel.rads && !sel.vault) features.push(`<span class="tag tag-high">☢ ${sel.rads} RADS</span>`);
  if (sel.nocamp && !sel.vault) features.push('<span class="tag tag-muted">NO C.A.M.P.</span>');
  if (!sel.vault && sel.events && sel.events.length) features.push(`<span class="tag tag-muted">EVENTS: ${sel.events.map((e) => esc(EVENTS[e].name)).join(", ")}</span>`);
  const fare = sel.region !== here.region ? REGION_FARE : 0;
  const threats = sel.vault ? "None — sealed shelter" : [...new Set(sel.enemies)].map((k) => ENEMIES[k].name).join(", ");
  const hiddenHere = hiddenVaultsIn(sel.region).length;
  const distance = sel.region === here.region && sel.id !== here.id ? `<span class="muted">≈ ${mapDistance(here, sel)} mi away</span>` : "";

  const surface = allInRegion.filter((l) => !l.vault);
  const vaultsAll = allInRegion.filter((l) => l.vault);
  const explored = surface.filter((l) => state.visited[l.id]).length;
  const vaultsFound = vaultsAll.filter((l) => isVaultFound(l.id)).length;
  const stats = `<div class="map-stats">
      <span>EXPLORED ${explored}/${surface.length}</span>
      <span>⛬ VAULTS ${vaultsFound}/${mapOwned ? vaultsAll.length : "?"}</span>
      ${mapOwned ? '<span class="rarity-legendary">★ VAULT-TEC MAP ACTIVE</span>' : ""}
    </div>`;

  const list = locs.map((l) => `<button class="list-row ${l.id === sel.id ? "selected" : ""}" data-action="mapSelect" data-arg="${l.id}">
      <span>${l.id === p.locationId ? "◉ " : ""}${l.id === campLoc ? "⌂ " : ""}${l.vault ? "⛬ " : ""}${esc(l.name)}${!l.vault && state.visited[l.id] ? ' <span class="muted">✓</span>' : ""}</span>${l.vault ? '<span class="tag tag-vault">VAULT</span>' : dangerTag(l.danger)}</button>`).join("");

  $("tab-map").innerHTML = `
    <div class="chip-row">${chips}</div>
    <div class="map-layout">
      <div class="map-wrap">
        <div class="map-box ${zoom > 1 ? "zoomed" : ""}" id="map-viewport">
          <div class="map-canvas" style="width:${zoom * 100}%;height:${zoom * 100}%">
            <div class="map-grid"></div>
            ${route}
            ${markers}
          </div>
        </div>
        <div class="map-region-label">${esc(region.toUpperCase())}</div>
        <div class="map-zoom">
          ${btn("+", "mapZoom", "in", { cls: "zoom-btn", disabled: zoom >= MAP_ZOOMS[MAP_ZOOMS.length - 1], title: "Zoom in (mouse wheel)" })}
          <span class="zoom-level">${Math.round(zoom * 100)}%</span>
          ${btn("−", "mapZoom", "out", { cls: "zoom-btn", disabled: zoom <= MAP_ZOOMS[0], title: "Zoom out" })}
          ${btn("◎", "mapCenter", null, { cls: "zoom-btn", title: "Center on you" })}
        </div>
        <div class="map-legend"><span class="lg low">◆ LOW</span><span class="lg medium">◆ MED</span><span class="lg high">◆ HIGH</span><span class="lg vault">⛬ VAULT</span><span>◉ YOU</span><span>⌂ C.A.M.P.</span><span class="muted">DRAG · WHEEL · DOUBLE-CLICK TO TRAVEL</span></div>
      </div>
      <section class="panel map-detail">
        <div class="loc-head"><span class="loc-name">${sel.vault ? "⛬ " : ""}${esc(sel.name)}</span>${sel.vault ? "" : dangerTag(sel.danger)}</div>
        <p class="muted small">${esc(sel.region)} ${distance ? `· ${distance}` : ""}</p>
        <p class="desc">${esc(sel.desc)}</p>
        <div class="tag-row">${features.join("")}</div>
        <p class="small"><span class="muted">Threats:</span> ${esc(threats)}</p>
        <div class="btn-row">
          ${btn(sel.id === p.locationId ? "YOU ARE HERE" : `TRAVEL${fare ? ` <span class="muted">(${fare}c fare)</span>` : ""}`, "travel", sel.id, { cls: "btn-primary", disabled: sel.id === p.locationId || p.dead || enemyActive() })}
          ${campLoc && !atCamp() ? btn(`FAST TRAVEL TO C.A.M.P. <span class="muted">(${CAMP_FAST_TRAVEL_COST}c)</span>`, "fastTravel", null, { disabled: p.dead || enemyActive() }) : ""}
        </div>
        ${enemyActive() ? '<p class="warn small">A hostile blocks your way. Fight or flee first.</p>' : ""}
        ${fare ? `<p class="muted small">Traveling to another region costs a ${REGION_FARE}-cap caravan fare.</p>` : ""}
        ${!sel.vault && hiddenHere ? `<p class="small vault-hint">⛬ ${plural(hiddenHere, "hidden vault")} in ${esc(sel.region)}. Each trip here has a ${Math.round(vaultDiscoveryChance() * 100)}% chance to lead you to one instead.</p>` : ""}
        ${stats}
      </section>
    </div>
    <div class="loc-list">${list}</div>
    <p class="muted small">Tip: ← → cycle locations · Enter travels · + / − zoom</p>`;

  if (!mapView || zoom === 1) centerMapOn(zoom === 1 ? null : (sel || here));
  applyMapView();
}

/* ---------------------------
   INVENTORY TAB
--------------------------- */
const INV_FILTERS = [["all", "ALL"], ["weapon", "WEAPONS"], ["armor", "APPAREL"], ["consumable", "AID"], ["junk", "JUNK"]];

function sortItems(list) {
  return [...list].sort((a, b) =>
    (b.equipped - a.equipped) ||
    (TYPE_ORDER[def(a).type] - TYPE_ORDER[def(b).type]) ||
    def(a).name.localeCompare(def(b).name) ||
    rarityIndex(b.rarity) - rarityIndex(a.rarity));
}

function renderInventory() {
  const p = P();
  const ui = state.ui;
  const inv = p.inventory;
  const f = ui.invFilter;
  const items = sortItems(inv.filter((i) => f === "all" || def(i).type === f));
  let sel = findInv(ui.selectedUid);
  if (!sel && items.length) {
    sel = items[0];
    ui.selectedUid = sel.uid;
  }

  const chips = INV_FILTERS.map(([k, label]) => {
    const n = k === "all" ? unitCount(inv) : inv.filter((i) => def(i).type === k).reduce((s, i) => s + i.quantity, 0);
    return btn(`${label} <span class="muted">${n}</span>`, "invFilter", k, { cls: `chip ${f === k ? "active" : ""}` });
  }).join("");

  const rows = items.map((i) => `<button class="list-row item-row ${sel && sel.uid === i.uid ? "selected" : ""}" data-action="selectItem" data-arg="${i.uid}">
      <span>${i.equipped ? '<span class="eq">■</span> ' : ""}${itemNameHtml(i.key, i.rarity, i.quantity)}</span>
      <span class="muted small">${itemSummary(i.key, i.rarity)}</span></button>`).join("");

  let detail = '<p class="empty">Select an item.</p>';
  if (sel) {
    const d = def(sel);
    const isGear = d.type === "weapon" || d.type === "armor";
    const isKey = d.type === "key";
    const lines = [];
    let compare = "";
    if (d.type === "weapon") {
      lines.push(kv("Damage", weaponDamage(sel)));
      const eq = getEquipped("weapon");
      if (eq && eq !== sel) {
        const diff = weaponDamage(sel) - weaponDamage(eq);
        compare = `<p class="small ${diff >= 0 ? "good" : "bad"}">${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)} vs equipped ${esc(def(eq).name)}</p>`;
      }
      if (d.energy) lines.push(kv("Class", "Energy"));
    } else if (d.type === "armor") {
      lines.push(kv("Damage Resist", armorDefense(sel)), kv("HP Bonus", `+${armorHp(sel)}`));
      const eq = getEquipped("armor");
      if (eq && eq !== sel) {
        const diff = armorDefense(sel) - armorDefense(eq);
        compare = `<p class="small ${diff >= 0 ? "good" : "bad"}">${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)} DR vs equipped ${esc(def(eq).name)}</p>`;
      }
    } else if (d.type === "consumable") {
      lines.push(kv("Effect", itemSummary(sel.key, sel.rarity)));
    }
    lines.push(kv("Quantity", sel.quantity), kv("Value", `${Math.round(baseValue(sel.key, sel.rarity))} caps`));
    const y = scrapYield(sel);
    if (y) lines.push(kv("Scraps into", yieldText(y)));

    const actions = [];
    if (isGear) actions.push(btn(sel.equipped ? "UNEQUIP" : "EQUIP", "useItem", sel.uid, { cls: "btn-primary" }));
    if (d.type === "consumable") actions.push(btn("USE", "useItem", sel.uid, { cls: "btn-primary" }));
    if (isKey) actions.push(btn(sel.key === "vault_map" ? "READ MAP" : "EXAMINE", "useItem", sel.uid, { cls: "btn-primary" }));
    if (!isKey) actions.push(btn("DROP", "dropItem", sel.uid, { disabled: sel.equipped }));
    if (y) actions.push(btn("SCRAP", "scrapItem", sel.uid, { disabled: sel.equipped }));
    if (state.local && state.local.vendor && !isKey) actions.push(btn(`SELL <span class="muted">(${sellPrice(sel)}c)</span>`, "sellItem", sel.uid, { disabled: sel.equipped }));
    if (atCamp()) actions.push(btn("STASH", "store", sel.uid, { disabled: sel.equipped }));

    detail = `
      <div class="item-head">${itemNameHtml(sel.key, sel.rarity, 1)} ${isGear || isKey ? rarityTag(sel.rarity) : ""}${sel.equipped ? ' <span class="tag tag-here">EQUIPPED</span>' : ""}</div>
      <p class="muted small">${d.type.toUpperCase()}</p>
      <p class="desc">${esc(d.desc)}</p>
      <div class="kv">${lines.join("")}</div>
      ${compare}
      <div class="btn-row">${actions.join("")}</div>`;
  }

  let vendorHtml = "";
  const L = state.local;
  if (L && L.vendor) {
    const vrows = L.vendor.map((v, idx) => {
      const price = buyPrice(v.key, v.rarity);
      return `<div class="list-row static">
        <span>${itemNameHtml(v.key, v.rarity, 1)} <span class="muted small">${itemSummary(v.key, v.rarity)}</span></span>
        <span class="row-actions"><span class="muted small">${v.stock > 0 ? `stock ${v.stock}` : "SOLD OUT"}</span>
        ${btn(`BUY ${price}c`, "buy", idx, { cls: "mini-btn", disabled: v.stock <= 0 || p.caps < price })}</span></div>`;
    }).join("");
    vendorHtml = `<section class="panel">
      <h2 class="panel-title">VENDOR · ${esc(currentLoc().name)} ${L.sale ? '<span class="tag tag-event">20% OFF</span>' : ""}</h2>
      <p class="muted small">You have ${p.caps} caps. Select an item from your inventory and press SELL to sell it.</p>
      <div class="list">${vrows}</div></section>`;
  }

  const fieldRecipes = RECIPES.filter((r) => r.station === "field");
  const fieldHtml = `<section class="panel">
    <h2 class="panel-title">FIELD CRAFTING</h2>
    ${fieldRecipes.map((r) => recipeRow(r, atCamp())).join("")}
    <p class="muted small">Build crafting stations at your C.A.M.P. for many more recipes.</p></section>`;

  $("tab-inventory").innerHTML = `
    <div class="chip-row">${chips}</div>
    <div class="grid-2 inv-layout">
      <section class="panel"><div class="list item-list">${rows || '<p class="empty">Nothing here.</p>'}</div></section>
      <section class="panel item-detail">${detail}</section>
    </div>
    ${vendorHtml}
    ${fieldHtml}`;
}

/* ---------------------------
   COMBAT TAB
--------------------------- */
function renderFeed() {
  if (!state.feed.length) return '<p class="empty">—</p>';
  return state.feed.slice(-12).reverse().map((f) => `<p class="feed-${f.cls}">${esc(f.msg)}</p>`).join("");
}

function renderCombat() {
  const e = state.enemy;
  const p = P();
  const stims = countItem(p.inventory, "stimpak") + countItem(p.inventory, "super_stimpak");

  const partyHtml = `
    <div class="combatant">
      <div class="combatant-head"><span>YOU</span><span class="muted small">DMG ${playerDamage()} · DR ${playerDR()}</span></div>
      <div class="bar-label"><span>HP</span>${bar(p.hp, effMaxHp(), "bar-hp")}<span>${p.hp}/${effMaxHp()}</span></div>
      <div class="bar-label"><span>AP</span>${bar(p.ap, maxAp(), "bar-ap")}<span>${p.ap}/${maxAp()}</span></div>
    </div>
    ${party().map((a) => `<div class="combatant ${a.hp <= 0 ? "downed" : ""}">
      <div class="combatant-head"><span class="rarity-${a.rarity.toLowerCase()}">${esc(a.name)}</span><span class="muted small">${a.hp <= 0 ? "DOWNED" : `DMG ${a.damage}`}</span></div>
      <div class="bar-label"><span>HP</span>${bar(a.hp, a.maxHp, "bar-hp")}<span>${a.hp}/${a.maxHp}</span></div>
    </div>`).join("")}`;

  if (!e) {
    $("tab-combat").innerHTML = `
      <div class="grid-2">
        <section class="panel">
          <h2 class="panel-title">NO HOSTILES DETECTED</h2>
          <div class="radar"><div class="sweep"></div></div>
          <p class="muted small center">${inVault() ? "You're sheltered inside a vault. Nothing can reach you here." : "Enemies may appear at any moment. The more dangerous the area, the more often."}</p>
          <div class="btn-row center">${btn(`SEARCH FOR TROUBLE <span class="muted">(${HUNT_AP} AP)</span>`, "hunt", null, { disabled: p.dead || p.ap < HUNT_AP || inVault() })}</div>
        </section>
        <section class="panel"><h2 class="panel-title">PARTY</h2>${partyHtml}</section>
      </div>
      <section class="panel"><h2 class="panel-title">COMBAT FEED</h2><div class="feed">${renderFeed()}</div></section>`;
    return;
  }

  const d = ENEMIES[e.key];
  const tags = [];
  if (e.boss) tags.push('<span class="tag tag-high">☠ BOSS</span>');
  if (e.legendary) tags.push('<span class="tag rarity-tag rarity-legendary">★ LEGENDARY</span>');
  if (e.rads) tags.push(`<span class="tag tag-high">☢ +${e.rads} RADS/HIT</span>`);

  const actions = e.defeated
    ? `${btn("LOOT [L]", "loot", null, { cls: "btn-primary" })}${btn("LEAVE", "leave")}`
    : `${btn("ATTACK [A]", "attack", null, { cls: "btn-primary", disabled: p.dead })}
       ${btn(`V.A.T.S. [V] <span class="muted">${VATS_AP} AP</span>`, "vats", null, { disabled: p.dead || p.ap < VATS_AP, title: "Guaranteed hit, +25% damage, doubled crit chance" })}
       ${btn(`HEAL [H] <span class="muted">×${stims}</span>`, "heal", null, { disabled: p.dead || !stims })}
       ${btn(`FLEE [F] <span class="muted">${pct(fleeChance())}</span>`, "flee", null, { disabled: p.dead })}`;

  const lootHtml = e.defeated && e.loot.length
    ? `<div class="loot-list">${e.loot.map((l) => `<span class="tag">${itemNameHtml(l.key, l.rarity || "Common", l.qty)}</span>`).join("")}</div>`
    : e.defeated ? '<p class="muted small">Nothing of value on the body.</p>' : "";

  $("tab-combat").innerHTML = `
    <div class="grid-2">
      <section class="panel enemy-panel ${e.defeated ? "defeated" : ""} ${e.boss ? "boss" : ""}">
        <h2 class="panel-title">${e.defeated ? "DEFEATED" : "HOSTILE"} <span class="muted">· LVL ${e.level}</span></h2>
        <div class="enemy-name">${esc(e.name)}</div>
        <div class="tag-row">${tags.join("")}</div>
        <p class="desc">${esc(d.desc)}</p>
        <div class="bar-label"><span>HP</span>${bar(e.hp, e.maxHp, "bar-enemy")}<span>${e.hp}/${e.maxHp}</span></div>
        <p class="muted small">Hits for ~${e.dmg} · Your hit chance ${pct(hitChance())} · Crit ${pct(critChance())}</p>
        ${lootHtml}
        <div class="btn-row combat-actions">${actions}</div>
      </section>
      <section class="panel"><h2 class="panel-title">PARTY</h2>${partyHtml}</section>
    </div>
    <section class="panel"><h2 class="panel-title">COMBAT FEED</h2><div class="feed">${renderFeed()}</div></section>`;
}

/* ---------------------------
   C.A.M.P. TAB
--------------------------- */
const CAMP_VIEWS = [["overview", "OVERVIEW"], ["build", "BUILD"], ["stash", "STASH"], ["craft", "CRAFT"]];

function renderCamp() {
  const view = state.ui.campView;
  const chips = CAMP_VIEWS.map(([k, label]) => btn(label, "campView", k, { cls: `chip ${view === k ? "active" : ""}` })).join("");
  const body = { overview: campOverviewHtml, build: campBuildHtml, stash: campStashHtml, craft: campCraftHtml }[view] || campOverviewHtml;
  $("tab-camp").innerHTML = `<div class="chip-row">${chips}</div>${body()}`;
}

function campOverviewHtml() {
  const c = state.camp;
  const p = P();
  const loc = currentLoc();
  const busy = p.dead || enemyActive();

  if (!c.deployed) {
    return `<section class="panel camp-intro">
      <h2 class="panel-title">C.A.M.P. — CONSTRUCTION AND ASSEMBLY MOBILE PLATFORM</h2>
      <pre class="ascii">      /\\
     /  \\   ___
    / [] \\_|___|_
   /______\\|  ⌂  |
  ════════════════</pre>
      <p>Your C.A.M.P. device is packed and ready. Deploy it to unlock:</p>
      <ul class="bullets">
        <li><strong>BUILD</strong> beds, workbenches, generators, turrets, crops and more with scavenged materials.</li>
        <li><strong>STASH</strong> to store items safely (and craft straight from storage).</li>
        <li><strong>HOUSE ALLIES</strong> beyond your party limit — residents heal, gather materials and defend.</li>
        <li><strong>FAST TRAVEL</strong> home from anywhere for ${CAMP_FAST_TRAVEL_COST} caps.</li>
      </ul>
      <p class="muted small">First deployment is free. Moving it later costs ${CAMP_DEPLOY_COST} caps. Some settlements don't allow C.A.M.P.s.</p>
      <div class="btn-row">${btn(`DEPLOY AT ${esc(loc.name.toUpperCase())}`, "deployCamp", null, { cls: "btn-primary", disabled: busy || loc.nocamp })}</div>
      ${loc.nocamp ? `<p class="warn small">${esc(loc.name)} doesn't allow C.A.M.P.s. Travel somewhere else.</p>` : ""}
    </section>`;
  }

  const campLoc = LOC[c.locationId];
  const here = atCamp();
  const supply = powerSupply();
  const demand = powerDemand();
  const built = Object.keys(STRUCTURES).filter((k) => sCount(k) > 0);
  const nextTick = c.lastTick + CAMP_TICK_MS;
  const last = c.lastProduction && c.lastProduction.length
    ? c.lastProduction.filter((x) => ITEMS[x.key]).map((x) => `${ITEMS[x.key].name} ×${x.qty}`).join(", ")
    : "Nothing yet";

  let wanderer = "";
  if (c.wanderer) {
    const w = ALLIES[c.wanderer];
    const cost = Math.max(1, Math.round(w.cost * 0.75 * recruitMult()));
    wanderer = `<section class="panel highlight">
      <h2 class="panel-title">WANDERER AT YOUR C.A.M.P.</h2>
      <p><span class="rarity-${w.rarity.toLowerCase()}">${esc(w.name)}</span> ${rarityTag(w.rarity)} — ${esc(w.desc)}</p>
      <p class="muted small">DMG ${w.damage + w.boost} · HP ${w.hp + w.boost * 2}${w.perk ? ` · ${ALLY_PERKS[w.perk]}` : ""}</p>
      <div class="btn-row">${btn(`RECRUIT (${cost}c)`, "recruitWanderer", null, { cls: "btn-primary", disabled: !here })}${btn("SEND AWAY", "dismissWanderer")}</div>
      ${here ? "" : '<p class="muted small">Return to your C.A.M.P. to meet them.</p>'}
    </section>`;
  }

  return `<div class="grid-2">
    <section class="panel">
      <h2 class="panel-title">C.A.M.P. STATUS</h2>
      <div class="loc-head"><span class="loc-name">⌂ ${esc(campLoc.name)}</span>${dangerTag(campLoc.danger)}</div>
      <p class="muted small">${esc(campLoc.region)} · ${here ? '<span class="good">You are home</span>' : "You are away"}</p>
      <div class="btn-row">
        ${here ? btn("REST", "rest", null, { cls: "btn-primary", disabled: busy || !sCount("bed"), title: sCount("bed") ? "Fully restore HP, AP and party" : "Build a Bed first" }) : btn(`FAST TRAVEL <span class="muted">(${CAMP_FAST_TRAVEL_COST}c)</span>`, "fastTravel", null, { cls: "btn-primary", disabled: busy })}
        ${!here && !loc.nocamp ? btn(`MOVE HERE <span class="muted">(${CAMP_DEPLOY_COST}c)</span>`, "deployCamp", null, { disabled: busy }) : ""}
      </div>
      ${here && !sCount("bed") ? '<p class="muted small">Build a Bed to rest.</p>' : ""}
      <div class="kv mt">
        ${kv("Power", `<span class="${demand > supply ? "bad" : ""}">${demand}/${supply} ⚡</span>`)}
        ${kv("Storage", `${unitCount(c.stash)}/${campStorage()}`)}
        ${kv("Housing", `${stationed().length}/${campHousing()}`)}
        ${kv("Defense", campDefense())}
        ${kv("Next cycle", `<span data-until="${nextTick}">--</span>`)}
      </div>
      ${demand > supply ? '<p class="warn small">Not enough power! Some structures are offline. Build a Fusion Generator.</p>' : ""}
    </section>
    <section class="panel">
      <h2 class="panel-title">PRODUCTION</h2>
      <p class="small"><span class="muted">Last cycle:</span> ${esc(last)}${c.lostLast ? ` <span class="bad">(${c.lostLast} lost, stash full)</span>` : ""}</p>
      <div class="structure-grid">
        ${built.length ? built.map((k) => {
          const s = STRUCTURES[k];
          const pw = s.power ? poweredCounts()[k] : null;
          return `<div class="structure-chip ${pw != null && pw < sCount(k) ? "unpowered" : ""}" title="${esc(s.desc)}"><span class="s-icon">${s.icon}</span>${esc(s.name)} ×${sCount(k)}${pw != null && pw < sCount(k) ? " ⚡!" : ""}</div>`;
        }).join("") : '<p class="empty">Nothing built yet. Open BUILD.</p>'}
      </div>
      <h2 class="panel-title mt">RESIDENTS (${stationed().length}/${campHousing()})</h2>
      ${stationed().length ? stationed().map((a) => `<div class="resident"><span class="rarity-${a.rarity.toLowerCase()}">${esc(a.name)}</span>${bar(a.hp, a.maxHp, "bar-hp bar-thin")}<span class="muted small">${a.hp}/${a.maxHp}</span></div>`).join("") : '<p class="empty">No residents. Send allies here from the ALLIES tab.</p>'}
      <p class="muted small">Residents heal each cycle, gather materials and help defend against raids.</p>
    </section>
  </div>${wanderer}`;
}

function campBuildHtml() {
  const here = atCamp();
  const pw = poweredCounts();
  const rows = Object.entries(STRUCTURES).map(([k, s]) => {
    const n = sCount(k);
    const full = n >= s.max;
    const meta = [];
    if (s.power) meta.push(`⚡ ${s.power}`);
    if (s.powerOut) meta.push(`+${s.powerOut} ⚡`);
    if (s.power && n) meta.push(`${pw[k]}/${n} powered`);
    return `<div class="build-row ${full ? "maxed" : ""}">
      <div class="build-icon">${s.icon}</div>
      <div class="build-info">
        <div class="build-name">${esc(s.name)} <span class="muted small">${n}/${s.max}</span> ${meta.length ? `<span class="tag tag-muted">${meta.join(" · ")}</span>` : ""}</div>
        <div class="muted small">${esc(s.desc)}</div>
        <div class="cost-row">${full ? '<span class="muted small">Maximum built</span>' : costHtml(s.cost, true)}</div>
      </div>
      <div class="build-actions">
        ${btn("BUILD", "build", k, { cls: "btn-primary", disabled: !here || full || !canAfford(s.cost, true) })}
        ${n ? btn("DISMANTLE", "dismantle", k, { cls: "mini-btn", disabled: !here }) : ""}
      </div>
    </div>`;
  }).join("");
  return `<section class="panel">
    <h2 class="panel-title">BUILD</h2>
    ${here ? '<p class="muted small">Materials come from your inventory and stash. Dismantling refunds half.</p>' : `<p class="warn small">You must be at your C.A.M.P.${state.camp.deployed ? ` (${esc(LOC[state.camp.locationId].name)})` : ""} to build.</p>`}
    <div class="build-list">${rows}</div>
  </section>`;
}

function campStashHtml() {
  const c = state.camp;
  const here = atCamp();
  const invRows = sortItems(P().inventory.filter((i) => !i.equipped)).map((i) => `<div class="list-row static">
      <span>${itemNameHtml(i.key, i.rarity, i.quantity)}</span>
      <span class="row-actions">${btn("1 →", "store", i.uid, { cls: "mini-btn", disabled: !here })}${i.quantity > 1 ? btn("ALL →", "storeAll", i.uid, { cls: "mini-btn", disabled: !here }) : ""}</span></div>`).join("");
  const stashRows = sortItems(c.stash).map((i) => `<div class="list-row static">
      <span>${itemNameHtml(i.key, i.rarity, i.quantity)}</span>
      <span class="row-actions">${btn("← 1", "take", i.uid, { cls: "mini-btn", disabled: !here })}${i.quantity > 1 ? btn("← ALL", "takeAll", i.uid, { cls: "mini-btn", disabled: !here }) : ""}</span></div>`).join("");
  return `${here ? "" : '<p class="warn small">You can view your stash from anywhere, but you must be at your C.A.M.P. to move items.</p>'}
    <div class="btn-row">${btn("STORE ALL JUNK", "storeJunk", null, { disabled: !here })}<span class="muted small">Stash: ${unitCount(c.stash)}/${campStorage()} · Build Stash Boxes for more room.</span></div>
    <div class="grid-2">
      <section class="panel"><h2 class="panel-title">INVENTORY</h2><div class="list">${invRows || '<p class="empty">Empty.</p>'}</div></section>
      <section class="panel"><h2 class="panel-title">STASH ${bar(unitCount(c.stash), campStorage(), "bar-thin inline-bar")}</h2><div class="list">${stashRows || '<p class="empty">Empty.</p>'}</div></section>
    </div>`;
}

function recipeRow(r, useStash) {
  if (r.special === "breakdown") {
    const n = P().inventory.filter((i) => def(i).type === "junk" && def(i).breakdown).reduce((s, i) => s + i.quantity, 0);
    return `<div class="recipe-row"><div><div>${esc(r.name)}</div><div class="muted small">${n ? `${plural(n, "item")} ready to break down into materials` : "No scrappable junk carried"}</div></div>${btn("CRAFT", "craft", r.id, { disabled: !n })}</div>`;
  }
  if (r.special === "upgrade") {
    const eq = getEquipped(r.slot);
    if (!eq) return `<div class="recipe-row"><div><div>${esc(r.name)}</div><div class="muted small">Nothing equipped</div></div>${btn("UPGRADE", "craft", r.id, { disabled: true })}</div>`;
    if (eq.rarity === "Legendary") return `<div class="recipe-row"><div><div>${esc(r.name)}</div><div class="muted small">${itemNameHtml(eq.key, eq.rarity, 1)} is already Legendary</div></div>${btn("UPGRADE", "craft", r.id, { disabled: true })}</div>`;
    const cost = UPGRADE_COSTS[r.slot][eq.rarity];
    const next = RARITIES[rarityIndex(eq.rarity) + 1];
    return `<div class="recipe-row"><div><div>${itemNameHtml(eq.key, eq.rarity, 1)} → <span class="rarity-${next.toLowerCase()}">${next}</span></div><div class="cost-row">${costHtml(cost, useStash)}</div></div>${btn("UPGRADE", "craft", r.id, { cls: "btn-primary", disabled: !canAfford(cost, useStash) })}</div>`;
  }
  const d = ITEMS[r.out];
  return `<div class="recipe-row"><div><div>${itemNameHtml(r.out, d.rarity || "Common", r.qty)} <span class="muted small">${itemSummary(r.out, d.rarity || "Common")}</span></div><div class="cost-row">${costHtml(r.cost, useStash)}</div></div>${btn("CRAFT", "craft", r.id, { disabled: !canAfford(r.cost, useStash) })}</div>`;
}

function campCraftHtml() {
  const here = atCamp();
  const groups = ["chem", "cooking", "weaponBench", "armorBench"].map((station) => {
    const built = sCount(station) > 0;
    const recipes = RECIPES.filter((r) => r.station === station);
    return `<section class="panel ${built ? "" : "locked"}">
      <h2 class="panel-title">${STRUCTURE_ICON(station)} ${STATION_LABELS[station]} ${built ? "" : '<span class="tag tag-muted">NOT BUILT</span>'}</h2>
      ${built ? recipes.map((r) => recipeRow(r, here)).join("") : `<p class="muted small">Build a ${esc(STRUCTURES[station].name)} to unlock ${recipes.length} recipes.</p>`}
    </section>`;
  }).join("");
  return `${here ? '<p class="muted small">Crafting uses materials from your inventory and stash.</p>' : '<p class="warn small">You must be at your C.A.M.P. to use crafting stations.</p>'}
    <div class="grid-2">${groups}</div>`;
}

const STRUCTURE_ICON = (k) => `<span class="s-icon">${STRUCTURES[k].icon}</span>`;

/* ---------------------------
   ALLIES TAB
--------------------------- */
function allyCard(a) {
  const A = ALLIES[a.key];
  const here = atCamp();
  const actions = [];
  if (a.hp < a.maxHp) actions.push(btn(a.hp <= 0 ? "REVIVE (STIMPAK)" : "HEAL (STIMPAK)", "allyHeal", a.uid, { cls: a.hp <= 0 ? "btn-primary" : "" }));
  if (!a.stationed && state.camp.deployed) actions.push(btn("SEND TO C.A.M.P.", "allySend", a.uid, { disabled: stationed().length >= campHousing() }));
  if (a.stationed) actions.push(btn("RECALL", "allyRecall", a.uid, { disabled: !here || party().length >= maxParty() }));
  actions.push(btn(`DISMISS <span class="muted">(+${Math.floor((a.cost || 50) * 0.5)}c)</span>`, "allyDismiss", a.uid, { cls: "btn-danger mini-btn" }));
  return `<div class="ally-card ${a.hp <= 0 ? "downed" : ""}">
    <div class="ally-head"><span class="ally-name rarity-${a.rarity.toLowerCase()}">${esc(a.name)}</span>${rarityTag(a.rarity)}${a.hp <= 0 ? '<span class="tag tag-high">DOWNED</span>' : ""}</div>
    <p class="muted small">${esc(A.desc)}</p>
    ${A.perk ? `<p class="small perk">◆ ${ALLY_PERKS[A.perk]}</p>` : ""}
    <div class="bar-label"><span>HP</span>${bar(a.hp, a.maxHp, "bar-hp")}<span>${a.hp}/${a.maxHp}</span></div>
    <p class="small">Damage: ${a.damage}</p>
    <div class="btn-row">${actions.join("")}</div>
  </div>`;
}

function renderAllies() {
  const L = state.local || {};
  const ally = L.allyKey ? ALLIES[L.allyKey] : null;
  const c = state.camp;
  $("tab-allies").innerHTML = `
    <section class="panel">
      <h2 class="panel-title">PARTY <span class="muted">${party().length}/${maxParty()}</span></h2>
      <p class="muted small">Party allies fight beside you. Your party grows by one slot per level (max 6).</p>
      <div class="ally-grid">${party().length ? party().map(allyCard).join("") : '<p class="empty">No allies recruited.</p>'}</div>
    </section>
    <section class="panel">
      <h2 class="panel-title">STATIONED AT C.A.M.P. <span class="muted">${stationed().length}/${campHousing()}</span></h2>
      ${c.deployed ? "" : '<p class="muted small">Deploy a C.A.M.P. to station allies there.</p>'}
      <div class="ally-grid">${stationed().length ? stationed().map(allyCard).join("") : '<p class="empty">No residents.</p>'}</div>
    </section>
    <section class="panel">
      <h2 class="panel-title">LOOKING FOR WORK HERE</h2>
      ${ally ? `<div class="ally-card">
          <div class="ally-head"><span class="ally-name rarity-${ally.rarity.toLowerCase()}">${esc(ally.name)}</span>${rarityTag(ally.rarity)}</div>
          <p class="muted small">${esc(ally.desc)}</p>
          ${ally.perk ? `<p class="small perk">◆ ${ALLY_PERKS[ally.perk]}</p>` : ""}
          <p class="small">Damage: ${ally.damage + ally.boost} · HP: ${ally.hp + ally.boost * 2}</p>
          <div class="btn-row">${btn(`RECRUIT (${allyCost(L.allyKey)} caps)`, "recruit", null, { cls: "btn-primary" })}</div>
        </div>` : '<p class="empty">No one here is looking for work right now.</p>'}
    </section>`;
}

/* ---------------------------
   LOG TAB
--------------------------- */
function renderLog() {
  const rows = state.log.slice().reverse().map((l) => {
    const d = new Date(l.t);
    const ts = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `<p class="log-${l.cls}"><span class="ts">[${ts}]</span> ${esc(l.msg)}</p>`;
  }).join("");
  $("tab-log").innerHTML = `
    <section class="panel">
      <h2 class="panel-title">LOG <span class="muted">${state.log.length} entries</span></h2>
      <div class="btn-row">${btn("CLEAR LOG", "clearLog", null, { cls: "mini-btn" })}</div>
      <div class="log-output">${rows || '<p class="empty">Empty.</p>'}</div>
    </section>`;
}

/* ---------------------------
   MODAL
--------------------------- */
function showModal({ title, body, buttons = [{ label: "OK" }], dismissible = true }) {
  const m = $("modal");
  modalCallbacks = buttons.map((b) => b.fn || null);
  m.dataset.dismissible = dismissible ? "1" : "";
  m.innerHTML = `<div class="modal-box">
      <h2 class="modal-title">${title}</h2>
      <div class="modal-body">${body}</div>
      <div class="btn-row center">${buttons.map((b, i) => `<button class="${b.cls || ""}" data-modal="${i}"${b.disabled ? " disabled" : ""}>${b.label}</button>`).join("")}</div>
    </div>`;
  m.classList.remove("hidden");
}

function closeModal() {
  $("modal").classList.add("hidden");
  modalCallbacks = [];
}

function showDeathModal() {
  const hasCamp = state.camp.deployed;
  showModal({
    title: "YOU HAVE DIED",
    dismissible: false,
    body: `<pre class="ascii center">   _____
  /     \\
 | () () |
  \\  ^  /
   |||||</pre>
      <p>The wasteland claims another wanderer.</p>
      <p class="muted small">Respawning costs 10% of your caps and half of the junk you carry.</p>`,
    buttons: [
      { label: hasCamp ? "RESPAWN AT C.A.M.P." : "RESPAWN AT VAULT RUINS", cls: "btn-primary", fn: respawn },
      { label: "NEW GAME", cls: "btn-danger", fn: () => { newGame(); } }
    ]
  });
}

/* ============================================================
   INPUT
============================================================ */
function slotChoices(fn, requireData) {
  const out = [];
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const m = saveMeta(Store.get(slotKey(n)));
    out.push({
      label: `SLOT ${n}<span class="slot-sub">${describeSave(m)}</span>`,
      cls: "slot-btn",
      disabled: requireData && !m,
      fn: () => fn(n)
    });
  }
  return out;
}

let lastMapClick = { id: null, t: 0 };

const ACTIONS = {
  tab: (t) => { state.ui.tab = t; Sound.play("nav"); },
  addStat,
  scavenge,
  recruit: recruitLocal,
  travel: travelTo,
  fastTravel: fastTravelCamp,
  mapRegion: (r) => {
    state.ui.mapRegion = r;
    mapView = null;
    const here = currentLoc();
    state.ui.mapSelected = here.region === r ? here.id : (LOCATIONS.find((l) => l.region === r && isKnown(l)) || here).id;
  },
  mapSelect: (id) => {
    // Clicking the already-selected marker again within 450ms = double-click travel
    const now = Date.now();
    const dbl = state.ui.mapSelected === id && lastMapClick.id === id && now - lastMapClick.t < 450;
    lastMapClick = { id, t: now };
    state.ui.mapSelected = id;
    if (dbl && id !== P().locationId) travelTo(id);
  },
  mapZoom: (dir) => setMapZoom(stepZoom(dir === "in" ? 1 : -1)),
  mapCenter: () => {
    const here = currentLoc();
    state.ui.mapRegion = here.region;
    state.ui.mapSelected = here.id;
    centerMapOn(here);
  },
  searchRoom,
  vaultRest,
  vaultDecon,
  invFilter: (f) => { state.ui.invFilter = f; state.ui.selectedUid = null; },
  selectItem: (uid) => { state.ui.selectedUid = Number(uid); },
  useItem: (uid) => useItem(Number(uid)),
  useByKey: (key) => { const i = P().inventory.find((x) => x.key === key); if (i) useItem(i.uid); },
  dropItem: (uid) => dropItem(Number(uid)),
  scrapItem: (uid) => scrapItem(Number(uid)),
  sellItem: (uid) => sellItem(Number(uid)),
  buy: (idx) => buyItem(Number(idx)),
  craft,
  attack: () => playerAttack(false),
  vats: () => playerAttack(true),
  heal: quickHeal,
  flee,
  loot: lootEnemy,
  leave: leaveCorpse,
  hunt,
  deployCamp,
  rest: restAtCamp,
  build,
  dismantle,
  campView: (v) => { state.ui.campView = v; },
  store: (uid) => storeItem(Number(uid), false),
  storeAll: (uid) => storeItem(Number(uid), true),
  take: (uid) => takeItem(Number(uid), false),
  takeAll: (uid) => takeItem(Number(uid), true),
  storeJunk: storeAllJunk,
  recruitWanderer,
  dismissWanderer: () => {
    if (state.camp.wanderer) log(`The ${ALLIES[state.camp.wanderer].name} moves on.`);
    state.camp.wanderer = null;
  },
  allyHeal: (uid) => allyHeal(Number(uid)),
  allySend: (uid) => allySend(Number(uid)),
  allyRecall: (uid) => allyRecall(Number(uid)),
  allyDismiss: (uid) => allyDismiss(Number(uid)),
  toggleSound: () => { state.settings.muted = !state.settings.muted; savePrefs(); },
  theme: (t) => { if (THEMES.includes(t)) state.settings.theme = t; savePrefs(); },
  saveMenu: () => showModal({
    title: "SAVE GAME",
    body: "<p>Choose a slot. Saving over a slot replaces it.</p>",
    buttons: [
      ...slotChoices((n) => saveToSlot(n), false),
      { label: "CANCEL" }
    ]
  }),
  loadMenu: () => showModal({
    title: "LOAD GAME",
    body: "<p>Load a save slot? Your current game is in the autosave until it's overwritten by the loaded game.</p>",
    buttons: [
      ...slotChoices((n) => {
        if (loadFromObject(Store.get(slotKey(n)), `slot ${n}`)) {
          applyPrefsToState();
          enterGame();
          toast(`Loaded slot ${n}`, "good");
          if (P().dead) showDeathModal();
        } else fail(`Slot ${n} couldn't be read.`);
      }, true),
      { label: "CANCEL" }
    ]
  }),
  exportSave,
  importSave: () => importSave((ok) => {
    if (ok) {
      applyPrefsToState();
      enterGame();
      toast("Save imported", "good");
      render();
      if (P().dead) showDeathModal();
    } else fail("That file isn't a valid Wasteland RPG save.");
  }),
  mainMenu: returnToMenu,
  newGame: () => showModal({
    title: "START A NEW GAME?",
    body: "<p>This erases your current character, C.A.M.P. and progress. There's no undo.</p>",
    buttons: [{ label: "START OVER", cls: "btn-danger", fn: newGame }, { label: "CANCEL" }]
  }),
  clearLog: () => { state.log = []; }
};

const SILENT_ACTIONS = new Set(["tab", "attack", "vats", "travel", "fastTravel", "loot", "recruit", "build", "craft"]);

function runAction(name, arg) {
  const fn = ACTIONS[name];
  if (!fn) return;
  if (!SILENT_ACTIONS.has(name)) Sound.play("click");
  fn(arg);
  clampVitals();
  render();
  saveGame();
}

document.addEventListener("click", (e) => {
  if (!booted || !state) return;
  const modalBtn = e.target.closest("[data-modal]");
  if (modalBtn) {
    const fn = modalCallbacks[Number(modalBtn.dataset.modal)];
    closeModal();
    if (fn) fn();
    Sound.play("click");
    clampVitals();
    render();
    saveGame();
    return;
  }
  if (e.target.id === "modal" && $("modal").dataset.dismissible) {
    closeModal();
    return;
  }
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  if (el.closest("#modal")) return;
  runAction(el.dataset.action, el.dataset.arg);
});

document.addEventListener("keydown", (e) => {
  if (!booted) {
    menuKey(e);
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const modalOpen = !$("modal").classList.contains("hidden");
  if (modalOpen) {
    if (e.key === "Escape" && $("modal").dataset.dismissible) closeModal();
    return;
  }
  const tabs = ["status", "map", "inventory", "combat", "camp", "allies", "log"];
  if (/^[1-7]$/.test(e.key)) {
    runAction("tab", tabs[Number(e.key) - 1]);
    return;
  }
  if (state.ui.tab === "map") {
    const locs = LOCATIONS.filter((l) => l.region === state.ui.mapRegion && isKnown(l));
    const i = locs.findIndex((l) => l.id === state.ui.mapSelected);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = locs[(i + (e.key === "ArrowRight" ? 1 : -1) + locs.length) % locs.length];
      if (next) {
        state.ui.mapSelected = next.id;
        if (state.ui.mapZoom > 1) centerMapOn(next);
        Sound.play("hover");
        render();
      }
    } else if (e.key === "Enter" && state.ui.mapSelected !== P().locationId) {
      e.preventDefault();
      runAction("travel", state.ui.mapSelected);
    } else if (e.key === "+" || e.key === "=") {
      runAction("mapZoom", "in");
    } else if (e.key === "-" || e.key === "_") {
      runAction("mapZoom", "out");
    }
    return;
  }
  if (state.ui.tab !== "combat" || !state.enemy) return;
  const e2 = state.enemy;
  const k = e.key.toLowerCase();
  if (!e2.defeated) {
    if (k === "a") runAction("attack");
    else if (k === "v" && P().ap >= VATS_AP) runAction("vats");
    else if (k === "h") runAction("heal");
    else if (k === "f") runAction("flee");
  } else if (k === "l") runAction("loot");
});

/* ---------------------------
   MAP: drag to pan, wheel to zoom
--------------------------- */
let mapDrag = null;

document.addEventListener("pointerdown", (e) => {
  const vp = e.target.closest("#map-viewport");
  if (!vp || !booted || e.button !== 0 || e.target.closest(".map-marker")) return;
  mapDrag = { vp, x: e.clientX, y: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop };
  vp.classList.add("dragging");
});

document.addEventListener("pointermove", (e) => {
  if (!mapDrag) return;
  mapDrag.vp.scrollLeft = mapDrag.sl - (e.clientX - mapDrag.x);
  mapDrag.vp.scrollTop = mapDrag.st - (e.clientY - mapDrag.y);
});

const endMapDrag = () => {
  if (!mapDrag) return;
  mapDrag.vp.classList.remove("dragging");
  mapDrag = null;
  captureMapView();
};
document.addEventListener("pointerup", endMapDrag);
document.addEventListener("pointercancel", endMapDrag);

document.addEventListener("wheel", (e) => {
  const vp = e.target.closest("#map-viewport");
  if (!vp || !booted) return;
  const target = stepZoom(e.deltaY < 0 ? 1 : -1);
  if (target === state.ui.mapZoom) return;
  e.preventDefault();
  const rect = vp.getBoundingClientRect();
  const ox = e.clientX - rect.left;
  const oy = e.clientY - rect.top;
  setMapZoom(target, {
    fx: (vp.scrollLeft + ox) / vp.scrollWidth,
    fy: (vp.scrollTop + oy) / vp.scrollHeight,
    ox,
    oy
  });
  Sound.play("hover");
}, { passive: false });

/* ============================================================
   TICK / BOOT
============================================================ */
function tick() {
  updateClock();
  if (!booted || !state) return;
  tickCount++;
  const p = P();
  const now = Date.now();
  let dirty = false;
  let apChanged = false;

  const before = p.buffs.length;
  p.buffs = p.buffs.filter((b) => {
    if (b.expiresAt > now) return true;
    log(`${b.name} has worn off.`);
    return false;
  });
  if (p.buffs.length !== before) {
    clampVitals();
    dirty = true;
  }

  if (tickCapsFrenzy()) dirty = true;

  if (tickCount % 3 === 0 && !p.dead && p.ap < maxAp()) {
    p.ap++;
    apChanged = true;
  }

  const c = state.camp;
  if (c.deployed && now - c.lastTick >= CAMP_TICK_MS) {
    c.lastTick = now - ((now - c.lastTick) % CAMP_TICK_MS);
    campTick(false);
    dirty = true;
  }

  if (tickCount % 4 === 0 && randomEncounterCheck()) dirty = true;

  if (dirty) render();
  else {
    if (apChanged && (state.ui.tab === "status" || state.ui.tab === "combat")) renderActive();
    updateHud();
    updateCountdowns();
  }
  if (tickCount % 10 === 0) saveGame();
}

/* ============================================================
   START-UP MENU
   Power-on screen -> typed boot sequence -> main menu.
   All menu sounds go through Sound (your files in sounds/ or synth).
============================================================ */
const BOOT_LINES = [
  "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
  "PIP-UNIT 3000 BIOS v2.287",
  "> CHECKING MEMORY ........ 64K OK",
  "> LOADING S.P.E.C.I.A.L. MODULE ...... OK",
  "> C.A.M.P. DEVICE LINK ...... OK",
  "> CALIBRATING GEIGER COUNTER ...... OK",
  `> HOLOTAPE STORAGE ...... ${Store.available ? "OK" : "UNAVAILABLE"}`
];

let powered = false;
let typing = false;
let menuOpen = false;
let menuView = "main";
let menuMsg = "";
let menuConfirmDelete = null;
let skipTyping = null;

function showPowerScreen() {
  $("boot").classList.remove("hidden", "fade");
  $("boot-press").classList.remove("hidden");
  $("boot-text").classList.add("hidden");
  $("start-menu").classList.add("hidden");
}

function powerOn() {
  if (powered) return;
  powered = true;
  Sound.unlock();
  Sound.play("power");
  $("boot-press").classList.add("hidden");
  const box = $("boot-text");
  box.classList.remove("hidden");
  box.textContent = "";
  typeLines(BOOT_LINES, box, () => setTimeout(() => { if (!booted && !menuOpen) openMenu(); }, 350));
}

function typeLines(lines, box, done) {
  typing = true;
  let li = 0;
  let ci = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    typing = false;
    skipTyping = null;
    done();
  };
  skipTyping = () => {
    box.textContent = `${lines.join("\n")}\n`;
    finish();
  };
  const step = () => {
    if (finished) return;
    if (li >= lines.length) return finish();
    const line = lines[li];
    if (ci < line.length) {
      box.textContent += line.slice(ci, ci + 2);
      ci += 2;
      // A sample file plays once per line; the synth ticks per keystroke.
      if (!Sound.samples.terminal_type || ci === 2) Sound.play("type");
      setTimeout(step, 14);
    } else {
      box.textContent += "\n";
      li++;
      ci = 0;
      setTimeout(step, 110);
    }
  };
  setTimeout(step, 450);
}

function openMenu() {
  menuOpen = true;
  menuView = "main";
  menuMsg = "";
  menuConfirmDelete = null;
  $("boot").classList.remove("hidden", "fade");
  $("boot-press").classList.add("hidden");
  $("boot-text").classList.add("hidden");
  $("start-menu").classList.remove("hidden");
  renderMenu();
  Sound.startAmbience();
}

function menuItem(id, label, { sub = "", disabled = false, cls = "" } = {}) {
  return `<button class="menu-item ${cls}" data-menu="${id}"${disabled ? " disabled" : ""}>
    <span class="menu-label">${label}</span>${sub ? `<span class="menu-sub">${sub}</span>` : ""}</button>`;
}

const describeSave = (meta) => (meta ? `${metaLine(meta)} · ${formatSavedAt(meta.savedAt)}` : "Empty");

function renderMenu() {
  const auto = saveMeta(Store.get(SAVE_KEY));
  let title = "";
  let info = "";
  let items = "";

  if (menuView === "main") {
    items =
      menuItem("continue", "CONTINUE", { sub: auto ? describeSave(auto) : "No saved game", disabled: !auto }) +
      menuItem("new", "NEW GAME") +
      menuItem("load", "LOAD GAME", { sub: "Save slots & import from file" }) +
      menuItem("options", "OPTIONS");
  } else if (menuView === "load") {
    title = "LOAD GAME";
    items = menuItem("load-auto", "AUTOSAVE", { sub: describeSave(auto), disabled: !auto });
    for (let n = 1; n <= SLOT_COUNT; n++) {
      const m = saveMeta(Store.get(slotKey(n)));
      items += `<div class="menu-slot">${menuItem(`load-slot-${n}`, `SLOT ${n}`, { sub: describeSave(m), disabled: !m })}${
        m ? `<button class="menu-del" data-menu="del-slot-${n}" title="Delete slot ${n}">${menuConfirmDelete === n ? "SURE?" : "✕"}</button>` : ""}</div>`;
    }
    items += menuItem("import", "IMPORT FROM FILE", { sub: "A .json save exported from this game" }) + menuItem("back", "BACK");
  } else if (menuView === "options") {
    title = "OPTIONS";
    items =
      menuItem("opt-sound", `SOUND: ${prefs.muted ? "OFF" : "ON"}`) +
      menuItem("opt-theme", `COLOR: ${prefs.theme.toUpperCase()}`) +
      menuItem("back", "BACK");
  } else if (menuView === "confirmNew") {
    title = "START A NEW GAME?";
    info = "Your autosave will be replaced. Manual save slots are kept.";
    items = menuItem("new-confirm", "YES, START OVER", { cls: "danger" }) + menuItem("back", "BACK");
  }

  $("start-menu").innerHTML = `
    <div class="menu-logo">
      <div class="menu-title">WASTELAND RPG</div>
      <div class="menu-tagline">PIP-UNIT 3000 · ROBCO INDUSTRIES</div>
    </div>
    ${title ? `<div class="menu-heading">${title}</div>` : ""}
    ${info ? `<p class="menu-info">${info}</p>` : ""}
    <div class="menu-items">${items}</div>
    ${menuMsg ? `<p class="menu-msg">${esc(menuMsg)}</p>` : ""}
    ${Store.available ? "" : '<p class="menu-msg">Browser storage is blocked, so progress can\'t be saved. Use EXPORT in-game to keep a file.</p>'}
    <p class="menu-hint">↑ ↓ SELECT · ENTER CONFIRM · ESC BACK</p>`;
  const first = $("start-menu").querySelector(".menu-item:not(:disabled)");
  if (first) first.focus({ preventScroll: true });
}

function setMenuView(view) {
  menuView = view;
  menuMsg = "";
  menuConfirmDelete = null;
  renderMenu();
}

function applyPrefsToState() {
  state.settings.muted = prefs.muted;
  state.settings.theme = prefs.theme;
}

function startGame() {
  applyPrefsToState();
  enterGame();
  menuOpen = false;
  booted = true;
  Sound.stopAmbience();
  Sound.play("start");
  $("boot").classList.add("fade");
  setTimeout(() => { if (!menuOpen) $("boot").classList.add("hidden"); }, 450);
  render();
  if (P().dead) showDeathModal();
}

function startNewGame() {
  newGame();
  startGame();
}

function returnToMenu() {
  saveGame();
  savePrefs();
  closeModal();
  booted = false;
  openMenu();
}

function handleMenu(id) {
  const back = id === "back";
  Sound.play(back ? "back" : "select");
  if (!id.startsWith("del-slot-")) menuConfirmDelete = null;

  if (id === "continue" || id === "load-auto") {
    if (loadGame()) startGame();
    else { menuMsg = "The autosave couldn't be read."; renderMenu(); }
  } else if (id === "new") {
    if (saveMeta(Store.get(SAVE_KEY))) setMenuView("confirmNew");
    else startNewGame();
  } else if (id === "new-confirm") {
    startNewGame();
  } else if (id === "load") {
    setMenuView("load");
  } else if (id.startsWith("load-slot-")) {
    const n = Number(id.slice(10));
    if (loadFromObject(Store.get(slotKey(n)), `slot ${n}`)) startGame();
    else { menuMsg = `Slot ${n} couldn't be read.`; renderMenu(); }
  } else if (id.startsWith("del-slot-")) {
    const n = Number(id.slice(9));
    if (menuConfirmDelete === n) {
      deleteSlot(n);
      menuConfirmDelete = null;
      menuMsg = `Slot ${n} deleted.`;
    } else {
      menuConfirmDelete = n;
      menuMsg = "";
    }
    renderMenu();
  } else if (id === "import") {
    importSave((ok) => {
      if (ok) startGame();
      else { menuMsg = "That file isn't a valid Wasteland RPG save."; renderMenu(); }
    });
  } else if (id === "options") {
    setMenuView("options");
  } else if (id === "opt-sound") {
    prefs.muted = !prefs.muted;
    savePrefs();
    if (prefs.muted) Sound.stopAmbience();
    else Sound.startAmbience();
    renderMenu();
    $("start-menu").querySelector('[data-menu="opt-sound"]').focus();
  } else if (id === "opt-theme") {
    prefs.theme = THEMES[(THEMES.indexOf(prefs.theme) + 1) % THEMES.length];
    document.documentElement.dataset.theme = prefs.theme;
    savePrefs();
    renderMenu();
    $("start-menu").querySelector('[data-menu="opt-theme"]').focus();
  } else if (back) {
    setMenuView("main");
  }
}

/* Keyboard while the start-up screens are showing */
function menuKey(e) {
  if (!powered) {
    powerOn();
    return;
  }
  if (typing) {
    if (skipTyping) skipTyping();
    return;
  }
  if (!menuOpen) return;
  const buttons = [...$("start-menu").querySelectorAll("button:not(:disabled)")];
  const idx = buttons.indexOf(document.activeElement);
  if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "s" || e.key === "w") {
    e.preventDefault();
    const dir = e.key === "ArrowDown" || e.key === "s" ? 1 : -1;
    const next = buttons[(idx + dir + buttons.length) % buttons.length];
    if (next) next.focus();
  } else if (e.key === "Escape" && menuView !== "main") {
    handleMenu("back");
  }
}

$("boot").addEventListener("click", (e) => {
  if (!powered) return powerOn();
  if (typing && skipTyping) return skipTyping();
  const el = e.target.closest("[data-menu]");
  if (el && !el.disabled) handleMenu(el.dataset.menu);
});

let lastHovered = null;
$("start-menu").addEventListener("focusin", (e) => {
  const el = e.target.closest("button");
  if (el && el !== lastHovered) {
    lastHovered = el;
    Sound.play("hover");
  }
});
$("start-menu").addEventListener("mouseover", (e) => {
  const el = e.target.closest("button:not(:disabled)");
  if (el && document.activeElement !== el) el.focus({ preventScroll: true });
});

function init() {
  // First run with this version: carry sound/theme over from an existing autosave.
  if (!Store.get(PREFS_KEY)) {
    const auto = Store.get(SAVE_KEY);
    if (auto && auto.settings) {
      prefs.muted = !!auto.settings.muted;
      if (THEMES.includes(auto.settings.theme)) prefs.theme = auto.settings.theme;
    }
    Store.set(PREFS_KEY, prefs);
  }
  document.documentElement.dataset.theme = prefs.theme;
  updateClock();
  showPowerScreen();
  setInterval(tick, 1000);
}

init();
