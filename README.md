# Sizzle Station

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/iryckcorp2-commits/sizzle-station/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/iryckcorp2-commits/sizzle-station/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle Station is an original timed cooking game. Orders land on the board, you
grab ingredients from the counter, cook Egg and Chicken on the stove, assemble
each dish on the plate, and ring the bell to serve before the ticket timer runs
out. Combos grow your score across a 3-minute shift. All art is drawn in code
and all sounds are synthesised in code — the game runs fully offline in a
desktop browser from static files, with keyboard and mouse.

## Run it

```sh
# Play it: open game/index.html in a desktop browser (Chrome), or serve the folder:
python3 -m http.server --directory game 8080
# Self-test (Node 22): verifies the files, the offline rule, and a deterministic
# scripted shift, then writes out/report.json and out/manifest.json:
node main.ts
```

## How to play

- Orders appear on the ORDER BOARD (top left). Each ticket lists the dish and
  its 3 ingredients. Serve the oldest ticket first.
- Click an ingredient bin, or press 1-6, to add it. Rice, Tomato, Lettuce and
  Cheese go straight to the plate. Egg and Chicken go to a pan first: click the
  pan when it says READY to plate it. Leave it too long and it burns — click
  the pan to trash it.
- Click a dish on the plate to take it off. Click the bell, the SERVE button,
  or press Space to serve a complete plate.
- Serve before the ticket timer empties. Wrong ingredients cost 10 points, a
  missed order costs 25. Keys: 1-6 ingredients, Space serve, Backspace remove
  last, P pause, M sound, R restart.

## Screenshots

Real renders of the game's own code (staged with `?shot=1..4`):

- `screenshots/1-kitchen.jpg` — the kitchen and the order board
- `screenshots/2-ingredients.jpg` — ingredients on the counter, plate started
- `screenshots/3-assembly.jpg` — a dish mid-assembly, chicken on the pan
- `screenshots/4-serve.jpg` — a complete plate, ready to serve, timer running

## Layout

- `main.ts` — Node 22 entry program: offline + determinism self-test, writes `out/`
- `game/index.html` — the playable game (opens in desktop Chrome)
- `game/src/` — the game source: config, seeded RNG, pure world logic,
  synthesised audio, input, canvas renderer, screenshot staging, main loop
- `vendor/makefun-game.ts` — copied from the make.fun kit, unmodified
- `screenshots/` — 4 real renders of the game

## License

MIT. See `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
