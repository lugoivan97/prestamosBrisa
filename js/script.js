/* ==========================================================
   TuPrestamo - script.js
   - Las tasas y el recargo por mora los define la administradora
     desde el panel oculto (no vienen precargados por nosotros).
   - No se solicitan ni se guardan fotos de documentos.
   ========================================================== */

/* ---------- Utilidades ---------- */

function formatearDinero(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(Math.round(valor));
}

function formatearFecha(fecha) {
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(fecha);
}

function sumarDias(fecha, dias) {
    const nueva = new Date(fecha);
    nueva.setDate(nueva.getDate() + dias);
    return nueva;
}

function generarId() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/* ---------- Almacenamiento local ---------- */

const CLAVE_CONFIG = 'tp_config';
const CLAVE_ACTIVOS = 'tp_prestamos_activos';
const CLAVE_HISTORIAL = 'tp_historial';

function obtenerConfig() {
    const guardado = localStorage.getItem(CLAVE_CONFIG);
    if (guardado) return JSON.parse(guardado);

    // Valores de ejemplo iniciales: la administradora los puede cambiar
    // en cualquier momento desde el panel de administración.
    const config = {
        tasa7: 5,
        tasa15: 8,
        tasa30: 15,
        mora: 2,
        telefono: '5491131055357',
        clave: null // se define la primera vez que se entra al panel admin
    };
    localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
    return config;
}

function guardarConfig(config) {
    localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
}

function obtenerActivos() {
    return JSON.parse(localStorage.getItem(CLAVE_ACTIVOS) || '[]');
}

function guardarActivos(lista) {
    localStorage.setItem(CLAVE_ACTIVOS, JSON.stringify(lista));
}

function obtenerHistorial() {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || '[]');
}

function guardarHistorial(lista) {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(lista));
}

/* ---------- Estado del formulario ---------- */

let plazoSeleccionado = 15;
let condicionesAceptadas = false;

const elMontoRango = document.getElementById('monto-rango');
const elMontoVisible = document.getElementById('monto-visible');
const elInteresVisible = document.getElementById('interes-visible');
const elCuotaVisible = document.getElementById('cuota-visible');
const elFechaVisible = document.getElementById('fecha-visible');
const elOpcionesPlazo = document.getElementById('opciones-plazo');

function tasaSegunPlazo(dias, config) {
    if (dias === 7) return config.tasa7;
    if (dias === 15) return config.tasa15;
    return config.tasa30;
}

function calcularYMostrar() {
    const config = obtenerConfig();
    const monto = Number(elMontoRango.value);
    const tasa = tasaSegunPlazo(plazoSeleccionado, config);
    const total = monto * (1 + tasa / 100);
    const vencimiento = sumarDias(new Date(), plazoSeleccionado);

    elMontoVisible.innerText = formatearDinero(monto);
    elInteresVisible.innerText = `${tasa}% (${plazoSeleccionado} días)`;
    elCuotaVisible.innerText = formatearDinero(total);
    elFechaVisible.innerText = formatearFecha(vencimiento);

    return { monto, tasa, total, vencimiento };
}

elMontoRango.addEventListener('input', calcularYMostrar);

elOpcionesPlazo.addEventListener('click', (e) => {
    const boton = e.target.closest('.btn-plazo');
    if (!boton) return;
    document.querySelectorAll('.btn-plazo').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    plazoSeleccionado = Number(boton.dataset.dias);
    calcularYMostrar();
});

calcularYMostrar();

/* ---------- Modal de condiciones ---------- */

const elModalCondiciones = document.getElementById('modal-condiciones');
const elDetalleMoraModal = document.getElementById('detalle-mora-modal');
const elCheckAcepto = document.getElementById('check-acepto-condiciones');
const elBtnAceptarModal = document.getElementById('btn-aceptar-modal');
const elBloqueDatos = document.getElementById('bloque-datos-personales');

document.getElementById('btn-ver-condiciones').addEventListener('click', () => {
    const config = obtenerConfig();
    elDetalleMoraModal.innerText =
        `Recargo por mora vigente: ${config.mora}% por cada día de atraso sobre el total adeudado.`;
    elCheckAcepto.checked = condicionesAceptadas;
    elBtnAceptarModal.disabled = !condicionesAceptadas;
    elModalCondiciones.classList.remove('oculto');
});

