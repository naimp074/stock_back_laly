// Cache para la imagen del logo en base64
let logoImageCache = null;

/**
 * Cargar el logo como base64 (se ejecuta una vez y se cachea)
 */
async function cargarLogoBase64() {
  if (logoImageCache) {
    return logoImageCache;
  }

  try {
    // Intentar cargar desde diferentes rutas posibles
    const posiblesRutas = [
      '/logo-placam.png',
      '/logo-placam.jpg',
      '/logo-placam.svg',
      '/placam.png',
      '/placam.jpg'
    ];

    for (const ruta of posiblesRutas) {
      try {
        const response = await fetch(ruta);
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          logoImageCache = base64;
          return base64;
        }
      } catch (e) {
        // Continuar con la siguiente ruta
        continue;
      }
    }
    return null;
  } catch (error) {
    console.warn('Error cargando logo:', error);
    return null;
  }
}

/**
 * Función helper para agregar el logo PLACAM a los PDFs
 * @param {jsPDF} doc - Instancia del documento jsPDF
 * @param {Object} options - Opciones de posición y tamaño
 */
export async function agregarLogoPDF(doc, options = {}) {
  const {
    x = 14,
    y = 5,
    width = 50,
    height = 20
  } = options;

  try {
    // Intentar cargar la imagen del logo
    const logoBase64 = await cargarLogoBase64();
    
    if (logoBase64) {
      // Detectar el tipo de imagen desde el base64
      let imageType = 'PNG';
      if (logoBase64.includes('data:image/svg+xml')) {
        imageType = 'SVG';
      } else if (logoBase64.includes('data:image/jpeg') || logoBase64.includes('data:image/jpg')) {
        imageType = 'JPEG';
      }
      
      // Usar la imagen si está disponible
      doc.addImage(logoBase64, imageType, x, y, width, height);
      return;
    }
  } catch (error) {
    console.warn('Error al agregar imagen del logo, usando texto:', error);
  }

  // Fallback: Logo como texto estilizado (PLACAM)
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Negro
  
  // Agregar texto PLACAM
  doc.text('PLACAM', x, y + 10);
  
  // Opcional: agregar una línea decorativa debajo
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(x, y + 12, x + 30, y + 12);
  
  // Restaurar fuente normal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
}

/**
 * Función para cargar una imagen y convertirla a base64 (para uso futuro)
 * Esto se puede usar cuando tengas el logo como archivo
 */
export async function cargarLogoComoBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error cargando logo:', error);
    return null;
  }
}

