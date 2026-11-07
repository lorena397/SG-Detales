/**
 * CONTROLADOR PRINCIPAL DE LA INTERFAZ (DOM Y EVENTOS)
 * ----------------------------------------------------
 * Renderiza el catálogo, gestiona el panel de resumen del pedido,
 * sincroniza el formulario de personalización y conecta con WhatsApp.
 */

document.addEventListener("DOMContentLoaded", () => {
  inicializarAplicacion();
});

let temporizadorNotificacion = null;

function inicializarAplicacion() {
  cargarPedidoDesdeStorage();
  configurarTextosProvisionales();
  sincronizarFormularioConEstado();
  renderizarCatalogo();
  configurarEventosGlobales();
  actualizarInterfazPedido();
}

/**
 * Inyecta los datos provisionales desde CONFIG_TIENDA en el pie de página
 * y encabezado para mantener un único punto de configuración.
 */
function configurarTextosProvisionales() {
  const direccionEl = document.getElementById("footer-direccion");
  const horarioEl = document.getElementById("footer-horario");
  const telefonoEl = document.getElementById("footer-telefono");
  const correoEl = document.getElementById("footer-correo");
  const contadorCreacionesEl = document.getElementById("catalogo-total-creaciones");

  if (direccionEl) direccionEl.textContent = CONFIG_TIENDA.direccionTallerProvisional;
  if (horarioEl) horarioEl.textContent = CONFIG_TIENDA.horarioAtencion;
  if (telefonoEl) telefonoEl.textContent = CONFIG_TIENDA.telefonoVisibleProvisional;
  if (correoEl) correoEl.textContent = CONFIG_TIENDA.correoProvisional;
  if (contadorCreacionesEl) {
    contadorCreacionesEl.textContent = `${CATALOGO_PRODUCTOS.length} creaciones`;
  }
}

/**
 * Renderiza las tarjetas de productos del catálogo en la cuadrícula.
 */
function renderizarCatalogo() {
  const contenedorCatalogo = document.getElementById("grid-catalogo");
  if (!contenedorCatalogo) return;

  contenedorCatalogo.innerHTML = "";

  CATALOGO_PRODUCTOS.forEach((producto) => {
    const cantidadEnPedido = obtenerCantidadDeProducto(producto.id);

    const tarjeta = document.createElement("article");
    tarjeta.className = "product-card";
    tarjeta.setAttribute("data-product-id", producto.id);

    const insigniaCantidadHTML =
      cantidadEnPedido > 0
        ? `<span class="product-in-cart-badge" aria-label="En tu pedido">${cantidadEnPedido} en tu pedido</span>`
        : "";

    const etiquetaProvisionalHTML = producto.esImagenProvisional
      ? `<span class="provisional-photo-tag" title="Fotografía provisional pendiente de reemplazo">Foto provisional</span>`
      : "";

    tarjeta.innerHTML = `
      <div class="product-image-wrap">
        <img
          src="${producto.imagen}"
          alt="Arreglo floral ${producto.nombre} - ${producto.descripcion}"
          class="product-image"
          loading="lazy"
        />
        ${insigniaCantidadHTML}
        ${etiquetaProvisionalHTML}
      </div>
      <div class="product-info">
        <h3 class="product-name">${producto.nombre}</h3>
        <p class="product-desc">${producto.descripcion}</p>
        <p class="product-price">${producto.precio} ${CONFIG_TIENDA.moneda}</p>
        <button
          type="button"
          class="btn-add-product"
          data-action="add-product"
          data-id="${producto.id}"
          aria-label="Agregar ${producto.nombre} al pedido"
        >
          <span class="btn-add-text">Agregar al pedido</span>
          <span class="btn-add-plus" aria-hidden="true">+</span>
        </button>
      </div>
    `;

    contenedorCatalogo.appendChild(tarjeta);
  });
}

/**
 * Configura el campo de fecha mínima (hoy) y restaura en el formulario
 * los valores guardados en estadoPedido (provenientes de localStorage).
 */
