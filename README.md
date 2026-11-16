# ☢ Wasteland RPG

A post-apocalyptic, browser-based RPG inspired by the Fallout series, played through a retro Pip-Boy-style terminal. Explore 100+ locations across eight wasteland regions, fight mutants and robots, build your own C.A.M.P., recruit companions, and hunt for hidden Vaults.

No installs, no build step: just HTML, CSS and JavaScript.

> **Fan project.** Wasteland RPG is an unofficial, non-commercial fan game. It is not affiliated with, endorsed by, or sponsored by Bethesda Softworks, ZeniMax Media or Microsoft. *Fallout*, *Vault-Tec*, *Pip-Boy* and related names are trademarks of their respective owners. No game audio or art from the Fallout series is included in this repository.

---

## Features

### Pip-Boy interface
- Retro CRT terminal look with scanlines, flicker and four color themes (green, amber, blue, white)
- Works on desktop and mobile
- Start-up menu with a power-on sequence, plus Continue, New Game, Load Game and Options
- Live HUD for HP (with radiation), AP, XP and caps
- Pop-up notifications and tab alert badges so you never miss an enemy or a level-up

### Character
- **S.P.E.C.I.A.L.** stats: Strength, Perception, Endurance, Charisma, Intelligence, Agility, Luck
- Earn a stat point every level
- Radiation lowers your max HP until you treat it
- Timed chem buffs: Buffout, Psycho, Med-X, Mentats, Rad-X and more

### Combat
- Hit, critical and dodge chances based on your stats
- **V.A.T.S.**: spend AP for a guaranteed, harder-hitting shot
- 39 enemies, including raiders, ghouls, super mutants, robots, cryptids and synths
- Bosses: Deathclaw, Mothman, Scorchbeast, Sentry Bot, Super Mutant Behemoth and Mirelurk Queen
- Rare **★ Legendary** enemy variants with guaranteed high-tier loot

### Items
- 85 items: 21 weapons, 13 armor sets (including power armor), 30 aid and food items, and 20 kinds of junk and crafting material
- Rarity tiers (Common, Uncommon, Rare, Legendary) that scale weapon damage and armor strength
- Buy and sell at vendors; scrap gear into materials

### The wasteland
- **107 locations** across West Virginia, Pennsylvania, Ohio, Maryland, the Capital Wasteland, Massachusetts, Nevada and California
- Interactive map with zoom, drag-to-pan, route lines, distances and exploration tracking
- Location events: radstorms, supply drops, trader caravans, raids and more
- Scavenge for junk at any surface location

### Travel
- **Walk** for free within a region. You might get ambushed, but you might also find a hidden Vault.
- **Fast travel** anywhere you know, in any region. It costs caps based on real distance and drops you off safely.
- Trips home to your C.A.M.P. are half price.

### Vaults
- **31 hidden Vaults** to discover. Every walk to a surface location has a chance to lead you to one.
- Once found, a Vault stays on your map permanently.
- Vaults are **shelters**: no enemies, no radiation, free rest and decontamination.
- Five lootable rooms per Vault (Storage, Medical Bay, Armory, Reactor, Overseer's Office) that restock over time.
- **The Vault-Tec Vault Map**: an ultra-rare (1%) Legendary item that reveals every Vault.

### C.A.M.P.
- Deploy a portable base almost anywhere and move it when you like
- Build 14 structures: beds, stash boxes, bunkhouses, crafting stations, generators, crop plots, water purifiers, turrets and more
- Power grid, stash storage and production cycles that keep running while you're offline
- Craft from 35 recipes, and upgrade your gear's rarity at the workbenches
- Defend against raids with turrets and stationed allies
- A Recruitment Beacon attracts wanderers looking to join you

### Companions
- 24 allies, including Dogmeat, Codsworth, Piper, Nick Valentine, Paladin Danse, Boone, ED-E, Lucy MacLean and more
- Each has a perk: Medic, Scavenger, Sharpshooter, Bodyguard or Silver Tongue
- Allies can be downed in combat; revive them with Stimpaks or by resting
- Bring them in your party, or station them at your C.A.M.P. to gather and defend

### Saving
- Autosaves to your browser after every action
- 3 manual save slots
- Export and import saves as `.json` files to back up your progress or move it between devices
- Older saves are converted automatically

---

## Getting started

### Play locally
1. Clone or download this repository.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge or Safari).

If your browser blocks local files or saving, run a simple local server from the project folder instead:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

### Play online
The game is fully static, so it runs on **GitHub Pages**: go to *Settings → Pages* and deploy from your main branch.

---

## Controls

| Key | Action |
|---|---|
| `1`–`7` | Switch tabs (Stat, Map, Inventory, Combat, C.A.M.P., Allies, Log) |
| `A` | Attack |
| `V` | V.A.T.S. |
| `H` | Use a Stimpak |
| `F` | Flee |
| `L` | Loot |
| `←` `→` | Cycle locations on the map |
| `Enter` | Travel to the selected location |
| `+` `−` / mouse wheel | Zoom the map |
| Drag | Pan the map |
| Double-click | Travel to a location |
| `↑` `↓` `Enter` `Esc` | Navigate the start-up menu |

---

## Custom sounds

Every sound in the game is synthesized by default, so nothing is required. To use your own sound effects, drop `.wav`, `.mp3` or `.ogg` files into the `sounds/` folder with the names listed in [`sounds/README.md`](sounds/README.md) (for example `attack.wav`, `menu_ambience.mp3` or `pipboy_open.wav`). Any missing file falls back to the built-in tone.

Please only commit audio you have the rights to share.

---

## Project structure

```
Wasteland-RPG/
├── index.html      # Page layout and Pip-Boy shell
├── styles.css      # Theme, layout and animations
├── data.js         # All game content: items, enemies, allies,
│                   # locations, vaults, events, structures, recipes
├── game.js         # Game engine, rendering, input, saving
├── sounds/         # Optional custom sound effects (see sounds/README.md)
├── favicon.png
└── caps_icon.png
```

---

## Customizing

Most of the game's content and balance lives in `data.js`, so you can add or tweak things without touching the engine:

- **New items, enemies or allies:** add an entry to `ITEMS`, `ENEMIES` or `ALLIES`
- **New locations:** add to `LOCATIONS` with a region, map position, danger level and enemy list
- **New Vaults:** add to the Vault list; they're hidden automatically until discovered
- **Balance:** fast-travel prices (`FAST_TRAVEL_BASE`, `FAST_TRAVEL_RATE`), Vault discovery chance (`VAULT_DISCOVERY_BASE`), Vault Map drop rate (`VAULT_MAP_CHANCE`), room restock time (`VAULT_RESTOCK_MS`) and C.A.M.P. production speed (`CAMP_TICK_MS`)

---

## Contributing

Pull requests and ideas are welcome! Feel free to open an issue for bugs, balance feedback or feature suggestions.

---

## Disclaimer

This is a fan-made project created for fun and learning. All Fallout-related names and concepts belong to their respective owners. This project is free, non-commercial, and not affiliated with the official Fallout franchise.
