/**
 * GESTIÓN DEL PEDIDO, PERSISTENCIA EN LOCALSTORAGE Y SOLICITUD POR WHATSAPP
 * -------------------------------------------------------------------------
 * Mantiene el estado del pedido actual, lo conserva en localStorage ante
 * recargas de página (sin almacenar datos personales sensibles), calcula
 * subtotales/totales y construye el enlace codificado para WhatsApp.
 */

const CLAVE_STORAGE_PEDIDO = "sg_detalles_carrito_pedido_v1";

const estadoPedido = {
  items: [], // Elementos: { id, nombre, descripcion, precio, cantidad, imagen }
  personalizacion: {
    dedicatoria: "",
    coloresPreferidos: "",
    observaciones: ""
  },
  datosSolicitud: {
    fechaDeseada: "",
    modalidad: "Recojo en taller",
    franjaHoraria: "Mañana (10:00 - 13:00)"
  }
};

/**
 * Obtiene la fecha actual local en formato YYYY-MM-DD
 * para bloquear días anteriores en el selector de fecha.
 */
function obtenerFechaMinimaHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/**
 * Verifica que la fecha seleccionada no sea anterior al día actual.
 */
function esFechaValida(fechaTexto) {
  if (!fechaTexto || typeof fechaTexto !== "string") return false;
  const fechaMinima = obtenerFechaMinimaHoy();
  return fechaTexto >= fechaMinima;
}

/**
 * Convierte una fecha YYYY-MM-DD a formato legible DD/MM/YYYY.
 */
