/* Lógica independiente de la interfaz: consolidación, costos y enlaces. */
(function (root) {
  'use strict';
  const { products, recipes } = root.RecipeData;
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const meals = { lunch: 'Almuerzo', dinner: 'Cena' };
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const emptyState = () => ({ version: 1, plan: [], pantry: [], people: 2 });
  function validateState(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.plan) || value.plan.length > 14 || !isInt(value.people, 1, 8)) throw new Error('El menú no tiene un formato válido.');
    const slots = new Set();
    const plan = value.plan.map(entry => {
      if (!entry || !byId.has(entry.recipeId) || !isInt(entry.day, 0, 6) || !Object.hasOwn(meals, entry.meal) || !isInt(entry.servings, 1, 8)) throw new Error('El menú contiene una receta no válida.');
      const slot = entry.day + ':' + entry.meal;
      if (slots.has(slot)) throw new Error('El menú contiene espacios duplicados.');
      slots.add(slot);
      return { recipeId: entry.recipeId, day: entry.day, meal: entry.meal, servings: entry.servings };
    });
    const pantry = Array.isArray(value.pantry) ? [...new Set(value.pantry.filter(id => Object.hasOwn(products, id)))] : [];
    return { version: 1, plan, pantry, people: value.people };
  }
  function consolidate(plan) {
    const quantities = new Map();
    for (const entry of plan) {
      const recipe = byId.get(entry.recipeId);
      if (!recipe) continue;
      for (const [id, amount] of Object.entries(recipe.ingredients)) quantities.set(id, (quantities.get(id) || 0) + amount * entry.servings);
    }
    return [...quantities].map(([id, quantity]) => ({ id, ...products[id], quantity, cents: Math.round(quantity * products[id].price / products[id].basis) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  function totals(state) {
    const items = consolidate(state.plan);
    const all = items.reduce((sum, item) => sum + item.cents, 0);
    const pantry = items.filter(item => state.pantry.includes(item.id)).reduce((sum, item) => sum + item.cents, 0);
    return { items, all, pantry, shopping: all - pantry };
  }
  function splitCents(total, people) {
    const each = Math.floor(total / people);
    return Array.from({ length: people }, (_, i) => each + (i < total % people ? 1 : 0));
  }
  const money = cents => 'S/ ' + (cents / 100).toFixed(2);
  function quantityText(quantity, unit) {
    if (unit === 'g' && quantity >= 1000) return (quantity / 1000).toLocaleString('es-PE', { maximumFractionDigits: 3 }) + ' kg';
    if (unit === 'ml' && quantity >= 1000) return (quantity / 1000).toLocaleString('es-PE', { maximumFractionDigits: 3 }) + ' l';
    return quantity.toLocaleString('es-PE', { maximumFractionDigits: 3 }) + ' ' + (unit === 'u' ? (quantity === 1 ? 'unidad' : 'unidades') : unit);
  }
  function encodePlan(state) {
    const clean = validateState({ ...state, pantry: [] });
    return btoa(JSON.stringify(clean)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodePlan(encoded) {
    if (typeof encoded !== 'string' || encoded.length > 6000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('El enlace del menú no es válido.');
    return validateState(JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))));
  }
  function listText(state) {
    const result = totals(state);
    const lines = ['MODO RECETARIO - LISTA DE COMPRAS', 'Demo académica. Precios ilustrativos por cantidad utilizada.', '', 'MENÚ SEMANAL'];
    [...state.plan].sort((a, b) => a.day - b.day || a.meal.localeCompare(b.meal)).forEach(entry => lines.push(days[entry.day] + ' / ' + meals[entry.meal] + ': ' + byId.get(entry.recipeId).name + ' (' + entry.servings + ' porciones)'));
    lines.push('', 'INGREDIENTES');
    result.items.forEach(item => lines.push((state.pantry.includes(item.id) ? '[EN CASA] ' : '[COMPRAR] ') + item.name + ': ' + quantityText(item.quantity, item.unit) + ' - ' + money(item.cents)));
    lines.push('', 'Menú completo: ' + money(result.all), 'Ya tienes en casa: ' + money(result.pantry), 'Por comprar: ' + money(result.shopping), '', 'DIVISIÓN DEL GASTO');
    splitCents(result.shopping, state.people).forEach((cents, i) => lines.push('Persona ' + (i + 1) + ': ' + money(cents)));
    lines.push('', 'No incluye envases completos, envío ni otros cargos. No se realizan pedidos.');
    return lines.join('\n');
  }
  root.Planner = { days, meals, byId, emptyState, validateState, consolidate, totals, splitCents, money, quantityText, encodePlan, decodePlan, listText };
})(typeof window !== 'undefined' ? window : globalThis);