elCheckAcepto.addEventListener('change', () => {
    elBtnAceptarModal.disabled = !elCheckAcepto.checked;
});

document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
    elModalCondiciones.classList.add('oculto');
});

elBtnAceptarModal.addEventListener('click', () => {
    condicionesAceptadas = true;
    elModalCondiciones.classList.add('oculto');
    elBloqueDatos.classList.remove('bloque-oculto');
    elBloqueDatos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    validarDatosPersonales();
});

/* ---------- Datos personales y habilitación del botón de WhatsApp ---------- */

const elNombre = document.getElementById('nombre-usuario');
const elDireccion = document.getElementById('direccion-usuario');
const elTelefono1 = document.getElementById('telefono-1');
const elTelefono2 = document.getElementById('telefono-2');
const elErrorDatos = document.getElementById('error-datos');
const elBtnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');

function limpiarTelefono(valor) {
    return valor.replace(/\D/g, '');
}

function validarDatosPersonales() {
    const nombre = elNombre.value.trim();
    const direccion = elDireccion.value.trim();
    const tel1 = limpiarTelefono(elTelefono1.value);
    const tel2 = limpiarTelefono(elTelefono2.value);

    let error = '';
    if (!condicionesAceptadas) {
        error = '';
    } else if (!nombre || !direccion || !tel1 || !tel2) {
        error = '';
    } else if (tel1.length < 8 || tel2.length < 8) {
        error = 'Revisá que ambos teléfonos estén completos.';
    } else if (tel1 === tel2) {
        error = 'Los dos números de teléfono deben ser distintos.';
    }

    elErrorDatos.innerText = error;
    const todoCompleto = nombre && direccion && tel1 && tel2 && tel1 !== tel2 && tel1.length >= 8 && tel2.length >= 8;
    elBtnEnviarWhatsapp.disabled = !todoCompleto;
    return todoCompleto;
}

[elNombre, elDireccion, elTelefono1, elTelefono2].forEach(el => {
    el.addEventListener('input', validarDatosPersonales);
});

/* ---------- Envío por WhatsApp + registro del préstamo ---------- */

