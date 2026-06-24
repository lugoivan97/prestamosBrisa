// Función para dar formato de dinero de Argentina ($450.000)
function formatearDinero(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(valor);
}

// 1. Esta función se ejecuta CADA VEZ que movés la barra
function actualizarMonto(valor) {
    // Convertimos el valor de la barra a número
    const montoSeleccionado = Number(valor);
    
    // Calculamos una cuota simulada (Monto + 20% de interés de ejemplo para la maqueta)
    const cuotaSimulada = montoSeleccionado * 1.20;
    
    // Actualizamos los textos en la pantalla en tiempo real
    document.getElementById('monto-visible').innerText = formatearDinero(montoSeleccionado);
    document.getElementById('cuota-visible').innerText = formatearDinero(cuotaSimulada);
}

// 2. Función que arma el mensaje real basado en la posición de la barra
function enviarSolicitud(event) {
    event.preventDefault();
    
    const montoRaw = Number(document.getElementById('monto-rango').value);
    const nombreCliente = document.getElementById('nombre-usuario').value;
    
    // Calculamos el mismo interés para el mensaje de WhatsApp
    const cuotaCalculada = montoRaw * 1.20;
    
    const montoFormateado = formatearDinero(montoRaw);
    const cuotaFormateada = formatearDinero(cuotaCalculada);
    const fechaCuota = "31 de mayo"; // Fecha fija para la maqueta
    
    // Armamos el texto usando los valores dinámicos reales
    const textoMensaje = `•PRESTAMO por un total de ${montoFormateado}\n` +
                         `1era cuota: *${cuotaFormateada} el ${fechaCuota}*\n` +
                         `Pago vía transferencia.\n` +
                         `Alias: brisacamilan1\n` +
                         `Datos: Brisa Camila Cejas,\n` +
                         `NARANJA X. 43901308.\n` +
                         `*Chequear datos antes de transferir*\n` +
                         `Gracias!!!\n` +
                         `*atraso por día 10% de recargo cada dia*`;

    // Número de teléfono de tu amiga (reemplazalo por el real)
    const numeroTelefono = "5491131055357"; 

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${encodeURIComponent(textoMensaje)}`;
    
    window.open(urlWhatsApp, '_blank');
}