/* Datos ilustrativos. Precios en céntimos por unidad de referencia.
   Las recetas expresan cantidades por UNA porción en g, ml o unidades. */
(function (root) {
  'use strict';
  const products = {
    rice: { name: 'Arroz', unit: 'g', price: 600, basis: 1000 },
    chicken: { name: 'Pollo', unit: 'g', price: 2200, basis: 1000 },
    carrot: { name: 'Zanahoria', unit: 'g', price: 400, basis: 1000 },
    peas: { name: 'Arvejas', unit: 'g', price: 900, basis: 1000 },
    onion: { name: 'Cebolla', unit: 'g', price: 450, basis: 1000 },
    garlic: { name: 'Ajo', unit: 'g', price: 1400, basis: 1000 },
    oil: { name: 'Aceite vegetal', unit: 'ml', price: 1200, basis: 1000 },
    pasta: { name: 'Pasta', unit: 'g', price: 800, basis: 1000 },
    tomato: { name: 'Tomate', unit: 'g', price: 500, basis: 1000 },
    basil: { name: 'Albahaca', unit: 'g', price: 2500, basis: 1000 },
    cheese: { name: 'Queso fresco', unit: 'g', price: 2400, basis: 1000 },
    lentils: { name: 'Lentejas secas', unit: 'g', price: 950, basis: 1000 },
    quinoa: { name: 'Quinua', unit: 'g', price: 1600, basis: 1000 },
    cucumber: { name: 'Pepino', unit: 'g', price: 400, basis: 1000 },
    avocado: { name: 'Palta', unit: 'g', price: 1200, basis: 1000 },
    lime: { name: 'Limón', unit: 'u', price: 50, basis: 1 },
    egg: { name: 'Huevo', unit: 'u', price: 80, basis: 1 },
    soy: { name: 'Sillao', unit: 'ml', price: 1600, basis: 1000 },
    scallion: { name: 'Cebolla china', unit: 'g', price: 1200, basis: 1000 },
    tuna: { name: 'Atún escurrido', unit: 'g', price: 5000, basis: 1000 },
    potato: { name: 'Papa', unit: 'g', price: 350, basis: 1000 },
    lettuce: { name: 'Lechuga', unit: 'g', price: 700, basis: 1000 },
    mushroom: { name: 'Champiñones', unit: 'g', price: 2400, basis: 1000 },
    spinach: { name: 'Espinaca', unit: 'g', price: 800, basis: 1000 },
    wrap: { name: 'Tortilla de trigo', unit: 'u', price: 100, basis: 1 },
    chickpea: { name: 'Garbanzos cocidos', unit: 'g', price: 1400, basis: 1000 },
    pepper: { name: 'Pimiento', unit: 'g', price: 800, basis: 1000 }
  };
  const recipes = [
    { id: 'pollo-arroz', name: 'Pollo con arroz y verduras', time: 25, kind: 'Casero', diet: 'all', color: '#e4e9cf', hue: 0, description: 'Un clásico para empezar la semana con una comida completa.', ingredients: { rice: 80, chicken: 150, carrot: 50, peas: 30, onion: 40, garlic: 3, oil: 8 }, steps: ['Cocina el arroz siguiendo las indicaciones de su envase.', 'Sofríe la cebolla y el ajo; agrega el pollo y cocínalo completamente.', 'Incorpora las verduras cocidas y sirve junto al arroz.'] },
    { id: 'pasta-tomate', name: 'Pasta con tomate y albahaca', time: 20, kind: 'Vegetariano', diet: 'vegetarian', color: '#f0ddd0', hue: -12, description: 'Pocos ingredientes, una salsa casera y mucho sabor.', ingredients: { pasta: 100, tomato: 150, garlic: 3, basil: 8, cheese: 25, oil: 8 }, steps: ['Hierve la pasta según las indicaciones del envase.', 'Sofríe el ajo, añade el tomate picado y cocina hasta formar una salsa.', 'Mezcla con la pasta y termina con albahaca y queso.'] },
    { id: 'lentejas', name: 'Lentejitas de la casa', time: 40, kind: 'Vegano', diet: 'vegan', color: '#e4dfc9', hue: 12, description: 'Un plato de olla sencillo, ideal para cocinar con calma.', ingredients: { lentils: 90, rice: 60, carrot: 50, onion: 50, garlic: 3, oil: 8 }, steps: ['Revisa y enjuaga las lentejas; cocínalas según su envase hasta que estén tiernas.', 'Prepara un aderezo de cebolla, ajo y zanahoria e incorpóralo a las lentejas.', 'Cocina el arroz por separado y sirve.'] },
    { id: 'quinua', name: 'Bowl de quinua y palta', time: 25, kind: 'Vegano', diet: 'vegan', color: '#d8e6cc', hue: 20, description: 'Fresco, colorido y fácil de llevar a donde vayas.', ingredients: { quinoa: 80, cucumber: 80, tomato: 80, avocado: 80, lime: 1, oil: 8 }, steps: ['Lava la quinua y cuécela siguiendo las indicaciones del envase. Deja enfriar.', 'Corta el pepino, el tomate y la palta.', 'Mezcla con la quinua y añade limón y aceite al servir.'] },
    { id: 'chaufa', name: 'Arroz chaufa con pollo', time: 25, kind: 'Peruano', diet: 'all', color: '#e9dfc4', hue: -5, description: 'El favorito de los roomies, en una versión casera.', ingredients: { rice: 90, chicken: 120, egg: 1, scallion: 25, soy: 12, oil: 10 }, steps: ['Cocina el arroz y utiliza ingredientes recién preparados o conservados de forma segura.', 'Saltea el pollo hasta que esté completamente cocido y cocina el huevo.', 'Incorpora el arroz, el sillao y la cebolla china; saltea hasta calentar todo.'] },
    { id: 'atun', name: 'Ensalada de atún y papa', time: 25, kind: 'Fresco', diet: 'all', color: '#dae7e3', hue: 5, description: 'Una opción práctica para el almuerzo de un día ocupado.', ingredients: { tuna: 100, potato: 200, tomato: 80, lettuce: 40, lime: 1, oil: 8 }, steps: ['Cocina las papas hasta que estén tiernas y córtalas.', 'Lava y corta las verduras; escurre el atún.', 'Mezcla los ingredientes y aliña con limón y aceite.'] },
    { id: 'tortilla', name: 'Tortilla de espinaca y queso', time: 15, kind: 'Vegetariano', diet: 'vegetarian', color: '#ecdfc6', hue: 10, description: 'Una cena sencilla para terminar el día sin complicarte.', ingredients: { egg: 2, spinach: 80, cheese: 40, onion: 30, oil: 8 }, steps: ['Lava y saltea la espinaca con la cebolla.', 'Bate los huevos y mézclalos con las verduras y el queso.', 'Cocina por ambos lados hasta que el huevo esté completamente cuajado.'] },
    { id: 'wrap-pollo', name: 'Wrap de pollo y palta', time: 20, kind: 'Rápido', diet: 'all', color: '#eadfcf', hue: -9, description: 'Todo lo que te gusta, envuelto y listo para llevar.', ingredients: { wrap: 2, chicken: 120, avocado: 60, lettuce: 40, tomato: 60, oil: 5 }, steps: ['Cocina el pollo completamente y córtalo en tiras.', 'Lava y corta la lechuga, el tomate y la palta.', 'Calienta las tortillas, rellena y enrolla.'] },
    { id: 'garbanzos', name: 'Salteado de garbanzos', time: 20, kind: 'Vegano', diet: 'vegan', color: '#e3e5cd', hue: 15, description: 'Una sartén y una mezcla de verduras para compartir.', ingredients: { chickpea: 150, pepper: 80, onion: 40, carrot: 50, garlic: 3, oil: 8 }, steps: ['Usa garbanzos previamente cocidos y escurridos.', 'Saltea la cebolla y el ajo; añade las verduras cortadas.', 'Agrega los garbanzos y cocina hasta calentar por completo.'] },
    { id: 'pasta-hongos', name: 'Pasta con champiñones', time: 25, kind: 'Vegetariano', diet: 'vegetarian', color: '#e5ddce', hue: -3, description: 'Una pasta de pocos pasos para una cena entre dos.', ingredients: { pasta: 100, mushroom: 100, spinach: 50, garlic: 3, cheese: 25, oil: 8 }, steps: ['Cocina la pasta según las indicaciones de su envase.', 'Saltea el ajo y los champiñones; añade la espinaca.', 'Mezcla con la pasta y termina con queso fresco.'] }
  ];
  root.RecipeData = { products, recipes };
})(typeof window !== 'undefined' ? window : globalThis);
