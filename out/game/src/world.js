// Sizzle Station — pure game logic (no DOM, no canvas). Usable from the browser
// and from main.ts (Node) for the deterministic self-test.
// State machine: title -> playing -> over. All randomness comes from a seeded RNG.
(function (global) {
  'use strict';

  var CFG = global.SizzleConfig.CONFIG;
  var ING = global.SizzleConfig.INGREDIENTS;
  var RECIPES = global.SizzleConfig.RECIPES;
  var rng = global.SizzleRandom.mulberry32;

  function ingById(id) { return global.SizzleConfig.ingredientById(id); }
  function recipeById(id) { return global.SizzleConfig.recipeById(id); }

  function createWorld(seed) {
    return {
      seed: seed,
      rng: rng(seed),
      phase: 'title', // title | playing | over
      timeLeft: CFG.shiftSeconds,
      elapsed: 0,
      score: 0,
      coins: 0,
      combo: 0,
      bestCombo: 0,
      served: 0,
      missed: 0,
      trashed: 0,
      orderSeq: 0,
      orders: [],       // {id, recipeId, patience, maxPatience, bornAt}
      plate: [],        // ingredient ids currently on the plate
      pans: [           // two stove pans
        { item: null, progress: 0, state: 'empty' }, // state: empty|cooking|done|burnt
        { item: null, progress: 0, state: 'empty' }
      ],
      spawnIn: 2.0,
      message: 'Welcome to Sizzle Station! Press ENTER or click Start.',
      messageAt: 0,
      flash: null,      // {kind, at}
      muted: false,
      paused: false,
      stats: { clicks: 0, keys: 0, serves: 0, wrongAdds: 0 }
    };
  }

  function setMessage(w, text) {
    w.message = text;
    w.messageAt = w.elapsed;
  }

  function spawnOrder(w) {
    if (w.orders.length >= CFG.maxOrders) return false;
    var recipe = RECIPES[Math.floor(w.rng() * RECIPES.length)];
    // Avoid repeating the exact same recipe twice in a row when possible.
    if (w.orders.length > 0) {
      var last = w.orders[w.orders.length - 1];
      if (last.recipeId === recipe.id) {
        recipe = RECIPES[(RECIPES.indexOf(recipe) + 1) % RECIPES.length];
      }
    }
    w.orderSeq += 1;
    w.orders.push({
      id: w.orderSeq,
      recipeId: recipe.id,
      patience: CFG.orderPatienceSeconds,
      maxPatience: CFG.orderPatienceSeconds,
      bornAt: w.elapsed
    });
    return true;
  }

  function startShift(w) {
    w.phase = 'playing';
    w.timeLeft = CFG.shiftSeconds;
    w.elapsed = 0;
    w.score = 0;
    w.coins = 0;
    w.combo = 0;
    w.bestCombo = 0;
    w.served = 0;
    w.missed = 0;
    w.trashed = 0;
    w.orderSeq = 0;
    w.orders = [];
    w.plate = [];
    w.pans = [
      { item: null, progress: 0, state: 'empty' },
      { item: null, progress: 0, state: 'empty' }
    ];
    w.spawnIn = 1.0;
    w.stats = { clicks: 0, keys: 0, serves: 0, wrongAdds: 0 };
    spawnOrder(w);
    setMessage(w, 'Shift started! First order is up. Click ingredients to cook and serve.');
  }

  function currentOrder(w) {
    return w.orders.length > 0 ? w.orders[0] : null;
  }

  // What the plate still needs for the oldest order.
  function plateNeeds(w) {
    var order = currentOrder(w);
    if (!order) return [];
    var recipe = recipeById(order.recipeId);
    var need = recipe.items.slice();
    for (var i = 0; i < w.plate.length; i++) {
      var idx = need.indexOf(w.plate[i]);
      if (idx >= 0) need.splice(idx, 1);
    }
    return need;
  }

  function plateComplete(w) {
    var order = currentOrder(w);
    if (!order) return false;
    return plateNeeds(w).length === 0 && w.plate.length === recipeById(order.recipeId).items.length;
  }

  // Add an ingredient: cookable ones go to a free pan, ready ones go to the plate.
  // Returns: 'plated' | 'pan' | 'pan-full' | 'wrong' | 'no-order' | 'not-playing'
  function addIngredient(w, id) {
    if (w.phase !== 'playing' || w.paused) return 'not-playing';
    var order = currentOrder(w);
    if (!order) return 'no-order';
    var recipe = recipeById(order.recipeId);
    var need = plateNeeds(w);
    if (need.indexOf(id) < 0) {
      w.score = Math.max(0, w.score - CFG.wrongIngredientPenalty);
      w.combo = 0;
      w.stats.wrongAdds += 1;
      setMessage(w, ingById(id).name + ' is not in this order! -' + CFG.wrongIngredientPenalty + ' pts.');
      w.flash = { kind: 'wrong', at: w.elapsed };
      return 'wrong';
    }
    var def = ingById(id);
    if (def.cook) {
      // Already cooking / cooked in a pan?
      for (var p = 0; p < w.pans.length; p++) {
        if (w.pans[p].item === id && w.pans[p].state !== 'burnt') return 'pan';
      }
      for (var q = 0; q < w.pans.length; q++) {
        if (w.pans[q].state === 'empty') {
          w.pans[q] = { item: id, progress: 0, state: 'cooking' };
          setMessage(w, def.name + ' on the pan. Wait for it to cook, then click the pan.');
          return 'pan';
        }
      }
      setMessage(w, 'Both pans are busy! Wait for one to finish.');
      return 'pan-full';
    }
    w.plate.push(id);
    setMessage(w, def.name + ' added to the plate.');
    return 'plated';
  }

  // Click a pan: done -> move to plate; burnt -> trash it.
  function clickPan(w, panIndex) {
    if (w.phase !== 'playing' || w.paused) return 'not-playing';
    var pan = w.pans[panIndex];
    if (!pan || pan.state === 'empty' || pan.state === 'cooking') return 'nothing';
    if (pan.state === 'burnt') {
      w.trashed += 1;
      w.pans[panIndex] = { item: null, progress: 0, state: 'empty' };
      setMessage(w, 'Burnt ' + ingById(pan.item).name + ' trashed. Watch the pan timer!');
      return 'trashed';
    }
    // done
    var order = currentOrder(w);
    if (!order) return 'nothing';
    if (plateNeeds(w).indexOf(pan.item) < 0) {
      setMessage(w, 'That ' + ingById(pan.item).name + ' is not needed anymore. It stays in the pan.');
      return 'nothing';
    }
    w.plate.push(pan.item);
    w.pans[panIndex] = { item: null, progress: 0, state: 'empty' };
    setMessage(w, ingById(w.plate[w.plate.length - 1]).name + ' cooked and plated. Nice!');
    return 'plated';
  }

  function removePlateItem(w, index) {
    if (w.phase !== 'playing' || w.paused) return false;
    if (index < 0 || index >= w.plate.length) return false;
    var removed = w.plate.splice(index, 1)[0];
    setMessage(w, ingById(removed).name + ' taken off the plate.');
    return true;
  }

  function serve(w) {
    if (w.phase !== 'playing' || w.paused) return 'not-playing';
    var order = currentOrder(w);
    if (!order) return 'no-order';
    if (!plateComplete(w)) {
      setMessage(w, 'Plate is not complete yet. Check the order ticket!');
      w.flash = { kind: 'wrong', at: w.elapsed };
      return 'incomplete';
    }
    var recipe = recipeById(order.recipeId);
    var patienceRatio = Math.max(0, order.patience / order.maxPatience);
    var bonus = Math.round(CFG.servePatienceBonusMax * patienceRatio);
    var comboMult = 1 + Math.min(w.combo, CFG.comboMax) * CFG.comboStep;
    var points = Math.round((recipe.price + bonus) * comboMult);
    w.score += points;
    w.coins += recipe.price;
    w.served += 1;
    w.combo += 1;
    if (w.combo > w.bestCombo) w.bestCombo = w.combo;
    w.stats.serves += 1;
    w.orders.shift();
    w.plate = [];
    setMessage(w, recipe.name + ' served! +' + points + ' pts' + (w.combo > 1 ? ' (combo x' + w.combo + ')' : '') + '.');
    w.flash = { kind: 'serve', at: w.elapsed };
    return 'served';
  }

  function endShift(w) {
    w.phase = 'over';
    setMessage(w, 'Shift over! You served ' + w.served + ' dishes and scored ' + w.score + ' pts.');
  }

  function update(w, dt) {
    if (w.phase !== 'playing' || w.paused) return;
    w.elapsed += dt;
    w.timeLeft -= dt;
    if (w.timeLeft <= 0) {
      w.timeLeft = 0;
      endShift(w);
      return;
    }
    // Order patience.
    for (var i = w.orders.length - 1; i >= 0; i--) {
      w.orders[i].patience -= dt;
      if (w.orders[i].patience <= 0) {
        var lost = w.orders.splice(i, 1)[0];
        w.missed += 1;
        w.combo = 0;
        w.score = Math.max(0, w.score - CFG.missedOrderPenalty);
        setMessage(w, 'Order #' + lost.id + ' (' + recipeById(lost.recipeId).name + ') walked away! -' + CFG.missedOrderPenalty + ' pts.');
        w.flash = { kind: 'wrong', at: w.elapsed };
      }
    }
    // Pan cooking.
    for (var p = 0; p < w.pans.length; p++) {
      var pan = w.pans[p];
      if (pan.state === 'cooking') {
        pan.progress += dt;
        var need = CFG.cookTime[pan.item];
        if (pan.progress >= need) {
          pan.state = 'done';
          setMessage(w, ingById(pan.item).name + ' is cooked! Click the pan to plate it.');
        }
      } else if (pan.state === 'done') {
        pan.progress += dt;
        if (pan.progress >= CFG.cookTime[pan.item] + CFG.burnAfterSeconds) {
          pan.state = 'burnt';
          setMessage(w, ingById(pan.item).name + ' burnt! Click the pan to trash it.');
        }
      }
    }
    // Spawn new orders.
    w.spawnIn -= dt;
    if (w.spawnIn <= 0) {
      if (spawnOrder(w)) {
        w.spawnIn = CFG.orderIntervalSeconds * (0.85 + w.rng() * 0.3);
      } else {
        w.spawnIn = 3.0;
      }
    }
  }

  // Deterministic scripted play: used by main.ts self-test and by screenshots.
  // actions: [{at, do:'add'|'serve'|'pan'|'remove', id|index}]
  function simulate(seed, actions, seconds, step) {
    var w = createWorld(seed);
    startShift(w);
    var t = 0;
    var ai = 0;
    var log = [];
    step = step || 0.1;
    while (t < seconds && w.phase === 'playing') {
      while (ai < actions.length && actions[ai].at <= t) {
        var a = actions[ai];
        var res = 'none';
        if (a.do === 'add') res = addIngredient(w, a.id);
        else if (a.do === 'serve') res = serve(w);
        else if (a.do === 'pan') res = clickPan(w, a.index || 0);
        else if (a.do === 'remove') res = removePlateItem(w, a.index || 0);
        log.push({ at: +t.toFixed(2), do: a.do, id: a.id || null, res: res, score: w.score });
        ai += 1;
      }
      update(w, step);
      t += step;
    }
    return {
      seed: seed, seconds: seconds, phase: w.phase,
      score: w.score, coins: w.coins, served: w.served, missed: w.missed,
      combo: w.combo, bestCombo: w.bestCombo, plate: w.plate.slice(),
      orders: w.orders.map(function (o) { return o.recipeId; }),
      log: log
    };
  }

  var API = {
    createWorld: createWorld, startShift: startShift, spawnOrder: spawnOrder,
    currentOrder: currentOrder, plateNeeds: plateNeeds, plateComplete: plateComplete,
    addIngredient: addIngredient, clickPan: clickPan, removePlateItem: removePlateItem,
    serve: serve, update: update, endShift: endShift, simulate: simulate
  };
  global.SizzleWorld = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