function sincronizarFormularioConEstado() {
  const inputDedicatoria = document.getElementById("input-dedicatoria");
  const inputColores = document.getElementById("input-colores");
  const inputObservaciones = document.getElementById("input-observaciones");
  const inputFecha = document.getElementById("input-fecha-pedido");
  const selectFranja = document.getElementById("select-franja-horaria");
  const radiosModalidad = document.querySelectorAll('input[name="modalidad-entrega"]');

  const hoy = obtenerFechaMinimaHoy();
  const fechaValida = esFechaValida(estadoPedido.datosSolicitud.fechaDeseada)
    ? estadoPedido.datosSolicitud.fechaDeseada
    : hoy;

  estadoPedido.datosSolicitud.fechaDeseada = fechaValida;

  if (inputFecha) {
    inputFecha.min = hoy;
    inputFecha.value = fechaValida;
  }

  if (inputDedicatoria) {
    inputDedicatoria.value = estadoPedido.personalizacion.dedicatoria || "";
  }
  if (inputColores) {
    inputColores.value = estadoPedido.personalizacion.coloresPreferidos || "";
  }
  if (inputObservaciones) {
    inputObservaciones.value = estadoPedido.personalizacion.observaciones || "";
  }
  if (selectFranja && estadoPedido.datosSolicitud.franjaHoraria) {
    selectFranja.value = estadoPedido.datosSolicitud.franjaHoraria;
  }
  if (radiosModalidad.length > 0 && estadoPedido.datosSolicitud.modalidad) {
    radiosModalidad.forEach((radio) => {
      radio.checked = radio.value === estadoPedido.datosSolicitud.modalidad;
    });
  }
}

/**
 * Registra todos los eventos de interacción de la página.
 */
