// Sizzle Station — synthesised sounds via WebAudio. No audio files, works offline.
(function (global) {
  'use strict';

  var ctx = null;
  var muted = false;
  var sizzleNodes = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, when) {
    if (muted) return;
    var c = ensure();
    if (!c) return;
    try {
      var t0 = c.currentTime + (when || 0);
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* audio is best-effort */ }
  }

  function noiseBurst(dur, vol, filterFreq) {
    if (muted) return;
    var c = ensure();
    if (!c) return;
    try {
      var len = Math.floor(c.sampleRate * dur);
      var buf = c.createBuffer(1, len, c.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = c.createBufferSource();
      src.buffer = buf;
      var f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = filterFreq || 3000;
      var g = c.createGain();
      g.gain.value = vol || 0.2;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
    } catch (e) { /* best-effort */ }
  }

  var API = {
    unlock: function () { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    setMuted: function (m) { muted = !!m; if (muted) API.stopSizzle(); },
    isMuted: function () { return muted; },
    click: function () { tone(660, 0.07, 'triangle', 0.12); },
    add: function () { tone(520, 0.08, 'triangle', 0.14); tone(780, 0.09, 'triangle', 0.12, 0.06); },
    error: function () { tone(160, 0.18, 'square', 0.10); tone(120, 0.22, 'square', 0.10, 0.1); },
    ding: function () { tone(880, 0.15, 'sine', 0.18); tone(1318, 0.3, 'sine', 0.16, 0.12); },
    serve: function () {
      tone(523, 0.12, 'triangle', 0.16); tone(659, 0.12, 'triangle', 0.16, 0.09);
      tone(784, 0.2, 'triangle', 0.16, 0.18); tone(1046, 0.3, 'triangle', 0.14, 0.27);
    },
    tick: function () { tone(980, 0.05, 'square', 0.06); },
    startSizzle: function () {
      if (muted) return;
      var c = ensure();
      if (!c || sizzleNodes) return;
      try {
        var len = c.sampleRate * 1.2;
        var buf = c.createBuffer(1, len, c.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        var src = c.createBufferSource();
        src.buffer = buf; src.loop = true;
        var f = c.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 2500;
        var g = c.createGain(); g.gain.value = 0.05;
        src.connect(f).connect(g).connect(c.destination);
        src.start();
        sizzleNodes = { src: src, gain: g };
      } catch (e) { /* best-effort */ }
    },
    stopSizzle: function () {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch (e) {}
      sizzleNodes = null;
    }
  };

  global.SizzleAudio = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