elBtnEnviarWhatsapp.addEventListener('click', () => {
    if (!validarDatosPersonales()) return;

    const config = obtenerConfig();
    const { monto, tasa, total, vencimiento } = calcularYMostrar();

    const registro = {
        id: generarId(),
        nombre: elNombre.value.trim(),
        direccion: elDireccion.value.trim(),
        telefono1: elTelefono1.value.trim(),
        telefono2: elTelefono2.value.trim(),
        monto,
        plazoDias: plazoSeleccionado,
        tasa,
        total,
        fechaSolicitud: new Date().toISOString(),
        fechaVencimiento: vencimiento.toISOString(),
        pagado: false
    };

    const activos = obtenerActivos();
    activos.push(registro);
    guardarActivos(activos);

    const textoMensaje =
        `*Solicitud de préstamo - TuPrestamo*\n\n` +
        `Monto solicitado: ${formatearDinero(monto)}\n` +
        `Plazo: ${plazoSeleccionado} días\n` +
        `Interés: ${tasa}%\n` +
        `Total a devolver: *${formatearDinero(total)}*\n` +
        `Fecha de vencimiento: ${formatearFecha(vencimiento)}\n\n` +
        `Nombre: ${registro.nombre}\n` +
        `Dirección: ${registro.direccion}\n` +
        `Teléfono 1: ${registro.telefono1}\n` +
        `Teléfono 2: ${registro.telefono2}\n\n` +
        `Acepto las condiciones informadas en la web (recargo por mora del ${config.mora}% diario, ` +
        `un solo préstamo vigente a la vez, aviso previo si no puedo pagar en fecha, ` +
        `y forma de pago a convenir).`;

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${config.telefono}&text=${encodeURIComponent(textoMensaje)}`;
    window.open(urlWhatsApp, '_blank');
});

/* ==========================================================
   PANEL ADMIN (oculto)
   Se activa haciendo clic 5 veces seguidas sobre el nombre
   "TuPrestamo" del logo, en menos de 2 segundos entre clics.
   ========================================================== */

const elDisparadorAdmin = document.getElementById('disparador-admin');
let contadorClicsAdmin = 0;
let temporizadorClicsAdmin = null;

elDisparadorAdmin.addEventListener('click', () => {
    contadorClicsAdmin++;
    clearTimeout(temporizadorClicsAdmin);
    temporizadorClicsAdmin = setTimeout(() => { contadorClicsAdmin = 0; }, 2000);

    if (contadorClicsAdmin >= 5) {
        contadorClicsAdmin = 0;
        abrirLoginAdmin();
    }
});

const elModalAdminLogin = document.getElementById('modal-admin-login');
const elTituloAdminLogin = document.getElementById('titulo-admin-login');
const elAyudaAdminLogin = document.getElementById('ayuda-admin-login');
const elInputClaveAdmin = document.getElementById('input-clave-admin');
const elInputClaveAdminConfirmar = document.getElementById('input-clave-admin-confirmar');
const elErrorAdminLogin = document.getElementById('error-admin-login');

function abrirLoginAdmin() {
    const config = obtenerConfig();
    elInputClaveAdmin.value = '';
    elInputClaveAdminConfirmar.value = '';
    elErrorAdminLogin.innerText = '';

    if (!config.clave) {
        elTituloAdminLogin.innerText = 'Crear clave de acceso';
        elAyudaAdminLogin.innerText = 'Es la primera vez que entrás al panel. Elegí una clave para proteger el acceso.';
        elInputClaveAdminConfirmar.classList.remove('bloque-oculto');
    } else {
        elTituloAdminLogin.innerText = 'Acceso administrador';
        elAyudaAdminLogin.innerText = '';
        elInputClaveAdminConfirmar.classList.add('bloque-oculto');
    }

    elModalAdminLogin.classList.remove('oculto');
    elInputClaveAdmin.focus();
}

document.getElementById('btn-cerrar-admin-login').addEventListener('click', () => {
    elModalAdminLogin.classList.add('oculto');
});

document.getElementById('btn-confirmar-admin-login').addEventListener('click', () => {
    const config = obtenerConfig();

    if (!config.clave) {
        const clave = elInputClaveAdmin.value;
        const confirmacion = elInputClaveAdminConfirmar.value;
        if (clave.length < 4) {
            elErrorAdminLogin.innerText = 'La clave debe tener al menos 4 caracteres.';
            return;
        }
        if (clave !== confirmacion) {
            elErrorAdminLogin.innerText = 'Las claves no coinciden.';
            return;
        }
        config.clave = clave;
        guardarConfig(config);
        elModalAdminLogin.classList.add('oculto');
        abrirPanelAdmin();
        return;
    }

    if (elInputClaveAdmin.value !== config.clave) {
        elErrorAdminLogin.innerText = 'Clave incorrecta.';
        return;
    }

    elModalAdminLogin.classList.add('oculto');
    abrirPanelAdmin();
});

/* ---------- Panel admin: pestañas ---------- */

const elPanelAdmin = document.getElementById('panel-admin');

document.getElementById('btn-cerrar-admin').addEventListener('click', () => {
    elPanelAdmin.classList.add('oculto');
});

document.querySelectorAll('.tab-admin').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-admin').forEach(t => t.classList.remove('activo'));
        document.querySelectorAll('.contenido-tab').forEach(c => c.classList.add('oculto'));
        tab.classList.add('activo');
        document.getElementById('tab-' + tab.dataset.tab).classList.remove('oculto');
    });
});

function abrirPanelAdmin() {
    cargarConfigEnFormulario();
    renderizarActivos();
    renderizarHistorial();
    elPanelAdmin.classList.remove('oculto');
}

/* ---------- Panel admin: configuración ---------- */

function cargarConfigEnFormulario() {
    const config = obtenerConfig();
    document.getElementById('cfg-tasa7').value = config.tasa7;
    document.getElementById('cfg-tasa15').value = config.tasa15;
    document.getElementById('cfg-tasa30').value = config.tasa30;
    document.getElementById('cfg-mora').value = config.mora;
    document.getElementById('cfg-telefono').value = config.telefono;
    document.getElementById('cfg-nueva-clave').value = '';
    document.getElementById('msg-guardado-config').classList.add('oculto');
}

document.getElementById('btn-guardar-config').addEventListener('click', () => {
    const config = obtenerConfig();
    config.tasa7 = Number(document.getElementById('cfg-tasa7').value) || 0;
    config.tasa15 = Number(document.getElementById('cfg-tasa15').value) || 0;
    config.tasa30 = Number(document.getElementById('cfg-tasa30').value) || 0;
    config.mora = Number(document.getElementById('cfg-mora').value) || 0;
    config.telefono = document.getElementById('cfg-telefono').value.trim() || config.telefono;

    const nuevaClave = document.getElementById('cfg-nueva-clave').value;
    if (nuevaClave) {
        if (nuevaClave.length < 4) {
            alert('La nueva clave debe tener al menos 4 caracteres.');
            return;
        }
        config.clave = nuevaClave;
    }

    guardarConfig(config);
    document.getElementById('msg-guardado-config').classList.remove('oculto');
    calcularYMostrar();
});

/* ---------- Panel admin: préstamos activos ---------- */

function renderizarActivos() {
    const contenedor = document.getElementById('lista-activos');
    const activos = obtenerActivos().sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

    if (activos.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio-lista">No hay préstamos activos en este momento.</p>';
        return;
    }

    contenedor.innerHTML = activos.map(p => {
        const vencido = new Date(p.fechaVencimiento) < new Date();
        return `
            <div class="tarjeta-prestamo-admin" data-id="${p.id}">
                <div class="cabecera-tarjeta-prestamo">
                    <h4>${p.nombre}</h4>
                    <span class="badge-vencimiento ${vencido ? 'vencido' : ''}">
                        ${vencido ? 'Vencido' : 'Vence'} el ${formatearFecha(new Date(p.fechaVencimiento))}
                    </span>
                </div>
                <div class="detalle-tarjeta-prestamo">
                    <div>Monto: <b>${formatearDinero(p.monto)}</b> a ${p.plazoDias} días (${p.tasa}%)</div>
                    <div>Total a cobrar: <b>${formatearDinero(p.total)}</b></div>
                    <div>Dirección: <b>${p.direccion}</b></div>
                    <div>Teléfonos: <b>${p.telefono1}</b> / <b>${p.telefono2}</b></div>
                    <div>Fecha del préstamo: <b>${formatearFecha(new Date(p.fechaSolicitud))}</b></div>
                </div>
                <button type="button" class="btn-marcar-pagado" data-id="${p.id}">
                    <i class="fa-solid fa-check"></i> Marcar como pagado
                </button>
            </div>
        `;
    }).join('');

    contenedor.querySelectorAll('.btn-marcar-pagado').forEach(btn => {
        btn.addEventListener('click', () => marcarComoPagado(btn.dataset.id));
    });
}

function marcarComoPagado(id) {
    const activos = obtenerActivos();
    const indice = activos.findIndex(p => p.id === id);
    if (indice === -1) return;

    const prestamo = activos[indice];
    activos.splice(indice, 1);
    guardarActivos(activos);

    // Se guarda solo la información escrita (nunca se pidieron ni
    // guardaron fotos de documentos), con la fecha real de pago.
    const historial = obtenerHistorial();
    historial.push({
        ...prestamo,
        fechaPago: new Date().toISOString()
    });
    guardarHistorial(historial);

    renderizarActivos();
    renderizarHistorial();
}

/* ---------- Panel admin: historial ---------- */

function renderizarHistorial() {
    const contenedor = document.getElementById('lista-historial');
    const historial = obtenerHistorial().sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

    if (historial.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio-lista">Todavía no hay préstamos cancelados.</p>';
        return;
    }

    contenedor.innerHTML = historial.map(p => `
        <div class="tarjeta-prestamo-admin">
            <div class="cabecera-tarjeta-prestamo">
                <h4>${p.nombre}</h4>
                <span class="badge-vencimiento">Pagado el ${formatearFecha(new Date(p.fechaPago))}</span>
            </div>
            <div class="detalle-tarjeta-prestamo">
                <div>Monto prestado: <b>${formatearDinero(p.monto)}</b> a ${p.plazoDias} días (${p.tasa}%)</div>
                <div>Total cobrado: <b>${formatearDinero(p.total)}</b></div>
                <div>Dirección: <b>${p.direccion}</b></div>
                <div>Teléfonos: <b>${p.telefono1}</b> / <b>${p.telefono2}</b></div>
                <div>Fecha del préstamo: <b>${formatearFecha(new Date(p.fechaSolicitud))}</b></div>
            </div>
        </div>
    `).join('');
}
