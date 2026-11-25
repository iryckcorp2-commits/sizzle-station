// Sizzle Station — mouse + keyboard input. Hit areas are registered by render.js
// each frame into SizzleInput.clickables: {x,y,w,h,action,label}.
(function (global) {
  'use strict';

  var clickables = [];

  function clearClickables() { clickables.length = 0; }
  function register(rect) { clickables.push(rect); }

  function findAt(x, y) {
    for (var i = clickables.length - 1; i >= 0; i--) {
      var r = clickables[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }

  function bind(canvas, handlers) {
    canvas.addEventListener('click', function (ev) {
      var rect = canvas.getBoundingClientRect();
      var x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      var y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      var hit = findAt(x, y);
      if (hit && handlers.onAction) handlers.onAction(hit.action, hit);
    });
    canvas.addEventListener('mousemove', function (ev) {
      var rect = canvas.getBoundingClientRect();
      var x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      var y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      canvas.style.cursor = findAt(x, y) ? 'pointer' : 'default';
    });
    global.addEventListener('keydown', function (ev) {
      if (handlers.onKey) handlers.onKey(ev.key, ev);
    });
  }

  var API = {
    clickables: clickables, clearClickables: clearClickables,
    register: register, bind: bind
  };
  global.SizzleInput = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
