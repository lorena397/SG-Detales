/**
 * CONFIGURACIÓN PROVISIONAL DEL EMPRENDIMIENTO Y CATÁLOGO DE PRODUCTOS
 * -------------------------------------------------------------------
 * IMPORTANTE: Sustituir los valores marcados como PROVISIONALES por los
 * datos reales de "SG Detalles" antes de publicar en producción.
 */

const CONFIG_TIENDA = {
  nombreNegocio: "SG Detalles",
  subtituloNegocio: "Florería de barrio",
  ciudad: "Bolivia - Cochabamba",
  // Número de WhatsApp en formato internacional sin el signo "+" ni espacios (Ej. 591 + número de 8 dígitos en Bolivia)
  // PROVISIONAL: Reemplazar con el número real del negocio
  telefonoWhatsApp: "59170000000",
  telefonoVisibleProvisional: "+591 72252868 (Provisional)",
  direccionTallerProvisional: "Calle del Pez, 18 - Cbba (Provisional)",
  horarioAtencion: "Lun–sáb · 10:00–19:00",
  correoProvisional: "hola@casasilvestre.es (Provisional)",
  moneda: "Bs",
  redesSocialesProvisionales: {
    instagram: "#provisional-instagram",
    facebook: "#provisional-facebook",
    tiktok: "#provisional-tiktok"
  }
};

/**
 * Catálogo centralizado de productos.
 * Para cambiar una fotografía provisional por una foto real:
 * 1. Coloca la fotografía en la carpeta "assets/images/"
 * 2. Actualiza la propiedad "imagen" del producto correspondiente
 * 3. Cambia "esImagenProvisional" a false
 */
const CATALOGO_PRODUCTOS = [
  {
    id: "prod-1",
    nombre: "Brisa silvestre",
    descripcion: "Margaritas y verdes",
    precio: 32,
    imagen: "assets/images/brisa-silvestre.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-2",
    nombre: "Rosa de té",
    descripcion: "Rosas de jardín",
    precio: 45,
    imagen: "assets/images/rosa-de-te.png",
    esImagenProvisional: false // Fotografía real tomada del diseño de referencia
  },
  {
    id: "prod-3",
    nombre: "Luz de abril",
    descripcion: "Tulipanes de temporada",
    precio: 35,
    imagen: "assets/images/luz-de-abril.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-4",
    nombre: "Campo abierto",
    descripcion: "Flores de aire campestre",
    precio: 38,
    imagen: "assets/images/campo-abierto.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-5",
    nombre: "Abrazo coral",
    descripcion: "Rosas y ranúnculos",
    precio: 48,
    imagen: "assets/images/abrazo-coral.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-6",
    nombre: "Calma blanca",
    descripcion: "Lisianthus y eucalipto",
    precio: 42,
    imagen: "assets/images/calma-blanca.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-7",
    nombre: "Jardín lila",
    descripcion: "Lavanda y flores malva",
    precio: 39,
    imagen: "assets/images/jardin-lila.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-8",
    nombre: "Sol de casa",
    descripcion: "Girasoles y verdes",
    precio: 30,
    imagen: "assets/images/sol-de-casa.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-9",
    nombre: "Pequeño jardín",
    descripcion: "Centro en cerámica",
    precio: 52,
    imagen: "assets/images/pequeno-jardin.svg",
    esImagenProvisional: true
  },
  {
    id: "prod-10",
    nombre: "Siempre cerca",
    descripcion: "Ramo de flores secas",
    precio: 36,
    imagen: "assets/images/siempre-cerca.svg",
    esImagenProvisional: true
  }
];