function formatearFechaLegible(fechaTexto) {
  if (!fechaTexto || !fechaTexto.includes("-")) return "Por definir";
  const partes = fechaTexto.split("-");
  if (partes.length !== 3) return fechaTexto;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Guarda el estado del carrito y las opciones del pedido en localStorage.
 * No almacena información personal sensible del usuario.
 */
function guardarPedidoEnStorage() {
  try {
    if (typeof localStorage === "undefined") return;
    const datosParaGuardar = {
      items: estadoPedido.items.map((item) => ({
        id: item.id,
        cantidad: item.cantidad
      })),
      personalizacion: { ...estadoPedido.personalizacion },
      datosSolicitud: { ...estadoPedido.datosSolicitud }
    };
    localStorage.setItem(CLAVE_STORAGE_PEDIDO, JSON.stringify(datosParaGuardar));
  } catch (error) {
    console.warn("No se pudo guardar el pedido en localStorage:", error);
  }
}

/**
 * Recupera el pedido almacenado en localStorage al cargar o recargar la página,
 * reconstruyendo los productos a partir de CATALOGO_PRODUCTOS y evitando duplicados.
 */
function cargarPedidoDesdeStorage() {
  const hoy = obtenerFechaMinimaHoy();
  estadoPedido.datosSolicitud.fechaDeseada = hoy;

  try {
    if (typeof localStorage === "undefined") return;
    const textoGuardado = localStorage.getItem(CLAVE_STORAGE_PEDIDO);
    if (!textoGuardado) return;

    const datosParseados = JSON.parse(textoGuardado);
    if (!datosParseados || typeof datosParseados !== "object") return;

    // Reconstruir y agrupar productos por identificador sin duplicados
    estadoPedido.items = [];
    if (Array.isArray(datosParseados.items)) {
      datosParseados.items.forEach((itemGuardado) => {
        if (!itemGuardado || !itemGuardado.id) return;
        const productoCatalogo = CATALOGO_PRODUCTOS.find((p) => p.id === itemGuardado.id);
        const cantidadNumerica = parseInt(itemGuardado.cantidad, 10);

        if (!productoCatalogo || isNaN(cantidadNumerica) || cantidadNumerica <= 0) return;

        const existente = estadoPedido.items.find((i) => i.id === productoCatalogo.id);
        if (existente) {
          existente.cantidad += cantidadNumerica;
        } else {
          estadoPedido.items.push({
            id: productoCatalogo.id,
            nombre: productoCatalogo.nombre,
            descripcion: productoCatalogo.descripcion,
            precio: productoCatalogo.precio,
            imagen: productoCatalogo.imagen,
            cantidad: cantidadNumerica
          });
        }
      });
    }

    // Restaurar campos opcionales de personalización
    if (datosParseados.personalizacion && typeof datosParseados.personalizacion === "object") {
      estadoPedido.personalizacion.dedicatoria =
        String(datosParseados.personalizacion.dedicatoria || "").trim();
      estadoPedido.personalizacion.coloresPreferidos =
        String(datosParseados.personalizacion.coloresPreferidos || "").trim();
      estadoPedido.personalizacion.observaciones =
        String(datosParseados.personalizacion.observaciones || "").trim();
    }

    // Restaurar datos de entrega/recojo asegurando que la fecha no haya quedado en el pasado
    if (datosParseados.datosSolicitud && typeof datosParseados.datosSolicitud === "object") {
      const fechaGuardada = datosParseados.datosSolicitud.fechaDeseada;
      estadoPedido.datosSolicitud.fechaDeseada = esFechaValida(fechaGuardada)
        ? fechaGuardada
        : hoy;

      if (datosParseados.datosSolicitud.modalidad) {
        estadoPedido.datosSolicitud.modalidad = String(datosParseados.datosSolicitud.modalidad);
      }
      if (datosParseados.datosSolicitud.franjaHoraria) {
        estadoPedido.datosSolicitud.franjaHoraria = String(
          datosParseados.datosSolicitud.franjaHoraria
        );
      }
    }
  } catch (error) {
    console.warn("No se pudo recuperar el pedido desde localStorage:", error);
  }
}

/**
 * Agrega un producto al pedido actual o incrementa su cantidad si ya existe.
 */
function agregarProductoAlPedido(productoId) {
  const productoCatalogo = CATALOGO_PRODUCTOS.find((p) => p.id === productoId);
  if (!productoCatalogo) return null;

  const itemExistente = estadoPedido.items.find((item) => item.id === productoId);
  let resultado = null;

  if (itemExistente) {
    itemExistente.cantidad += 1;
    resultado = itemExistente;
  } else {
    const nuevoItem = {
      id: productoCatalogo.id,
      nombre: productoCatalogo.nombre,
      descripcion: productoCatalogo.descripcion,
      precio: productoCatalogo.precio,
      imagen: productoCatalogo.imagen,
      cantidad: 1
    };
    estadoPedido.items.push(nuevoItem);
    resultado = nuevoItem;
  }

  guardarPedidoEnStorage();
  return resultado;
}

/**
 * Incrementa o disminuye la cantidad de un producto en el pedido.
 * Si la cantidad llega a 0, se elimina el producto del pedido.
 */
function cambiarCantidadProducto(productoId, variacion) {
  const indice = estadoPedido.items.findIndex((item) => item.id === productoId);
  if (indice === -1) return;

  const cambioEntero = parseInt(variacion, 10);
  if (isNaN(cambioEntero)) return;

  estadoPedido.items[indice].cantidad += cambioEntero;

  if (estadoPedido.items[indice].cantidad <= 0) {
    estadoPedido.items.splice(indice, 1);
  }

  guardarPedidoEnStorage();
}

/**
 * Elimina completamente un producto del pedido actual.
 */
function eliminarProductoDelPedido(productoId) {
  estadoPedido.items = estadoPedido.items.filter((item) => item.id !== productoId);
  guardarPedidoEnStorage();
}

/**
 * Vacía todos los productos del pedido actual y actualiza localStorage.
 */
function vaciarProductosDelPedido() {
  estadoPedido.items = [];
  guardarPedidoEnStorage();
}

/**
 * Devuelve la cantidad seleccionada de un producto específico.
 */
function obtenerCantidadDeProducto(productoId) {
  const item = estadoPedido.items.find((i) => i.id === productoId);
  return item ? item.cantidad : 0;
}

/**
 * Calcula el número total de ramos/productos seleccionados en el pedido.
 */
function obtenerTotalUnidades() {
  return estadoPedido.items.reduce((acumulado, item) => acumulado + item.cantidad, 0);
}

/**
 * Calcula el total parcial en bolivianos (Bs) sin descuentos automáticos.
 */
function obtenerTotalParcial() {
  return estadoPedido.items.reduce(
    (acumulado, item) => acumulado + item.precio * item.cantidad,
    0
  );
}

/**
 * Actualiza los datos de personalización y de solicitud en el estado del pedido.
 */
function actualizarDatosPedido(nuevosDatos) {
  if (nuevosDatos.dedicatoria !== undefined) {
    estadoPedido.personalizacion.dedicatoria = nuevosDatos.dedicatoria.trim();
  }
  if (nuevosDatos.coloresPreferidos !== undefined) {
    estadoPedido.personalizacion.coloresPreferidos = nuevosDatos.coloresPreferidos.trim();
  }
  if (nuevosDatos.observaciones !== undefined) {
    estadoPedido.personalizacion.observaciones = nuevosDatos.observaciones.trim();
  }
  if (nuevosDatos.fechaDeseada !== undefined) {
    estadoPedido.datosSolicitud.fechaDeseada = nuevosDatos.fechaDeseada;
  }
  if (nuevosDatos.modalidad !== undefined) {
    estadoPedido.datosSolicitud.modalidad = nuevosDatos.modalidad;
  }
  if (nuevosDatos.franjaHoraria !== undefined) {
    estadoPedido.datosSolicitud.franjaHoraria = nuevosDatos.franjaHoraria;
  }

  guardarPedidoEnStorage();
}

/**
 * Valida que el pedido tenga al menos un producto y una fecha válida no anterior a hoy.
 */
function validarPedidoParaEnvio() {
  if (estadoPedido.items.length === 0 || obtenerTotalUnidades() <= 0) {
    return {
      valido: false,
      error: "Tu pedido está vacío. Agrega al menos un arreglo floral antes de enviarlo."
    };
  }

  if (!esFechaValida(estadoPedido.datosSolicitud.fechaDeseada)) {
    return {
      valido: false,
      error: "Por favor, selecciona una fecha válida igual o posterior al día de hoy."
    };
  }

  if (!estadoPedido.datosSolicitud.modalidad) {
    return {
      valido: false,
      error: "Selecciona si prefieres recojo en taller o entrega a domicilio."
    };
  }

  if (!estadoPedido.datosSolicitud.franjaHoraria) {
    return {
      valido: false,
      error: "Selecciona una franja horaria preferida."
    };
  }

  return { valido: true, error: "" };
}

/**
 * Genera dinámicamente el texto completo de la solicitud de pedido para WhatsApp.
 */
function generarMensajeSolicitudWhatsApp() {
  const moneda = CONFIG_TIENDA.moneda;
  const lineas = [];

  lineas.push(`Hola *${CONFIG_TIENDA.nombreNegocio}*, quisiera realizar la siguiente *solicitud de pedido*:`);
  lineas.push("");
  lineas.push("*1. PRODUCTOS SELECCIONADOS:*");

  if (estadoPedido.items.length === 0) {
    lineas.push("- Quiero consultar por un arreglo floral personalizado.");
  } else {
    estadoPedido.items.forEach((item) => {
      const subtotal = item.precio * item.cantidad;
      lineas.push(
        `• ${item.cantidad}x ${item.nombre} (${item.precio} ${moneda} c/u) — Subtotal: *${subtotal} ${moneda}*`
      );
    });
    lineas.push("");
    lineas.push(`*Total parcial estimado: ${obtenerTotalParcial()} ${moneda}*`);
  }

  lineas.push("");
  lineas.push("*2. PERSONALIZACIÓN DEL PEDIDO:*");
  lineas.push(
    `• Dedicatoria / mensaje: ${estadoPedido.personalizacion.dedicatoria || "Sin especificar"}`
  );
  lineas.push(
    `• Colores preferidos: ${estadoPedido.personalizacion.coloresPreferidos || "Tonos del catálogo / de temporada"}`
  );
  lineas.push(
    `• Observaciones: ${estadoPedido.personalizacion.observaciones || "Ninguna"}`
  );

  lineas.push("");
  lineas.push("*3. DATOS DE ENTREGA / RECOJO:*");
  lineas.push(
    `• Fecha solicitada: ${formatearFechaLegible(estadoPedido.datosSolicitud.fechaDeseada)}`
  );
  lineas.push(`• Modalidad: ${estadoPedido.datosSolicitud.modalidad}`);
  lineas.push(`• Franja horaria: ${estadoPedido.datosSolicitud.franjaHoraria}`);

  lineas.push("");
  lineas.push(
    "_Nota: Entiendo que esta es una solicitud de pedido sujeta a confirmación de disponibilidad, personalización, entrega y precio final._"
  );

  return lineas.join("\n");
}

/**
 * Construye la URL oficial de WhatsApp (https://wa.me/NUMERO?text=MENSAJE)
 * codificando adecuadamente el texto.
 */
function construirUrlWhatsApp(mensajeTexto) {
  const numeroLimpio = CONFIG_TIENDA.telefonoWhatsApp.replace(/\D/g, "");
  const textoCodificado = encodeURIComponent(mensajeTexto);
  return `https://wa.me/${numeroLimpio}?text=${textoCodificado}`;
}
