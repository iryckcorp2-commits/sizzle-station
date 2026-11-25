// Sizzle Station — canvas renderer. All art is drawn in code (vector shapes only,
// no images, no web fonts) so the game runs fully offline and screenshots are exact.
(function (global) {
  'use strict';

  var CFG = global.SizzleConfig.CONFIG;
  var ING = global.SizzleConfig.INGREDIENTS;
  var W = CFG.width, H = CFG.height;

  var L = {
    header: { x: 0, y: 0, w: 1280, h: 64 },
    board: { x: 24, y: 80, w: 600, h: 136 },
    menu: { x: 648, y: 80, w: 608, h: 136 },
    stove: { x: 40, y: 300, w: 300, h: 240 },
    bins: { x: 372, y: 300, w: 560, h: 240 },
    bell: { x: 964, y: 300, w: 276, h: 240 },
    plate: { x: 360, y: 580, w: 560, h: 150 },
    serve: { x: 960, y: 600, w: 280, h: 96 },
    footer: { x: 0, y: 748, w: 1280, h: 52 }
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, s, x, y, size, color, align, weight) {
    ctx.fillStyle = color;
    ctx.font = (weight || 'bold') + ' ' + size + 'px sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  function ingById(id) { return global.SizzleConfig.ingredientById(id); }

  // ---- ingredient icons (vector) ----
  function drawIngredient(ctx, id, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    if (id === 'rice') {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8dcc0';
      for (var i = 0; i < 7; i++) {
        var a = i * 0.9, d = r * 0.45;
        ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.13, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    } else if (id === 'egg') {
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.82, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ddd2b8'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.82, 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8f00';
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.22, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'chicken') {
      ctx.fillStyle = '#d97b3f';
      ctx.beginPath(); ctx.ellipse(-r * 0.15, r * 0.1, r * 0.75, r * 0.6, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f3e2c7'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.35, -r * 0.35); ctx.lineTo(r * 0.8, -r * 0.8); ctx.stroke();
      ctx.fillStyle = '#f3e2c7';
      ctx.beginPath(); ctx.arc(r * 0.85, -r * 0.85, r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.62, -r * 0.98, r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b45a1e';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.18, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'tomato') {
      ctx.fillStyle = '#e63b2e';
      ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7a6b';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f9142';
      for (var k = 0; k < 5; k++) {
        var an = -Math.PI / 2 + (k - 2) * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.75);
        ctx.lineTo(Math.cos(an) * r * 0.5, -r * 0.75 + Math.sin(an) * r * 0.45);
        ctx.lineTo(Math.cos(an + 0.3) * r * 0.28, -r * 0.75 + Math.sin(an + 0.3) * r * 0.3);
        ctx.closePath(); ctx.fill();
      }
    } else if (id === 'lettuce') {
      ctx.fillStyle = '#57b24a';
      for (var j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.ellipse((j - 1) * r * 0.45, r * 0.15, r * 0.55, r * 0.7, (j - 1) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#2f7a26'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.6); ctx.stroke();
    } else if (id === 'cheese') {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.6); ctx.lineTo(r * 0.9, r * 0.6); ctx.lineTo(r * 0.9, -r * 0.2);
      ctx.lineTo(0, -r * 0.85); ctx.lineTo(-r * 0.9, -r * 0.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9a400';
      ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.15, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.25, r * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, r * 0.35, r * 0.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawChefHat(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-34, 10); ctx.bezierCurveTo(-44, -18, -22, -26, -12, -12);
    ctx.bezierCurveTo(-6, -26, 10, -26, 14, -12);
    ctx.bezierCurveTo(26, -26, 44, -16, 34, 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-36, 8, 72, 12);
    ctx.strokeRect(-36, 8, 72, 12);
    ctx.restore();
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function render(ctx, w, now) {
    var Input = global.SizzleInput;
    Input.clearClickables();
    ctx.clearRect(0, 0, W, H);

    // Wall + floor
    ctx.fillStyle = '#f7ead7'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#efe0c3';
    for (var ty = 232; ty < 560; ty += 46) {
      for (var tx = 0; tx < W; tx += 92) {
        ctx.fillRect(tx + ((ty / 46) % 2) * 46, ty, 88, 42);
      }
    }
    ctx.fillStyle = '#e8d3ac'; ctx.fillRect(0, 560, W, 20);
    ctx.fillStyle = '#d9c49a'; ctx.fillRect(0, 580, W, 168);

    drawHeader(ctx, w);
    drawBoard(ctx, w);
    drawMenu(ctx, w);
    drawStove(ctx, w, now);
    drawBins(ctx, w);
    drawBell(ctx, w);
    drawPlate(ctx, w);
    drawFooter(ctx, w);

    if (w.phase === 'title') drawTitle(ctx, w);
    if (w.phase === 'over') drawGameOver(ctx, w);
    if (w.paused && w.phase === 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
      text(ctx, 'PAUSED — press P to resume', W / 2, H / 2, 34, '#ffffff', 'center');
    }
    // Serve / wrong flash border
    if (w.flash) {
      var age = w.elapsed - w.flash.at;
      if (age < 0.6) {
        ctx.strokeStyle = w.flash.kind === 'serve' ? 'rgba(46,160,67,' + (0.9 - age) + ')' : 'rgba(220,60,40,' + (0.9 - age) + ')';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, W - 10, H - 10);
      }
    }
  }

  function drawHeader(ctx, w) {
    ctx.fillStyle = '#0f5257'; ctx.fillRect(0, 0, W, 64);
    drawChefHat(ctx, 52, 32, 0.7);
    text(ctx, 'SIZZLE STATION', 92, 26, 28, '#ffffff', 'left');
    text(ctx, 'Kitchen Rush', 92, 50, 13, '#bfe3e0', 'left');
    text(ctx, 'SCORE  ' + w.score, 470, 32, 24, '#ffd23f', 'left');
    text(ctx, 'COINS  ' + w.coins, 700, 32, 24, '#ffd23f', 'left');
    if (w.combo > 1) text(ctx, 'COMBO x' + w.combo, 880, 32, 22, '#7ed957', 'left');
    // Shift timer
    var frac = Math.max(0, w.timeLeft / CFG.shiftSeconds);
    ctx.fillStyle = '#083638'; rr(ctx, 1010, 18, 200, 28, 8); ctx.fill();
    ctx.fillStyle = frac > 0.25 ? '#7ed957' : '#ff6b5e';
    rr(ctx, 1012, 20, 196 * frac, 24, 6); ctx.fill();
    text(ctx, fmtTime(w.timeLeft), 1110, 32, 20, '#ffffff', 'center');
    text(ctx, w.muted ? 'SOUND OFF (M)' : 'SOUND ON (M)', 1230, 52, 11, '#bfe3e0', 'right');
    global.SizzleInput.register({ x: 1140, y: 42, w: 120, h: 20, action: 'mute', label: 'mute' });
  }

  function drawBoard(ctx, w) {
    var b = L.board;
    ctx.fillStyle = '#2f4f3e'; rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 5; rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
    text(ctx, 'ORDER BOARD', b.x + 16, b.y + 20, 16, '#ffe9a8', 'left');
    text(ctx, 'serve the oldest ticket first', b.x + b.w - 16, b.y + 20, 12, '#b9d6c0', 'right');
    if (w.orders.length === 0) {
      text(ctx, 'No orders yet — the kitchen is quiet...', b.x + 16, b.y + 72, 16, '#dfeee2', 'left');
      return;
    }
    w.orders.forEach(function (o, i) {
      var y = b.y + 38 + i * 32;
      var recipe = global.SizzleConfig.recipeById(o.recipeId);
      var isFirst = i === 0;
      ctx.fillStyle = isFirst ? '#fff8e7' : '#e8e0cc';
      rr(ctx, b.x + 12, y, b.w - 24, 28, 6); ctx.fill();
      text(ctx, '#' + o.id, b.x + 22, y + 14, 14, '#0f5257', 'left');
      text(ctx, recipe.name, b.x + 62, y + 14, 14, '#222222', 'left');
      recipe.items.forEach(function (id, k) {
        var done = w.plate.indexOf(id) >= 0 && isFirst;
        drawIngredient(ctx, id, b.x + 330 + k * 30, y + 14, 11);
        if (done) {
          ctx.strokeStyle = '#2ea043'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(b.x + 322 + k * 30, y + 14); ctx.lineTo(b.x + 328 + k * 30, y + 20); ctx.lineTo(b.x + 340 + k * 30, y + 6); ctx.stroke();
        }
      });
      var frac = Math.max(0, o.patience / o.maxPatience);
      ctx.fillStyle = '#cccccc'; rr(ctx, b.x + 430, y + 9, 140, 10, 5); ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#57b24a' : frac > 0.25 ? '#ffb703' : '#e63b2e';
      rr(ctx, b.x + 430, y + 9, 140 * frac, 10, 5); ctx.fill();
    });
  }

  function drawMenu(ctx, w) {
    var m = L.menu;
    ctx.fillStyle = '#ffffff'; rr(ctx, m.x, m.y, m.w, m.h, 10); ctx.fill();
    ctx.strokeStyle = '#d9c49a'; ctx.lineWidth = 3; rr(ctx, m.x, m.y, m.w, m.h, 10); ctx.stroke();
    text(ctx, "TODAY'S MENU", m.x + 16, m.y + 20, 16, '#0f5257', 'left');
    global.SizzleConfig.RECIPES.forEach(function (r, i) {
      var col = i % 3, row = Math.floor(i / 3);
      var x = m.x + 16 + col * 200, y = m.y + 52 + row * 44;
      text(ctx, r.name, x, y, 14, '#222222', 'left');
      r.items.forEach(function (id, k) { drawIngredient(ctx, id, x + 8 + k * 26, y + 20, 10); });
      text(ctx, r.price + ' coins', x + 96, y + 20, 12, '#8a5a2b', 'left');
    });
  }

  function drawStove(ctx, w, now) {
    var s = L.stove;
    text(ctx, 'STOVE — click a pan when it is ready', s.x, s.y - 12, 14, '#5a4632', 'left');
    ctx.fillStyle = '#3d3d3d'; rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
    ctx.fillStyle = '#555555';
    ctx.beginPath(); ctx.arc(s.x + 75, s.y + 110, 58, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + 225, s.y + 110, 58, 0, Math.PI * 2); ctx.fill();
    w.pans.forEach(function (pan, i) {
      var cx = s.x + 75 + i * 150, cy = s.y + 110;
      ctx.fillStyle = '#1f1f1f';
      ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c2c2c';
      ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
      if (pan.state === 'cooking' || pan.state === 'done' || pan.state === 'burnt') {
        drawIngredient(ctx, pan.item, cx, cy, 26);
        if (pan.state === 'cooking') {
          var frac = Math.min(1, pan.progress / CFG.cookTime[pan.item]);
          ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(cx, cy, 52, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
          text(ctx, Math.ceil(CFG.cookTime[pan.item] - pan.progress) + 's', cx, cy + 40, 13, '#ffffff', 'center');
          // steam
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
          for (var st = 0; st < 3; st++) {
            var sx = cx - 20 + st * 20 + Math.sin(now * 3 + st * 2) * 4;
            ctx.beginPath(); ctx.moveTo(sx, cy - 34); ctx.quadraticCurveTo(sx + 6, cy - 52, sx - 2, cy - 66); ctx.stroke();
          }
        } else if (pan.state === 'done') {
          ctx.strokeStyle = '#7ed957'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
          text(ctx, 'READY!', cx, cy + 40, 14, '#7ed957', 'center');
        } else {
          ctx.strokeStyle = '#e63b2e'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
          text(ctx, 'BURNT!', cx, cy + 40, 14, '#ff6b5e', 'center');
        }
      } else {
        text(ctx, 'empty pan', cx, cy, 13, '#888888', 'center');
      }
      global.SizzleInput.register({ x: cx - 56, y: cy - 56, w: 112, h: 112, action: 'pan:' + i, label: 'pan ' + (i + 1) });
    });
    // stove knobs
    ctx.fillStyle = '#c22f24';
    ctx.beginPath(); ctx.arc(s.x + 60, s.y + 205, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + 240, s.y + 205, 10, 0, Math.PI * 2); ctx.fill();
  }

  function drawBins(ctx, w) {
    var b = L.bins;
    text(ctx, 'INGREDIENTS — click or press 1-6', b.x, b.y - 12, 14, '#5a4632', 'left');
    var bw = 88, gap = 6;
    ING.forEach(function (ing, i) {
      var x = b.x + i * (bw + gap), y = b.y;
      var need = global.SizzleWorld.plateNeeds(w).indexOf(ing.id) >= 0 && w.phase === 'playing';
      ctx.fillStyle = need ? '#fff3c4' : '#ffffff';
      rr(ctx, x, y, bw, 150, 10); ctx.fill();
      ctx.strokeStyle = need ? '#ffb703' : '#d9c49a'; ctx.lineWidth = need ? 4 : 2;
      rr(ctx, x, y, bw, 150, 10); ctx.stroke();
      drawIngredient(ctx, ing.id, x + bw / 2, y + 48, 30);
      text(ctx, ing.name, x + bw / 2, y + 96, 14, '#222222', 'center');
      text(ctx, '[' + ing.key + ']' + (ing.cook ? '  pan ' + ing.cook + 's' : '  ready'), x + bw / 2, y + 120, 11, '#8a5a2b', 'center');
      global.SizzleInput.register({ x: x, y: y, w: bw, h: 150, action: 'add:' + ing.id, label: ing.name });
    });
    // Trash hint under bins
    text(ctx, 'Tip: cook Egg and Chicken on the stove first. Burnt food: click its pan to trash it.', b.x, b.y + 178, 13, '#5a4632', 'left');
  }

  function drawBell(ctx, w) {
    var b = L.bell;
    text(ctx, 'SERVE', b.x, b.y - 12, 14, '#5a4632', 'left');
    ctx.fillStyle = '#8a5a2b'; rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    var ready = global.SizzleWorld.plateComplete(w);
    var cx = b.x + b.w / 2, cy = b.y + 105;
    // bell dome
    ctx.fillStyle = ready ? '#ffd23f' : '#c9a86a';
    ctx.beginPath(); ctx.arc(cx, cy, 62, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ready ? '#ffe9a8' : '#e8dcc0';
    ctx.fillRect(cx - 62, cy - 6, 124, 10);
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.arc(cx, cy - 62, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 3, cy - 62, 6, 14);
    if (ready) {
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 3;
      for (var k = 0; k < 8; k++) {
        var an = (k / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(an) * 74, cy - 10 + Math.sin(an) * 74);
        ctx.lineTo(cx + Math.cos(an) * 88, cy - 10 + Math.sin(an) * 88);
        ctx.stroke();
      }
    }
    text(ctx, ready ? 'DING! Ready to serve' : 'Ring when the plate is full', cx, b.y + 205, 14, '#fff8e7', 'center');
    global.SizzleInput.register({ x: b.x, y: b.y, w: b.w, h: b.h, action: 'serve', label: 'serve bell' });
  }

  function drawPlate(ctx, w) {
    var p = L.plate;
    text(ctx, 'YOUR PLATE — click a dish on the plate to take it off', p.x, p.y - 12, 14, '#5a4632', 'left');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(p.x + 200, p.y + 75, 190, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c49a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(p.x + 200, p.y + 75, 190, 62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p.x + 200, p.y + 75, 130, 40, 0, 0, Math.PI * 2); ctx.stroke();
    var order = global.SizzleWorld.currentOrder(w);
    var slots = order ? global.SizzleConfig.recipeById(order.recipeId).items.length : 3;
    for (var i = 0; i < slots; i++) {
      var cx = p.x + 110 + i * 90, cy = p.y + 75;
      if (w.plate[i]) {
        drawIngredient(ctx, w.plate[i], cx, cy, 30);
        global.SizzleInput.register({ x: cx - 36, y: cy - 36, w: 72, h: 72, action: 'remove:' + i, label: 'remove plate item' });
      } else {
        ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, '?', cx, cy, 22, '#bbbbbb', 'center');
      }
    }
    var need = global.SizzleWorld.plateNeeds(w);
    text(ctx, order ? 'Needs: ' + need.map(function (id) { return ingById(id).name; }).join(', ') : 'No active order', p.x + 410, p.y + 75, 13, '#5a4632', 'left');
    // Serve button
    var s = L.serve;
    var ready = global.SizzleWorld.plateComplete(w);
    ctx.fillStyle = ready ? '#2ea043' : '#9aa5b1';
    rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.fill();
    text(ctx, 'SERVE DISH', s.x + s.w / 2, s.y + 36, 26, '#ffffff', 'center');
    text(ctx, '[Space]  •  click the bell', s.x + s.w / 2, s.y + 68, 13, '#e8f5e9', 'center');
    global.SizzleInput.register({ x: s.x, y: s.y, w: s.w, h: s.h, action: 'serve', label: 'serve button' });
  }

  function drawFooter(ctx, w) {
    ctx.fillStyle = '#0f5257'; ctx.fillRect(0, 748, W, 52);
    text(ctx, w.message, 24, 774, 16, '#ffffff', 'left');
    text(ctx, 'Keys: 1-6 ingredients  •  Space serve  •  P pause  •  M sound  •  R restart', 1256, 774, 13, '#bfe3e0', 'right');
  }

  function drawTitle(ctx, w) {
    ctx.fillStyle = 'rgba(15,82,87,0.88)'; ctx.fillRect(0, 0, W, H);
    drawChefHat(ctx, W / 2, 150, 1.6);
    text(ctx, 'SIZZLE STATION', W / 2, 250, 64, '#ffffff', 'center');
    text(ctx, 'Kitchen Rush — a timed cooking game', W / 2, 305, 24, '#ffd23f', 'center');
    var lines = [
      'Orders appear on the board. Each ticket lists the dish and its 3 ingredients.',
      'Click an ingredient bin (or press 1-6) to add it. Egg and Chicken must cook on the stove first.',
      'Click a pan when it says READY to plate it. Click the bell or press Space to serve.',
      'Serve before the ticket timer runs out. Combos grow your score. Shift lasts 3 minutes!'
    ];
    lines.forEach(function (ln, i) { text(ctx, ln, W / 2, 360 + i * 32, 18, '#e8f5e9', 'center'); });
    ctx.fillStyle = '#ffd23f'; rr(ctx, W / 2 - 140, 520, 280, 64, 14); ctx.fill();
    text(ctx, 'START SHIFT  [Enter]', W / 2, 552, 24, '#0f5257', 'center');
    global.SizzleInput.register({ x: W / 2 - 140, y: 520, w: 280, h: 64, action: 'start', label: 'start' });
    text(ctx, 'Original game by MUSE-8 for the make.fun cooking bounty. Art and sounds made in code.', W / 2, 640, 14, '#bfe3e0', 'center');
  }

  function drawGameOver(ctx, w) {
    ctx.fillStyle = 'rgba(15,82,87,0.88)'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'SHIFT OVER!', W / 2, 200, 56, '#ffffff', 'center');
    text(ctx, 'Final score: ' + w.score + ' pts', W / 2, 280, 32, '#ffd23f', 'center');
    text(ctx, 'Dishes served: ' + w.served + '   •   Orders missed: ' + w.missed + '   •   Best combo: x' + w.bestCombo, W / 2, 330, 22, '#e8f5e9', 'center');
    text(ctx, 'Coins earned: ' + w.coins, W / 2, 368, 22, '#e8f5e9', 'center');
    var verdict = w.served >= 8 ? 'Head Chef material! The kitchen loves you.' : w.served >= 4 ? 'Solid shift! Keep the pans hot.' : 'A tough shift. The tickets wait for no one.';
    text(ctx, verdict, W / 2, 420, 20, '#ffffff', 'center');
    ctx.fillStyle = '#ffd23f'; rr(ctx, W / 2 - 140, 480, 280, 64, 14); ctx.fill();
    text(ctx, 'PLAY AGAIN  [R]', W / 2, 512, 24, '#0f5257', 'center');
    global.SizzleInput.register({ x: W / 2 - 140, y: 480, w: 280, h: 64, action: 'restart', label: 'play again' });
  }

  var API = { render: render, drawIngredient: drawIngredient, layout: L, fmtTime: fmtTime };
  global.SizzleRender = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
