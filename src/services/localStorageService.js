// Funciones básicas para localStorage
export const getData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Función para generar IDs únicos
export const generarId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Función para obtener un elemento por ID
export const getItemById = (key, id) => {
  const data = getData(key);
  return data.find(item => item.id === id) || null;
};

// Función para eliminar un elemento por ID
export const deleteItemById = (key, id) => {
  const data = getData(key);
  const filtered = data.filter(item => item.id !== id);
  saveData(key, filtered);
  return true;
};

// Función para actualizar un elemento por ID
export const updateItemById = (key, id, updates) => {
  const data = getData(key);
  const index = data.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Item no encontrado');
  data[index] = { ...data[index], ...updates };
  saveData(key, data);
  return data[index];
};

// Función para crear un nuevo elemento
export const createItem = (key, item) => {
  const data = getData(key);
  const nuevoItem = {
    ...item,
    id: item.id || generarId(),
    created_at: item.created_at || new Date().toISOString(),
    fecha: item.fecha || new Date().toISOString()
  };
  data.push(nuevoItem);
  saveData(key, data);
  return nuevoItem;
};
