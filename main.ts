// Sizzle Station — main.ts (Node 22).
// Entry program for the make.fun "Make the best cooking game" bounty.
// It verifies the game offline: required files exist, the game loads no external
// resource, and a scripted shift plays deterministically (same seed + same actions
// always give the same result). It writes a deterministic report to the output
// directory and makes no network request and no model call.
// It hands the game in: it copies game/ and screenshots/ to the output directory
// and writes dossier.json with buildDossier from vendor/makefun-game.ts, as the
// kit's starter does. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SEED = 20261125;

const REQUIRED_FILES: string[] = [
  'game/index.html',
  'game/src/config.js',
  'game/src/random.js',
  'game/src/world.js',
  'game/src/audio.js',
  'game/src/input.js',
  'game/src/render.js',
  'game/src/shots.js',
  'game/src/main.js',
  'vendor/makefun-game.ts',
  'LICENSE',
  'README.md'
];

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function checkFiles(): { path: string; bytes: number; sha256: string }[] {
  const manifest: { path: string; bytes: number; sha256: string }[] = [];
  for (const rel of REQUIRED_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) throw new Error('missing required file: ' + rel);
    manifest.push({ path: rel, bytes: fs.statSync(full).size, sha256: sha256(full) });
  }
  return manifest;
}

function checkOffline(): string[] {
  // The game must run offline from static files: no external URL in game code.
  const bad: string[] = [];
  const re = /(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/gi;
  for (const rel of REQUIRED_FILES) {
    if (!rel.startsWith('game/')) continue;
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const hits = text.match(re);
    if (hits) bad.push(rel + ': ' + hits.join(', '));
  }
  return bad;
}

type WorldApi = {
  createWorld(seed: number): any;
  startShift(w: any): void;
  currentOrder(w: any): any;
  plateNeeds(w: any): string[];
  plateComplete(w: any): boolean;
  addIngredient(w: any, id: string): string;
  clickPan(w: any, i: number): string;
  serve(w: any): string;
  update(w: any, dt: number): void;
};

function playShift(worldApi: WorldApi, seed: number): Record<string, unknown> {
  const w = worldApi.createWorld(seed);
  worldApi.startShift(w);
  const step = 0.1;
  let t = 0;
  const actions: string[] = [];
  // Scripted chef: always work on the oldest order until the shift ends.
  while (w.phase === 'playing' && t < 170) {
    const order = worldApi.currentOrder(w);
    if (order) {
      if (worldApi.plateComplete(w)) {
        const r = worldApi.serve(w);
        actions.push('serve:' + r);
      } else {
        const need = worldApi.plateNeeds(w);
        for (const id of need) {
          // Is it already cooking or done in a pan?
          let panIdx = -1;
          for (let p = 0; p < w.pans.length; p++) {
            if (w.pans[p].item === id && (w.pans[p].state === 'done' || w.pans[p].state === 'cooking')) { panIdx = p; break; }
          }
          if (panIdx >= 0) {
            if (w.pans[panIdx].state === 'done') {
              const r = worldApi.clickPan(w, panIdx);
              actions.push('pan' + panIdx + ':' + r);
            }
            continue;
          }
          const r = worldApi.addIngredient(w, id);
          actions.push('add:' + id + ':' + r);
        }
      }
    }
    worldApi.update(w, step);
    t += step;
  }
  return {
    seed, phase: w.phase, score: w.score, coins: w.coins,
    served: w.served, missed: w.missed, bestCombo: w.bestCombo,
    plate: w.plate, ordersLeft: w.orders.length, actions: actions.length
  };
}

function main(): void {
  const manifest = checkFiles();
  const external = checkOffline();
  if (external.length > 0) {
    throw new Error('game files reference external URLs: ' + external.join(' ; '));
  }

  const require = createRequire(import.meta.url);
  // world.js reads these globals at load time, so set them before requiring it.
  const configApi = require(path.join(ROOT, 'game', 'src', 'config.js'));
  const randomApi = require(path.join(ROOT, 'game', 'src', 'random.js'));
  (globalThis as any).SizzleConfig = configApi;
  (globalThis as any).SizzleRandom = randomApi;
  const worldApi2 = require(path.join(ROOT, 'game', 'src', 'world.js')) as WorldApi;

  const runA = playShift(worldApi2, SEED);
  const runB = playShift(worldApi2, SEED);
  const deterministic = JSON.stringify(runA) === JSON.stringify(runB);
  if (!deterministic) throw new Error('simulation is not deterministic');
  if ((runA.served as number) < 2) throw new Error('scripted shift served fewer than 2 dishes');
  if ((runA.score as number) <= 0) throw new Error('scripted shift scored 0');

  const screenshots = ['1-kitchen.jpg', '2-ingredients.jpg', '3-assembly.jpg', '4-serve.jpg']
    .filter((f) => fs.existsSync(path.join(ROOT, 'screenshots', f)))
    .map((f) => ({ path: 'screenshots/' + f, bytes: fs.statSync(path.join(ROOT, 'screenshots', f)).size, sha256: sha256(path.join(ROOT, 'screenshots', f)) }));

  const report = {
    game: 'Sizzle Station',
    bounty: 'best-cooking-game-20261125-0137',
    seed: SEED,
    checks: { files: 'pass', offline: 'pass', deterministic: deterministic ? 'pass' : 'fail' },
    shift: runA,
    screenshots
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // Hand the game in (kit starter pattern): copy game/ and screenshots/ to the
  // output directory, then write dossier.json with the kit's library.
  fs.cpSync(path.join(ROOT, 'game'), path.join(OUT, 'game'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });
  if (fs.existsSync(path.join(ROOT, 'screenshots'))) fs.cpSync(path.join(ROOT, 'screenshots'), path.join(OUT, 'screenshots'), { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'dossier.json'),
    buildDossier(OUT, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      game_max_files: 993,
      game_max_bytes: 50331648,
      game_path_max_bytes: 1000,
    }),
  );

  console.log('Sizzle Station self-test: PASS');
  console.log('  files checked: ' + manifest.length + ' (all present)');
  console.log('  external URLs in game/: none');
  console.log('  deterministic simulation: ' + (deterministic ? 'identical across 2 runs' : 'MISMATCH'));
  console.log('  scripted shift: served ' + runA.served + ', score ' + runA.score + ', coins ' + runA.coins + ', best combo x' + runA.bestCombo);
  console.log('  screenshots in repo: ' + screenshots.length + ' of 4');
  console.log('  wrote report.json, manifest.json and dossier.json to ' + OUT);
}

main();
