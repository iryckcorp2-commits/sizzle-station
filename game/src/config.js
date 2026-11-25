// Sizzle Station — game configuration (original work, MUSE-8, 2026)
// All art is drawn in code; all sounds are synthesised in code.
(function (global) {
  'use strict';

  var CONFIG = {
    title: 'Sizzle Station',
    subtitle: 'Kitchen Rush',
    width: 1280,
    height: 800,
    shiftSeconds: 180,
    maxOrders: 3,
    orderIntervalSeconds: 12,
    orderPatienceSeconds: 50,
    cookTime: { egg: 3.5, chicken: 6.0 },
    burnAfterSeconds: 4.0,
    serveBasePoints: 100,
    servePatienceBonusMax: 50,
    wrongIngredientPenalty: 10,
    missedOrderPenalty: 25,
    comboStep: 0.10,
    comboMax: 5
  };

  // Ingredients. cook: null = ready to plate, otherwise seconds on the pan.
  var INGREDIENTS = [
    { id: 'rice',    name: 'Rice',    key: '1', cook: null, color: '#f5f0e1', dark: '#cbbf9a', emoji: '🍚' },
    { id: 'egg',     name: 'Egg',     key: '2', cook: 3.5,  color: '#ffe9a8', dark: '#e0a83c', emoji: '🍳' },
    { id: 'chicken', name: 'Chicken', key: '3', cook: 6.0,  color: '#e8a06a', dark: '#a85f2e', emoji: '🍗' },
    { id: 'tomato',  name: 'Tomato',  key: '4', cook: null, color: '#ff6b5e', dark: '#c22f24', emoji: '🍅' },
    { id: 'lettuce', name: 'Lettuce', key: '5', cook: null, color: '#7ed957', dark: '#3f9142', emoji: '🥬' },
    { id: 'cheese',  name: 'Cheese',  key: '6', cook: null, color: '#ffd23f', dark: '#d9a400', emoji: '🧀' }
  ];

  var RECIPES = [
    { id: 'sunny-rice',   name: 'Sunny Rice Bowl',       items: ['rice', 'egg', 'tomato'],     price: 100 },
    { id: 'chicken-plate', name: 'Crispy Chicken Plate', items: ['chicken', 'rice', 'lettuce'], price: 120 },
    { id: 'garden-salad',  name: 'Garden Salad',          items: ['lettuce', 'tomato', 'cheese'], price: 90 },
    { id: 'cheesy-omelette', name: 'Cheesy Omelette',     items: ['egg', 'cheese', 'tomato'],    price: 110 },
    { id: 'chicken-rice',  name: 'Chicken Rice Special',  items: ['chicken', 'rice', 'egg'],     price: 130 },
    { id: 'melty-rice',    name: 'Melty Cheese Rice',     items: ['rice', 'cheese', 'egg'],      price: 105 }
  ];

  var API = { CONFIG: CONFIG, INGREDIENTS: INGREDIENTS, RECIPES: RECIPES };
  API.ingredientById = function (id) {
    for (var i = 0; i < INGREDIENTS.length; i++) if (INGREDIENTS[i].id === id) return INGREDIENTS[i];
    return null;
  };
  API.recipeById = function (id) {
    for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].id === id) return RECIPES[i];
    return null;
  };

  global.SizzleConfig = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
