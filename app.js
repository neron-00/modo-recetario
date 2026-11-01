(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const P = window.Planner;
  const { recipes, products } = window.RecipeData;
  const storageKey = 'modo-recetario-v1';
  let state = P.emptyState();
  let activeRecipe = null;
  let preferredSlot = null;
  let toastTimer;
  let startupMessage = '';
  let storageAvailable = true;
  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) state = P.validateState(JSON.parse(saved));
  } catch (error) {
    storageAvailable = false;
    startupMessage = 'No se pudo recuperar el menú guardado. Puedes usar la demo durante esta sesión.';
  }
  const url = new URL(window.location.href);
  if (url.searchParams.has('plan')) {
    try {
      state = P.decodePlan(url.searchParams.get('plan'));
      startupMessage = 'Menú compartido cargado. Ahora estás editando tu propia copia.';
    } catch (error) { startupMessage = 'El enlace del menú no es válido. Se conservó tu menú anterior.'; }
    url.searchParams.delete('plan');
    try { history.replaceState(null, '', url.href); } catch (error) { /* Algunos navegadores restringen history en archivos locales. */ }
  }
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      storageAvailable = true;
      $('#save-status').textContent = '✓ Guardado en este navegador';
    } catch (error) {
      storageAvailable = false;
      $('#save-status').textContent = 'Solo esta sesión: almacenamiento no disponible';
    }
  }
  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function renderRecipes() {
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const search = normalize($('#search').value.trim());
    const time = $('#time-filter').value;
    const diet = $('#diet-filter').value;
    const budget = $('#budget-filter').value;
    let matches = recipes.filter(recipe => {
      const haystack = normalize(recipe.name + ' ' + Object.keys(recipe.ingredients).map(id => products[id].name).join(' '));
      const price = P.consolidate([{ recipeId: recipe.id, servings: 1 }]).reduce((sum, item) => sum + item.cents, 0);
      return haystack.includes(search) && (time !== 'quick' || recipe.time < 30) && (diet === 'all' || recipe.diet === diet || (diet === 'vegetarian' && recipe.diet === 'vegan')) && (budget === 'all' || price <= Number(budget) * 100);
    });
    const sort = $('#sort-filter').value;
    const priceOf = recipe => P.consolidate([{ recipeId: recipe.id, servings: 1 }]).reduce((sum, item) => sum + item.cents, 0);
    if (sort === 'time') matches.sort((a, b) => a.time - b.time);
    if (sort === 'price') matches.sort((a, b) => priceOf(a) - priceOf(b));
    $('#recipe-count').textContent = matches.length + (matches.length === 1 ? ' receta encontrada' : ' recetas encontradas') + (preferredSlot ? ' · Agregar a ' + P.days[preferredSlot.day] + ', ' + P.meals[preferredSlot.meal].toLowerCase() : '');
    const grid = $('#recipe-grid');
    grid.replaceChildren();
    if (!matches.length) grid.append(node('p', 'empty-state', 'No encontramos recetas con esos filtros. Prueba otro ingrediente o limpia los filtros.'));
    matches.forEach(recipe => {
      const card = node('article', 'recipe-card');
      const art = node('div', 'recipe-image-wrap');
      art.style.setProperty('--dish-bg', recipe.color);
      art.style.setProperty('--dish-hue', recipe.hue + 'deg');
      const img = node('img'); img.src = 'assets/plato.svg'; img.alt = ''; img.width = 205; img.height = 205; img.loading = 'lazy';
      art.append(img, node('span', 'recipe-category', recipe.kind), node('span', 'recipe-illustration', 'Ilustración referencial'));
      const content = node('div', 'recipe-card-content');
      const meta = node('div', 'recipe-meta'); meta.append(node('span', '', '◷ ' + recipe.time + ' min'), node('span', '', 'Porciones ajustables'));
      const bottom = node('div', 'recipe-bottom');
      const price = node('span', 'recipe-price', P.money(priceOf(recipe))); price.append(node('small', '', ' por porción · aprox.'));
      const add = node('button', 'recipe-add', 'Ver y agregar ＋'); add.type = 'button'; add.setAttribute('aria-label', 'Ver y agregar ' + recipe.name); add.addEventListener('click', () => openRecipe(recipe.id));
      bottom.append(price, add);
      content.append(meta, node('h3', '', recipe.name), node('p', '', recipe.description), bottom);
      card.append(art, content); grid.append(card);
    });
  }
  P.days.forEach((name, i) => { const option = node('option', '', name); option.value = i; $('#recipe-day').append(option); });
  function updateDialog() {
    if (!activeRecipe) return;
    const servings = Number($('#recipe-servings').value);
    $('#ingredient-servings').textContent = Number.isInteger(servings) && servings >= 1 && servings <= 8 ? servings : '…';
    const list = $('#dialog-ingredients'); list.replaceChildren();
    if (Number.isInteger(servings) && servings >= 1 && servings <= 8) Object.entries(activeRecipe.ingredients).forEach(([id, quantity]) => {
      const line = node('li'); line.append(node('span', '', products[id].name), node('span', '', P.quantityText(quantity * servings, products[id].unit))); list.append(line);
    });
    const existing = state.plan.find(entry => entry.day === Number($('#recipe-day').value) && entry.meal === $('#recipe-meal').value);
    $('#replace-note').textContent = existing ? 'Este espacio tiene ' + P.byId.get(existing.recipeId).name + '. Al guardar, actualizarás esta comida.' : 'Las cantidades se recalculan al cambiar las porciones.';
  }
  function openRecipe(id, entry) {
    activeRecipe = P.byId.get(id);
    if (!activeRecipe) return;
    $('#dialog-title').textContent = activeRecipe.name;
    $('#dialog-description').textContent = activeRecipe.time + ' minutos · ' + activeRecipe.kind + ' · Datos ilustrativos';
    $('#recipe-day').value = entry ? entry.day : preferredSlot ? preferredSlot.day : 0;
    $('#recipe-meal').value = entry ? entry.meal : preferredSlot ? preferredSlot.meal : 'lunch';
    $('#recipe-servings').value = entry ? entry.servings : 2;
    const steps = $('#dialog-steps'); steps.replaceChildren(); activeRecipe.steps.forEach(step => steps.append(node('li', '', step)));
    updateDialog(); $('#recipe-dialog').showModal();
  }
  $('#recipe-servings').addEventListener('input', updateDialog);
  $('#recipe-day').addEventListener('change', updateDialog);
  $('#recipe-meal').addEventListener('change', updateDialog);
  $('#add-recipe-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('#add-recipe-form').reportValidity()) return;
    const entry = { recipeId: activeRecipe.id, day: Number($('#recipe-day').value), meal: $('#recipe-meal').value, servings: Number($('#recipe-servings').value) };
    const index = state.plan.findIndex(item => item.day === entry.day && item.meal === entry.meal);
    if (index >= 0) state.plan[index] = entry; else state.plan.push(entry);
    preferredSlot = null;
    $('#recipe-dialog').close(); render(); renderRecipes(); save();
    toast('Guardado: ' + P.days[entry.day] + ', ' + P.meals[entry.meal].toLowerCase() + '. Tu lista ya está actualizada.');
  });
  function renderWeek() {
    const week = $('#week-plan'); week.replaceChildren();
    P.days.forEach((day, dayIndex) => {
      const column = node('div', 'day-column'); column.append(node('h3', 'day-title', day));
      Object.entries(P.meals).forEach(([meal, label]) => {
        const slot = node('div', 'meal-slot'); slot.append(node('span', 'meal-label', label));
        const entry = state.plan.find(item => item.day === dayIndex && item.meal === meal);
        if (entry) {
          slot.append(node('span', 'planned-title', P.byId.get(entry.recipeId).name), node('span', 'planned-servings', entry.servings + ' porciones'));
          const actions = node('div', 'slot-actions');
          const edit = node('button', '', 'Editar'); edit.type = 'button'; edit.setAttribute('aria-label', 'Editar ' + label + ' del ' + day); edit.addEventListener('click', () => openRecipe(entry.recipeId, entry));
          const remove = node('button', '', 'Quitar'); remove.type = 'button'; remove.setAttribute('aria-label', 'Quitar ' + label + ' del ' + day); remove.addEventListener('click', () => { state.plan = state.plan.filter(item => item !== entry); render(); save(); toast('Receta quitada. Lista actualizada.'); });
          actions.append(edit, remove); slot.append(actions);
        } else {
          const add = node('button', 'add-slot', '＋ Elegir receta'); add.type = 'button'; add.setAttribute('aria-label', 'Elegir ' + label.toLowerCase() + ' del ' + day); add.addEventListener('click', () => { preferredSlot = { day: dayIndex, meal }; renderRecipes(); window.location.hash = 'recetas'; $('#search').focus({ preventScroll: true }); toast('Elige una receta para ' + day.toLowerCase() + ', ' + label.toLowerCase() + '.'); }); slot.append(add);
        }
        column.append(slot);
      });
      week.append(column);
    });
    const portions = state.plan.reduce((sum, entry) => sum + entry.servings, 0);
    $('#plan-status').textContent = state.plan.length ? state.plan.length + ' comidas planificadas · ' + portions + ' porciones en total' : 'Tu semana empieza aquí. Elige una receta o prueba el ejemplo.';
    ['#clear-plan', '#share-plan', '#download-list'].forEach(id => { $(id).disabled = !state.plan.length; });
  }
  function renderShopping() {
    const result = P.totals(state);
    const list = $('#shopping-list'); list.replaceChildren();
    if (!result.items.length) list.append(node('p', 'empty-state', 'Agrega recetas a tu semana y aquí aparecerán los ingredientes, sumados y sin duplicados.'));
    result.items.forEach(item => {
      const inPantry = state.pantry.includes(item.id);
      const row = node('div', 'shopping-row' + (inPantry ? ' is-pantry' : ''));
      const label = node('label');
      const check = node('input'); check.type = 'checkbox'; check.checked = inPantry; check.setAttribute('aria-label', 'Ya tengo en casa: ' + item.name);
      check.addEventListener('change', () => {
        state.pantry = check.checked ? [...new Set([...state.pantry, item.id])] : state.pantry.filter(id => id !== item.id);
        renderShopping(); save();
        // Restaurar el foco después de regenerar la lista para conservar la navegación por teclado.
        [...$('#shopping-list').querySelectorAll('input')].find(input => input.getAttribute('aria-label') === check.getAttribute('aria-label'))?.focus({ preventScroll: true });
      });
      const name = node('span'); name.append(node('span', 'ingredient-name', item.name), node('small', '', P.quantityText(item.quantity, item.unit) + (inPantry ? ' · Ya tienes' : '')));
      label.append(check, name); row.append(label, node('span', '', P.money(item.cents))); list.append(row);
    });
    $('#full-total').textContent = P.money(result.all);
    $('#pantry-total').textContent = '− ' + P.money(result.pantry);
    $('#shopping-total').textContent = P.money(result.shopping);
    $('#ingredients-count').textContent = result.items.filter(item => !state.pantry.includes(item.id)).length + ' ingredientes por comprar';
    $('#split-people').value = state.people;
    const split = P.splitCents(result.shopping, state.people);
    const splitResult = $('#split-result'); splitResult.replaceChildren();
    if (state.people === 1) splitResult.append(node('strong', '', P.money(split[0])), node('span', '', 'Tu presupuesto estimado.'));
    else {
      const equal = split.every(cents => cents === split[0]);
      splitResult.append(node('strong', '', equal ? P.money(split[0]) + ' por persona' : P.money(Math.min(...split)) + ' – ' + P.money(Math.max(...split))), node('span', '', equal ? 'Dividido entre ' + state.people + ' personas.' : split.map((cents, i) => 'Persona ' + (i + 1) + ': ' + P.money(cents)).join(' · ')));
    }
  }
  function render() { renderWeek(); renderShopping(); }
  $('#filters').addEventListener('submit', event => event.preventDefault());
  $('#filters').addEventListener('input', renderRecipes);
  $('#reset-filters').addEventListener('click', () => { $('#filters').reset(); renderRecipes(); });
  $('#split-people').addEventListener('change', () => { state.people = Number($('#split-people').value); renderShopping(); save(); });
  $('#example-plan').addEventListener('click', () => {
    if (state.plan.length) { toast('El ejemplo se puede cargar cuando el menú esté vacío. Primero guarda o comparte tu menú.'); return; }
    state.plan = ['pollo-arroz', 'pasta-tomate', 'quinua', 'chaufa', 'garbanzos'].map((id, day) => ({ recipeId: id, day, meal: 'lunch', servings: 2 }));
    state.pantry = []; render(); save(); toast('Ejemplo cargado: cinco almuerzos para dos personas. Puedes editarlo.');
  });
  $('#clear-plan').addEventListener('click', () => $('#confirm-dialog').showModal());
  $('#confirm-clear').addEventListener('click', () => { state = { ...P.emptyState(), people: state.people }; preferredSlot = null; $('#confirm-dialog').close(); render(); renderRecipes(); save(); toast('Menú vacío. Tu próxima semana empieza aquí.'); });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }));
  $('#share-plan').addEventListener('click', () => {
    if (location.protocol === 'file:') { toast('Para compartir con otras personas, publica la página en GitHub Pages. Tu menú permanece guardado aquí.'); return; }
    const link = new URL(location.href); link.search = ''; link.searchParams.set('plan', P.encodePlan(state)); link.hash = 'planificador';
    $('#share-url').value = link.href; $('#copy-status').textContent = 'El enlace comparte las recetas y porciones, sin tus marcas de despensa.'; $('#share-dialog').showModal();
  });
  $('#copy-share').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#share-url').value); $('#copy-status').textContent = 'Enlace copiado. Ya puedes enviarlo a tus roomies.'; }
    catch (error) { $('#share-url').focus(); $('#share-url').select(); $('#copy-status').textContent = 'Seleccionamos el enlace. Cópialo con Ctrl+C o con la opción Copiar de tu dispositivo.'; }
  });
  $('#download-list').addEventListener('click', () => {
    const blob = new Blob(['\ufeff' + P.listText(state)], { type: 'text/plain;charset=utf-8' });
    const objectURL = URL.createObjectURL(blob); const link = node('a'); link.href = objectURL; link.download = 'mi-lista-recetario.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000); toast('Lista preparada para descargar.');
  });
  const toggle = $('.menu-toggle');
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); $('#navigation').classList.toggle('is-open', open); });
  $('#navigation').addEventListener('click', event => { if (event.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('is-open'); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { toggle.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('is-open'); } });
  renderRecipes(); render();
  if (!storageAvailable) $('#save-status').textContent = 'Almacenamiento local no disponible';
  if (startupMessage) toast(startupMessage);
  if (new URL(location.href).searchParams.get('plan') === null && startupMessage.startsWith('Menú compartido')) save();
})();
