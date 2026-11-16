# Sound files

Put your own sound effects in this folder. Each one can be `.wav`, `.mp3` or `.ogg`.
The game checks for them in that order. Any sound without a file plays a built-in
synthesized tone instead, so you can add as many or as few as you like.

### Start-up menu

| File name (no extension) | When it plays |
|---|---|
| `power_on`      | Pressing a key/clicking on the power-on screen (falls back to `pipboy_open`) |
| `terminal_type` | Boot text typing out (played once per line) |
| `menu_ambience` | Looping background while the menu is open (stops when the game starts) |
| `menu_hover`    | Moving between menu options (falls back to `pipboy_nav`, then `click`) |
| `menu_select`   | Choosing a menu option (falls back to `click`) |
| `menu_back`     | BACK / Esc in the menu (falls back to `click`) |
| `game_start`    | Entering the game from the menu (falls back to `pipboy_open`) |

### In game

| File name (no extension) | When it plays |
|---|---|
| `pipboy_open` | Fallback for `power_on` and `game_start` |
| `pipboy_nav`  | Switching tabs (falls back to `click`) |
| `click`       | Most button presses |
| `attack`      | You hit an enemy |
| `crit`        | Critical hit (falls back to `attack`) |
| `miss`        | Your attack misses |
| `enemy_hit`   | An enemy hits you |
| `loot`        | Looting, buying, selling, scavenging finds |
| `travel`      | Traveling / fast travel |
| `recruit`     | Recruiting an ally |
| `levelup`     | Level up, gear rarity upgrade |
| `build`       | Building, crafting, scrapping |
| `heal`        | Using aid items (falls back to `stimpak`) |
| `alert`       | A hostile appears, C.A.M.P. raid |
| `error`       | An action can't be done |
| `death`       | You die |

Volume is set by `SOUND_VOLUME` (effects) and `AMBIENCE_VOLUME` (menu loop) near the top of `game.js`.

Only use audio you have the rights to use: your own recordings, royalty-free
or CC-licensed packs, or files you've extracted from games you own for
personal use. Don't commit copyrighted game audio to a public repository.
