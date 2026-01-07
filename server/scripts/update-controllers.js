// Script de ayuda para actualizar controladores
// Este archivo es solo de referencia, los cambios se hacen manualmente

// Patrón a buscar y reemplazar en todos los controladores:
// 
// ANTES:
// const { user_id } = req.query;
// if (!user_id) { return res.status(400)... }
//
// DESPUÉS:
// const user_id = req.user_id;
//
// También para req.body:
// ANTES:
// const { user_id, ...otros } = req.body;
// DESPUÉS:
// const user_id = req.user_id;
// const { ...otros } = req.body;








