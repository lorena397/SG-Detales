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
  telefonoWhatsApp: "59172252868",
  telefonoVisibleProvisional: "+591 72252868",
  direccionTallerProvisional: "Referncia Fil",
  horarioAtencion: "Lun–sáb · 8:00–22:00",
  correoProvisional: "Sloveravelasco@gmail.com",
  moneda: "Bs",
  redesSocialesProvisionales: {
    instagram: "#provisional-instagram",
    facebook: "#provisional-facebook",
    tiktok: "#provisional-tiktok"
  }
};

/**
 * Costos configurables para la sección "Detalles adicionales" por producto (en Bs).
 * Se aplican únicamente al producto en el que fueron seleccionados:
 * Subtotal del producto = (precio base × cantidad) + costos adicionales activos.
 */
const COSTO_DEDICATORIA = 10;
const COSTO_LUCES_LED = 10;

const COSTOS_ADICIONALES = {
  dedicatoria: COSTO_DEDICATORIA,
  lucesLed: COSTO_LUCES_LED
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
    nombre: "Dulce descanso",
    descripcion: "Ramo de rosas eternas más un peluche adorabele",
    precio: 160,
    imagen: "assets/imagenes/lotso.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-2",
    nombre: "Amor a toda velocidad",
    descripcion: "15 carros más 10 rosas eternas",
    precio: 450,
    imagen: "assets/imagenes/carros.jpeg",
    esImagenProvisional: false // Fotografía real tomada del diseño de referencia
  },
  {
    id: "prod-3",
    nombre: "Amor y Paz", ////////////////
    descripcion: "7 rosas + 10 mariposas",
    precio: 70,
    imagen: "assets/imagenes/mariposas.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-4",
    nombre: "Magia para ti I", /////////////
    descripcion: "Ramo de princesas. 30 rosas.",
    precio: 190,
    imagen: "assets/imagenes/princesaBlue.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-5",
    nombre: "Magia para ti II", //////////
    descripcion: "Ramo de princesas. 30 rosas.",
    precio: 190,
    imagen: "assets/imagenes/princesaGreen.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-6",
    nombre: "La dueña de mi vida",
    descripcion: "Ramo de 80 rosas",
    precio: 470,
    imagen: "assets/imagenes/ramoBuchon.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-7",
    nombre: "Siempre contigo",
    descripcion: "20 rosas eternas",
    precio: 120,
    imagen: "assets/imagenes/rosasYellow.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-8",
    nombre: "Brillo de amor",
    descripcion: "7 rosas",
    precio: 50,
    imagen: "assets/imagenes/siete pink.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-9",
    nombre: "Alas de amor I",
    descripcion: "20 mariposas",
    precio: 70,
    imagen: "assets/imagenes/mariposas1.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-10",
    nombre: "Alas de amor II",
    descripcion: "20 mariposas",
    precio: 70,
    imagen: "assets/imagenes/mariposas2.jpeg",
    esImagenProvisional: false
  },
  {
    id: "prod-11",
    nombre: "Sol de mi vida",
    descripcion: "7 girasoles",
    precio: 140,
    imagen: "assets/imagenes/girasoles.jpeg",
    esImagenProvisional: false
  }
];
