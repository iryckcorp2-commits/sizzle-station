// Sizzle Station — main loop: wires input to the world and renders every frame.
(function () {
  'use strict';

  var CFG = SizzleConfig.CONFIG;
  var world = SizzleWorld.createWorld(20261125);
  // Debug/test handle: lets a play-test driver read the live state.
  window.__sizzle = { world: world };
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var last = performance.now();
  var shot = 0;

  function anyPanCooking() {
    return world.pans.some(function (p) { return p.state === 'cooking'; });
  }

  function refreshSizzle() {
    if (anyPanCooking()) SizzleAudio.startSizzle();
    else SizzleAudio.stopSizzle();
  }

  function doAction(action) {
    if (!action) return;
    var parts = action.split(':');
    var kind = parts[0], arg = parts[1];
    SizzleAudio.unlock();
    if (kind === 'start' || kind === 'restart') {
      SizzleWorld.startShift(world);
      SizzleAudio.click();
    } else if (kind === 'add') {
      var r = SizzleWorld.addIngredient(world, arg);
      if (r === 'plated' || r === 'pan') SizzleAudio.add();
      else if (r === 'wrong') SizzleAudio.error();
      else SizzleAudio.click();
    } else if (kind === 'pan') {
      var pr = SizzleWorld.clickPan(world, parseInt(arg, 10));
      if (pr === 'plated') SizzleAudio.add();
      else if (pr === 'trashed') SizzleAudio.error();
      else SizzleAudio.click();
    } else if (kind === 'remove') {
      if (SizzleWorld.removePlateItem(world, parseInt(arg, 10))) SizzleAudio.click();
    } else if (kind === 'serve') {
      var sr = SizzleWorld.serve(world);
      if (sr === 'served') SizzleAudio.serve();
      else if (sr === 'incomplete') SizzleAudio.error();
      else SizzleAudio.ding();
    } else if (kind === 'mute') {
      world.muted = !world.muted;
      SizzleAudio.setMuted(world.muted);
      SizzleAudio.click();
    }
    refreshSizzle();
  }

  function onKey(key, ev) {
    if (key === 'Enter') {
      if (world.phase === 'title' || world.phase === 'over') doAction('start');
      return;
    }
    if (key === 'r' || key === 'R') { doAction('restart'); return; }
    if (key === 'm' || key === 'M') { doAction('mute'); return; }
    if (key === 'p' || key === 'P') {
      if (world.phase === 'playing') { world.paused = !world.paused; SizzleAudio.click(); }
      return;
    }
    if (key === ' ' || key === 'Spacebar') { ev.preventDefault(); doAction('serve'); return; }
    if (key === 'Backspace') {
      if (world.plate.length > 0) SizzleWorld.removePlateItem(world, world.plate.length - 1);
      return;
    }
    var ing = SizzleConfig.INGREDIENTS.filter(function (g) { return g.key === key; })[0];
    if (ing) { world.stats.keys += 1; doAction('add:' + ing.id); }
  }

  SizzleInput.bind(canvas, {
    onAction: function (action) { world.stats.clicks += 1; doAction(action); },
    onKey: onKey
  });

  // Screenshot staging (?shot=1..4) runs before the first frame.
  shot = SizzleShots.applyFromUrl(world);

  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (world.phase === 'playing' && !world.paused && !world.frozen) {
      SizzleWorld.update(world, dt);
      refreshSizzle();
    }
    SizzleRender.render(ctx, world, now / 1000);
    if (shot) {
      // Let the first frame paint, then signal the screenshot driver.
      if (!window.__shotReady) {
        window.__shotReady = true;
        document.title = 'shot-' + shot + '-ready';
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
