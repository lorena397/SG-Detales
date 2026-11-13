/**
 * GESTIÓN DEL PEDIDO, PERSISTENCIA EN LOCALSTORAGE Y SOLICITUD POR WHATSAPP
 * -------------------------------------------------------------------------
 * Mantiene el estado del pedido actual, lo conserva en localStorage ante
 * recargas de página (sin almacenar datos personales sensibles), calcula
 * subtotales/totales y construye el enlace codificado para WhatsApp.
 */

const CLAVE_STORAGE_PEDIDO = "sg_detalles_carrito_pedido_v1";

/**
 * Opciones predeterminadas de dedicatoria sincronizadas con index.html.
 */
const OPCIONES_DEDICATORIA_CATALOGO = [
  { valor: "feliz cumpleaños", texto: "FELIZ CUMPLEAÑOS" },
  { valor: "feliz aniversario", texto: "FELIZ ANIVERSARIO" },
  { valor: "quieres ser mi novia", texto: "¿QUIERES SER MI NOVIA?" },
  { valor: "para mi princesa", texto: "PARA MI PRINCESA 💓" },
  { valor: "para la mas hermosa", texto: "PARA LAS MAS HERMOSA" },
  { valor: "para la niña mas bonita", texto: "PARA LA NIÑA MAS BONITA" },
  { valor: "feliz dia del amor", texto: "FELIZ DIA DEL AMOR 💓" },
  { valor: "felelicidades mi amor", texto: "FELICIDADES MI AMOR" },
  { valor: "te amo mi reyna", texto: "TE AMO MI REYNA ♥" }
];

