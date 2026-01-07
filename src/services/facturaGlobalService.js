/**
 * Obtiene y actualiza el número global de factura de forma atómica.
 * Devuelve el nuevo número de factura listo para usar.
 */
export async function obtenerYActualizarNumeroFactura() {
  // Leer el último número de factura desde localStorage
  const ultimo = Number(localStorage.getItem('ultima_factura') || 0);
  const nuevo = ultimo + 1;

  // Actualizar el valor en localStorage
  localStorage.setItem('ultima_factura', nuevo);

  return nuevo;
}