function configurarEventosGlobales() {
  // Delegación de clic en el catálogo de productos
  const contenedorCatalogo = document.getElementById("grid-catalogo");
  if (contenedorCatalogo) {
    contenedorCatalogo.addEventListener("click", (evento) => {
      const botonAgregar = evento.target.closest('[data-action="add-product"]');
      if (!botonAgregar) return;

      const productoId = botonAgregar.getAttribute("data-id");
      manejarAgregarProducto(productoId, botonAgregar);
    });
  }

  // Botones para abrir y cerrar el panel lateral del pedido
  const btnAbrirHeader = document.getElementById("btn-abrir-pedido-header");
  const btnAbrirFlotante = document.getElementById("btn-abrir-pedido-flotante");
  const btnAbrirToast = document.getElementById("btn-toast-ver-pedido");
  const btnCerrarPanel = document.getElementById("btn-cerrar-panel");
  const btnSeguirComprando = document.getElementById("btn-seguir-comprando");
  const btnExplorarVacio = document.getElementById("btn-explorar-catalogo-vacio");
  const fondoModal = document.getElementById("panel-overlay");

  if (btnAbrirHeader) btnAbrirHeader.addEventListener("click", abrirPanelPedido);
  if (btnAbrirFlotante) btnAbrirFlotante.addEventListener("click", abrirPanelPedido);
  if (btnAbrirToast) btnAbrirToast.addEventListener("click", abrirPanelPedido);
  if (btnCerrarPanel) btnCerrarPanel.addEventListener("click", cerrarPanelPedido);
  if (btnSeguirComprando) btnSeguirComprando.addEventListener("click", cerrarPanelPedido);
  if (btnExplorarVacio) btnExplorarVacio.addEventListener("click", cerrarPanelPedido);
  if (fondoModal) fondoModal.addEventListener("click", cerrarPanelPedido);

  // Actualizar enlace activo en la navegación al cambiar de sección
  const enlacesNav = document.querySelectorAll(".nav-link");
  enlacesNav.forEach((enlace) => {
    enlace.addEventListener("click", () => {
      enlacesNav.forEach((el) => el.classList.remove("is-active"));
      enlace.classList.add("is-active");
    });
  });

  // Cerrar con tecla Escape
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      cerrarPanelPedido();
    }
  });

  // Delegación de eventos dentro de la lista de ítems del pedido (+, -, eliminar)
  const contenedorItemsPedido = document.getElementById("lista-items-pedido");
  if (contenedorItemsPedido) {
    contenedorItemsPedido.addEventListener("click", (evento) => {
      const botonAccion = evento.target.closest("[data-cart-action]");
      if (!botonAccion) return;

      const accion = botonAccion.getAttribute("data-cart-action");
      const id = botonAccion.getAttribute("data-id");
      const productoRef = CATALOGO_PRODUCTOS.find((p) => p.id === id);

      if (accion === "increment") {
        cambiarCantidadProducto(id, 1);
      } else if (accion === "decrement") {
        cambiarCantidadProducto(id, -1);
      } else if (accion === "remove") {
        eliminarProductoDelPedido(id);
        if (productoRef) {
          mostrarNotificacionDiscreta(`"${productoRef.nombre}" eliminado del pedido`);
        }
      }

      renderizarCatalogo();
      actualizarInterfazPedido();
    });
  }

  // Botón vaciar pedido
  const btnVaciar = document.getElementById("btn-vaciar-pedido");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      vaciarProductosDelPedido();
      renderizarCatalogo();
      actualizarInterfazPedido();
      mostrarNotificacionDiscreta("Se vació tu selección de productos");
    });
  }

  // Sincronización en tiempo real de los campos de personalización y solicitud
  const inputDedicatoria = document.getElementById("input-dedicatoria");
  const inputColores = document.getElementById("input-colores");
  const inputObservaciones = document.getElementById("input-observaciones");
  const inputFecha = document.getElementById("input-fecha-pedido");
  const selectFranja = document.getElementById("select-franja-horaria");
  const radiosModalidad = document.querySelectorAll('input[name="modalidad-entrega"]');

  if (inputDedicatoria) {
    inputDedicatoria.addEventListener("input", (e) => {
      actualizarDatosPedido({ dedicatoria: e.target.value });
      actualizarResumenSolicitudPrevia();
    });
  }

  if (inputColores) {
    inputColores.addEventListener("input", (e) => {
      actualizarDatosPedido({ coloresPreferidos: e.target.value });
      actualizarResumenSolicitudPrevia();
    });
  }

  if (inputObservaciones) {
    inputObservaciones.addEventListener("input", (e) => {
      actualizarDatosPedido({ observaciones: e.target.value });
      actualizarResumenSolicitudPrevia();
    });
  }

  if (inputFecha) {
    inputFecha.addEventListener("change", (e) => {
      const valorFecha = e.target.value;
      const mensajeErrorFecha = document.getElementById("error-fecha-pedido");
      const hoy = obtenerFechaMinimaHoy();

      if (!esFechaValida(valorFecha)) {
        if (mensajeErrorFecha) {
          mensajeErrorFecha.hidden = false;
          mensajeErrorFecha.textContent =
            "No es posible seleccionar una fecha anterior al día de hoy.";
        }
        e.target.value = hoy;
        actualizarDatosPedido({ fechaDeseada: hoy });
      } else {
        if (mensajeErrorFecha) mensajeErrorFecha.hidden = true;
        actualizarDatosPedido({ fechaDeseada: valorFecha });
      }
      actualizarResumenSolicitudPrevia();
    });
  }

  if (selectFranja) {
    selectFranja.addEventListener("change", (e) => {
      actualizarDatosPedido({ franjaHoraria: e.target.value });
      actualizarResumenSolicitudPrevia();
    });
  }

  radiosModalidad.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        actualizarDatosPedido({ modalidad: e.target.value });
        actualizarResumenSolicitudPrevia();
      }
    });
  });

  // Botón principal para enviar solicitud por WhatsApp desde el panel
  const btnEnviarWhatsApp = document.getElementById("btn-enviar-whatsapp");
  if (btnEnviarWhatsApp) {
    btnEnviarWhatsApp.addEventListener("click", manejarEnvioSolicitudWhatsApp);
  }

  // Botón de la sección de contacto ("Hacer pedido por WhatsApp")
  const btnContactoWhatsApp = document.getElementById("btn-contacto-whatsapp");
  if (btnContactoWhatsApp) {
    btnContactoWhatsApp.addEventListener("click", () => {
      if (obtenerTotalUnidades() > 0) {
        abrirPanelPedido();
      } else {
        const mensajeConsulta =
          `Hola *${CONFIG_TIENDA.nombreNegocio}*, me gustaría consultar por un arreglo floral personalizado. ¿Podrían orientarme con las opciones y flores de temporada disponibles?`;
        const url = construirUrlWhatsApp(mensajeConsulta);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  }
}

/**
 * Incorpora un producto al pedido actual y muestra confirmación visual discreta.
 */
function manejarAgregarProducto(productoId, elementoBoton) {
  const itemActualizado = agregarProductoAlPedido(productoId);
  if (!itemActualizado) return;

  // Actualizar tarjetas y panel de resumen
  renderizarCatalogo();
  actualizarInterfazPedido();

  // Confirmación visual discreta en la tarjeta recién pulsada
  const nuevaTarjeta = document.querySelector(`.product-card[data-product-id="${productoId}"]`);
  if (nuevaTarjeta) {
    const botonEnTarjeta = nuevaTarjeta.querySelector(".btn-add-product");
    if (botonEnTarjeta) {
      botonEnTarjeta.classList.add("is-added");
      botonEnTarjeta.innerHTML = `<span class="btn-add-text">Agregado (${itemActualizado.cantidad})</span><span class="btn-add-plus">✓</span>`;
      setTimeout(() => {
        if (botonEnTarjeta.isConnected) {
          botonEnTarjeta.classList.remove("is-added");
          botonEnTarjeta.innerHTML = `<span class="btn-add-text">Agregar al pedido</span><span class="btn-add-plus">+</span>`;
        }
      }, 1200);
    }
  }

  mostrarNotificacionDiscreta(
    `"${itemActualizado.nombre}" en tu pedido (${itemActualizado.cantidad} ${
      itemActualizado.cantidad === 1 ? "unidad" : "unidades"
    })`
  );
}

/**
 * Muestra un aviso flotante discreto cuando se agrega un producto.
 */
function mostrarNotificacionDiscreta(texto) {
  const toast = document.getElementById("toast-confirmacion");
  const toastTexto = document.getElementById("toast-texto");
  if (!toast || !toastTexto) return;

  toastTexto.textContent = texto;
  toast.classList.add("is-visible");

  if (temporizadorNotificacion) {
    clearTimeout(temporizadorNotificacion);
  }

  temporizadorNotificacion = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

/**
 * Actualiza todos los contadores, la lista de productos del resumen,
 * el total parcial y la vista previa del mensaje de WhatsApp.
 */
function actualizarInterfazPedido() {
  const totalUnidades = obtenerTotalUnidades();
  const totalParcial = obtenerTotalParcial();
  const moneda = CONFIG_TIENDA.moneda;

  // Contadores en encabezado y barra flotante
  const contadorHeader = document.getElementById("contador-pedido-header");
  const contadorFlotante = document.getElementById("contador-pedido-flotante");
  const totalFlotante = document.getElementById("total-pedido-flotante");
  const barraFlotante = document.getElementById("barra-pedido-flotante");

  if (contadorHeader) contadorHeader.textContent = totalUnidades;
  if (contadorFlotante) {
    contadorFlotante.textContent = `${totalUnidades} ${
      totalUnidades === 1 ? "producto" : "productos"
    }`;
  }
  if (totalFlotante) totalFlotante.textContent = `${totalParcial} ${moneda}`;
  if (barraFlotante) {
    barraFlotante.hidden = totalUnidades === 0;
  }

  // Lista de productos en el panel lateral
  const listaItemsEl = document.getElementById("lista-items-pedido");
  const estadoVacioEl = document.getElementById("pedido-vacio-mensaje");
  const bloqueContenidoPedido = document.getElementById("bloque-contenido-pedido");
  const totalParcialEl = document.getElementById("pedido-total-parcial");
  const btnEnviarWhatsApp = document.getElementById("btn-enviar-whatsapp");
  const mensajeErrorEnvio = document.getElementById("error-envio-pedido");

  if (mensajeErrorEnvio) mensajeErrorEnvio.hidden = true;
  if (!listaItemsEl) return;

  if (estadoPedido.items.length === 0) {
    listaItemsEl.innerHTML = "";
    if (estadoVacioEl) estadoVacioEl.hidden = false;
    if (bloqueContenidoPedido) bloqueContenidoPedido.hidden = true;
    if (totalParcialEl) totalParcialEl.textContent = `0 ${moneda}`;
    if (btnEnviarWhatsApp) btnEnviarWhatsApp.disabled = true;
  } else {
    if (estadoVacioEl) estadoVacioEl.hidden = true;
    if (bloqueContenidoPedido) bloqueContenidoPedido.hidden = false;
    if (btnEnviarWhatsApp) btnEnviarWhatsApp.disabled = false;

    listaItemsEl.innerHTML = estadoPedido.items
      .map((item) => {
        const subtotal = item.precio * item.cantidad;
        return `
          <li class="cart-item">
            <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img" />
            <div class="cart-item-details">
              <div class="cart-item-header">
                <h4 class="cart-item-title">${item.nombre}</h4>
                <button
                  type="button"
                  class="btn-remove-item"
                  data-cart-action="remove"
                  data-id="${item.id}"
                  title="Eliminar producto"
                  aria-label="Eliminar ${item.nombre} del pedido"
                >
                  Eliminar
                </button>
              </div>
              <p class="cart-item-unit-price">Precio unitario: ${item.precio} ${moneda}</p>
              <div class="cart-item-controls-row">
                <div class="quantity-controls" aria-label="Control de cantidad para ${item.nombre}">
                  <button
                    type="button"
                    class="btn-qty"
                    data-cart-action="decrement"
                    data-id="${item.id}"
                    aria-label="Disminuir cantidad de ${item.nombre}"
                  >−</button>
                  <span class="qty-value">${item.cantidad}</span>
                  <button
                    type="button"
                    class="btn-qty"
                    data-cart-action="increment"
                    data-id="${item.id}"
                    aria-label="Aumentar cantidad de ${item.nombre}"
                  >+</button>
                </div>
                <p class="cart-item-subtotal">
                  Subtotal: <strong>${subtotal} ${moneda}</strong>
                </p>
              </div>
            </div>
          </li>
        `;
      })
      .join("");

    if (totalParcialEl) {
      totalParcialEl.textContent = `${totalParcial} ${moneda}`;
    }
  }

  actualizarResumenSolicitudPrevia();
}

/**
 * Actualiza el recuadro de vista previa del resumen de la solicitud
 * antes de enviarla por WhatsApp.
 */
function actualizarResumenSolicitudPrevia() {
  const contenedorResumen = document.getElementById("vista-previa-solicitud");
  if (!contenedorResumen) return;

  if (estadoPedido.items.length === 0) {
    contenedorResumen.textContent = "Agrega al menos un producto para generar el resumen de tu solicitud.";
    return;
  }

  contenedorResumen.textContent = generarMensajeSolicitudWhatsApp();
}

/**
 * Abre el panel lateral del resumen y personalización del pedido.
 */
function abrirPanelPedido() {
  const panel = document.getElementById("panel-pedido");
  const overlay = document.getElementById("panel-overlay");
  if (!panel || !overlay) return;

  panel.classList.add("is-open");
  overlay.classList.add("is-visible");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

/**
 * Cierra el panel lateral del pedido.
 */
function cerrarPanelPedido() {
  const panel = document.getElementById("panel-pedido");
  const overlay = document.getElementById("panel-overlay");
  if (!panel || !overlay) return;

  panel.classList.remove("is-open");
  overlay.classList.remove("is-visible");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

/**
 * Valida la solicitud actual y abre el enlace de WhatsApp con el mensaje generado.
 */
function manejarEnvioSolicitudWhatsApp() {
  const inputFecha = document.getElementById("input-fecha-pedido");
  const mensajeErrorFecha = document.getElementById("error-fecha-pedido");
  const mensajeErrorEnvio = document.getElementById("error-envio-pedido");

  if (inputFecha) {
    actualizarDatosPedido({ fechaDeseada: inputFecha.value });
  }

  const validacion = validarPedidoParaEnvio();

  if (!validacion.valido) {
    if (mensajeErrorEnvio) {
      mensajeErrorEnvio.hidden = false;
      mensajeErrorEnvio.textContent = validacion.error;
    }
    if (!esFechaValida(estadoPedido.datosSolicitud.fechaDeseada)) {
      if (mensajeErrorFecha) {
        mensajeErrorFecha.hidden = false;
        mensajeErrorFecha.textContent =
          "Por favor, selecciona una fecha válida igual o posterior a hoy.";
      }
      if (inputFecha) inputFecha.focus();
    }
    return;
  }

  if (mensajeErrorFecha) mensajeErrorFecha.hidden = true;
  if (mensajeErrorEnvio) mensajeErrorEnvio.hidden = true;

  const textoMensaje = generarMensajeSolicitudWhatsApp();
  const urlWhatsApp = construirUrlWhatsApp(textoMensaje);
  window.open(urlWhatsApp, "_blank", "noopener,noreferrer");
}