const estadoPedido = {
  // Elementos: { id, nombre, descripcion, precio, cantidad, imagen, incluirDedicatoria, dedicatoria, lucesLed }
  items: [],
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
 * Devuelve la lista de opciones de dedicatoria disponibles (desde el DOM si existe
 * #input-dedicatoria, o desde la constante de respaldo).
 */
function obtenerOpcionesDedicatoriaDisponibles() {
  if (typeof document !== "undefined") {
    const selectBase = document.getElementById("input-dedicatoria");
    if (selectBase && selectBase.options && selectBase.options.length > 0) {
      const opcionesDom = [];
      Array.from(selectBase.options).forEach((opt) => {
        const val = String(opt.value || "").trim();
        if (val !== "") {
          opcionesDom.push({
            valor: val,
            texto: String(opt.textContent || val).replace(/\s+/g, " ").trim()
          });
        }
      });
      if (opcionesDom.length > 0) {
        return opcionesDom;
      }
    }
  }
  return OPCIONES_DEDICATORIA_CATALOGO;
}

/**
 * Devuelve el texto legible de una opción de dedicatoria a partir de su valor.
 */
function obtenerTextoLegibleDedicatoria(valorDedicatoria) {
  const limpio = String(valorDedicatoria || "").trim();
  if (!limpio) return "";
  const opciones = obtenerOpcionesDedicatoriaDisponibles();
  const encontrada = opciones.find((op) => op.valor === limpio);
  return encontrada ? encontrada.texto : limpio.toUpperCase();
}

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
 * Calcula el costo adicional por Dedicatoria de un producto específico.
 */
function calcularCostoDedicatoriaProducto(item) {
  if (!item) return 0;
  const costoUnitarioDedicatoria =
    typeof COSTO_DEDICATORIA === "number" ? COSTO_DEDICATORIA : 10;
  const tieneDedicatoriaActiva =
    Boolean(item.incluirDedicatoria) && String(item.dedicatoria || "").trim() !== "";
  return tieneDedicatoriaActiva ? costoUnitarioDedicatoria : 0;
}

/**
 * Calcula el costo adicional por Luces LED de un producto específico.
 */
function calcularCostoLucesLedProducto(item) {
  if (!item) return 0;
  const costoUnitarioLuces =
    typeof COSTO_LUCES_LED === "number" ? COSTO_LUCES_LED : 10;
  return item.lucesLed ? costoUnitarioLuces : 0;
}

/**
 * Calcula la suma total de detalles adicionales activos para un producto.
 */
function calcularCostoAdicionalesProducto(item) {
  return calcularCostoDedicatoriaProducto(item) + calcularCostoLucesLedProducto(item);
}

/**
 * Calcula el subtotal de un producto en el carrito:
 * (precio base × cantidad) + costos adicionales seleccionados para ese producto.
 * Evita duplicar cargos al cambiar cantidades o modificar opciones.
 */
function calcularSubtotalProducto(item) {
  if (!item) return 0;
  const subtotalBase = Number(item.precio) * Number(item.cantidad);
  const costoAdicionales = calcularCostoAdicionalesProducto(item);
  return subtotalBase + costoAdicionales;
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
        cantidad: item.cantidad,
        incluirDedicatoria: Boolean(item.incluirDedicatoria && item.dedicatoria),
        dedicatoria: item.incluirDedicatoria ? String(item.dedicatoria || "").trim() : "",
        lucesLed: Boolean(item.lucesLed)
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

        const dedicatoriaGuardada = String(itemGuardado.dedicatoria || "").trim();
        const incluirDedicatoriaGuardada =
          Boolean(itemGuardado.incluirDedicatoria) && dedicatoriaGuardada !== "";
        const lucesLedGuardadas = Boolean(itemGuardado.lucesLed);

        const existente = estadoPedido.items.find((i) => i.id === productoCatalogo.id);
        if (existente) {
          existente.cantidad += cantidadNumerica;
          if (incluirDedicatoriaGuardada) {
            existente.incluirDedicatoria = true;
            existente.dedicatoria = dedicatoriaGuardada;
          }
          if (lucesLedGuardadas) {
            existente.lucesLed = true;
          }
        } else {
          estadoPedido.items.push({
            id: productoCatalogo.id,
            nombre: productoCatalogo.nombre,
            descripcion: productoCatalogo.descripcion,
            precio: productoCatalogo.precio,
            imagen: productoCatalogo.imagen,
            cantidad: cantidadNumerica,
            incluirDedicatoria: incluirDedicatoriaGuardada,
            dedicatoria: incluirDedicatoriaGuardada ? dedicatoriaGuardada : "",
            lucesLed: lucesLedGuardadas
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
      cantidad: 1,
      incluirDedicatoria: false,
      dedicatoria: "",
      lucesLed: false
    };
    estadoPedido.items.push(nuevoItem);
    resultado = nuevoItem;
  }

  guardarPedidoEnStorage();
  return resultado;
}

/**
 * Actualiza los detalles adicionales (Dedicatoria y/o Luces LED) de un producto
 * específico en el carrito, sin afectar a los demás productos.
 */
function actualizarAdicionalesProducto(productoId, opciones = {}) {
  const item = estadoPedido.items.find((i) => i.id === productoId);
  if (!item) return null;

  const opcionesDisponibles = obtenerOpcionesDedicatoriaDisponibles();
  const valorPorDefecto =
    opcionesDisponibles.length > 0 ? opcionesDisponibles[0].valor : "feliz cumpleaños";

  if (opciones.incluirDedicatoria !== undefined) {
    const activar = Boolean(opciones.incluirDedicatoria);
    item.incluirDedicatoria = activar;
    if (!activar) {
      item.dedicatoria = "";
    } else if (!String(item.dedicatoria || "").trim()) {
      item.dedicatoria =
        opciones.dedicatoria !== undefined && String(opciones.dedicatoria).trim() !== ""
          ? String(opciones.dedicatoria).trim()
          : valorPorDefecto;
    }
  }

  if (opciones.dedicatoria !== undefined) {
    const textoDedicatoria = String(opciones.dedicatoria || "").trim();
    if (textoDedicatoria === "") {
      item.incluirDedicatoria = false;
      item.dedicatoria = "";
    } else {
      item.incluirDedicatoria = true;
      item.dedicatoria = textoDedicatoria;
    }
  }

  if (opciones.lucesLed !== undefined) {
    item.lucesLed = Boolean(opciones.lucesLed);
  }

  guardarPedidoEnStorage();
  return item;
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
 * Calcula el total parcial en bolivianos (Bs) sumando el subtotal de cada producto
 * (incluyendo sus detalles adicionales activos).
 */
function obtenerTotalParcial() {
  return estadoPedido.items.reduce(
    (acumulado, item) => acumulado + calcularSubtotalProducto(item),
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
 * Genera dinámicamente el texto completo de la solicitud de pedido para WhatsApp,
 * incluyendo los detalles adicionales seleccionados en cada producto y sus costos.
 */
function generarMensajeSolicitudWhatsApp() {
  const moneda = CONFIG_TIENDA.moneda;
  const costoDedicatoria = typeof COSTO_DEDICATORIA === "number" ? COSTO_DEDICATORIA : 10;
  const costoLucesLed = typeof COSTO_LUCES_LED === "number" ? COSTO_LUCES_LED : 10;
  const lineas = [];

  lineas.push(`Hola *${CONFIG_TIENDA.nombreNegocio}*, quisiera realizar la siguiente *solicitud de pedido*:`);
  lineas.push("");
  lineas.push("*1. PRODUCTOS SELECCIONADOS:*");

  if (estadoPedido.items.length === 0) {
    lineas.push("- Quiero consultar por un arreglo floral personalizado.");
  } else {
    estadoPedido.items.forEach((item) => {
      const subtotalBase = item.precio * item.cantidad;
      const subtotalItem = calcularSubtotalProducto(item);
      const tieneDedicatoria = calcularCostoDedicatoriaProducto(item) > 0;
      const tieneLucesLed = calcularCostoLucesLedProducto(item) > 0;

      lineas.push(
        `• ${item.cantidad}x ${item.nombre} (${item.precio} ${moneda} c/u — Base: ${subtotalBase} ${moneda})`
      );

      if (tieneDedicatoria || tieneLucesLed) {
        if (tieneDedicatoria) {
          lineas.push(
            `   + Dedicatoria: "${obtenerTextoLegibleDedicatoria(item.dedicatoria)}" (+${costoDedicatoria} ${moneda})`
          );
        }
        if (tieneLucesLed) {
          lineas.push(
            `   + Luces LED adicionales: Sí (+${costoLucesLed} ${moneda})`
          );
        }
      } else {
        lineas.push("   + Detalles adicionales: Ninguno (0 Bs)");
      }

      lineas.push(`   Subtotal producto: *${subtotalItem} ${moneda}*`);
    });
    lineas.push("");
    lineas.push(`*Total parcial estimado: ${obtenerTotalParcial()} ${moneda}*`);
  }

  lineas.push("");
  lineas.push("*2. PERSONALIZACIÓN DEL PEDIDO:*");

  const resumenAdicionales = [];
  estadoPedido.items.forEach((item) => {
    const detallesItem = [];
    if (calcularCostoDedicatoriaProducto(item) > 0) {
      detallesItem.push(
        `Dedicatoria "${obtenerTextoLegibleDedicatoria(item.dedicatoria)}" (+${costoDedicatoria} ${moneda})`
      );
    }
    if (calcularCostoLucesLedProducto(item) > 0) {
      detallesItem.push(`Luces LED (+${costoLucesLed} ${moneda})`);
    }
    if (detallesItem.length > 0) {
      resumenAdicionales.push(`${item.nombre}: ${detallesItem.join(", ")}`);
    }
  });

  lineas.push(
    `• Detalles adicionales: ${
      resumenAdicionales.length > 0 ? resumenAdicionales.join(" | ") : "Ninguno seleccionado"
    }`
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
