// Sizzle Station — scripted screenshot staging. ?shot=1..4 puts the live game into
// a fixed, deterministic scene so screenshots are real renders of the game's own code.
(function (global) {
  'use strict';

  var W = global.SizzleWorld;

  // Plate one recipe item the honest way: cookables go through a pan, the rest
  // straight onto the plate. Used by shots 2 and 4.
  function plateItem(world, id) {
    var def = global.SizzleConfig.ingredientById(id);
    if (def.cook) {
      world.pans[0] = { item: id, progress: def.cook, state: 'done' };
      W.clickPan(world, 0);
    } else {
      W.addIngredient(world, id);
    }
  }

  function stageShot(world, n) {
    // Deterministic base: fresh shift from seed 7, then scripted moves.
    var base = W.createWorld(7);
    W.startShift(base);
    // Copy the fresh world over (keeps the same object identity for the loop).
    Object.keys(base).forEach(function (k) { world[k] = base[k]; });
    world.phase = 'playing';

    var order = W.currentOrder(world);
    var recipe = global.SizzleConfig.recipeById(order.recipeId);

    if (n === 1) {
      // Kitchen + order board, ingredients on the counter, timer full.
      W.spawnOrder(world);
      world.timeLeft = 178;
      world.message = 'Two orders on the board. Pick the ingredients for ticket #1!';
    } else if (n === 2) {
      // Ingredients on the table: plate started, bins highlighted.
      plateItem(world, recipe.items[0]);
      plateItem(world, recipe.items[1]);
      world.timeLeft = 164;
      world.message = 'Two ingredients on the plate. One more to go for ticket #1.';
    } else if (n === 3) {
      // One dish mid-assembly: a cookable on the pan, plate 2/3.
      var cookable = null, ready = null;
      recipe.items.forEach(function (id) {
        var def = global.SizzleConfig.ingredientById(id);
        if (def.cook && !cookable) cookable = id;
        else if (!ready) ready = id;
      });
      if (cookable) {
        W.addIngredient(world, cookable);
        W.update(world, 3.0); // pan mid-cook
        if (ready) W.addIngredient(world, ready);
        world.message = global.SizzleConfig.ingredientById(cookable).name + ' is on the pan — watch it cook, then plate it!';
      } else {
        W.addIngredient(world, recipe.items[0]);
        W.addIngredient(world, recipe.items[1]);
        world.message = 'Dish mid-assembly: two ingredients on the plate, one to go.';
      }
      world.timeLeft = 150;
    } else if (n === 4) {
      // Ready to serve: complete plate, bell glowing, timer visible.
      recipe.items.forEach(function (id) { plateItem(world, id); });
      world.timeLeft = 141;
      world.score = 210;
      world.coins = 120;
      world.combo = 2;
      world.served = 1;
      world.message = 'Plate complete! Ring the bell to serve it now.';
    }
    world.flash = null;
    return world;
  }

  function applyFromUrl(world) {
    var params = new URLSearchParams(global.location.search);
    var shot = parseInt(params.get('shot') || '0', 10);
    if (shot >= 1 && shot <= 4) {
      stageShot(world, shot);
      world.frozen = true; // hold the staged scene exactly for the screenshot
      return shot;
    }
    var seed = parseInt(params.get('seed') || '0', 10);
    if (seed) {
      var base = W.createWorld(seed);
      Object.keys(base).forEach(function (k) { world[k] = base[k]; });
    }
    return 0;
  }

  var API = { stageShot: stageShot, applyFromUrl: applyFromUrl };
  global.SizzleShots = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
