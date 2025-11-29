/**
 * CONTACT.JS
 * 
 * Maneja el formulario de contacto usando EmailJS.
 */

// Inicializar EmailJS
(function () {
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: "zN5poxSAc6404Q5HP" // Tu clave pública real
        });
    } else {
        console.error("EmailJS SDK not loaded");
    }
})();

/**
 * Muestra una alerta de Bootstrap
 * @param {string} mensaje - El mensaje a mostrar
 * @param {string} tipo - El tipo de alerta (success, danger, etc.)
 */
function mostrarAlertaBootstrap(mensaje, tipo) {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    if (!alertPlaceholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    `;
    alertPlaceholder.innerHTML = ''; // Limpia alertas anteriores
    alertPlaceholder.append(wrapper);
}

/**
 * Maneja el envío del formulario de contacto
 * @param {Event} e - El evento de submit
 */
window.enviarConsulta = function (e) {
    e.preventDefault();

    const templateParams = {
        name: document.getElementById("nombre").value,
        message:
            "📞 Teléfono: " + document.getElementById("telefono").value + "\n" +
            "📧 Correo: " + document.getElementById("email").value + "\n\n" +
            "📝 Consulta:\n" + document.getElementById("mensaje").value,
        time: new Date().toLocaleString()
    };

    emailjs.send("service_bnvn7b9", "template_x1rc0b3", templateParams)
        .then(function (response) {
            console.log("✅ Envío exitoso:", response);
            mostrarAlertaBootstrap("Tu consulta fue enviada correctamente. ¡Gracias por contactarte!", "success");
            document.getElementById("form-contacto").reset();
        }, function (error) {
            console.error("❌ Error al enviar:", error);
            mostrarAlertaBootstrap("Ocurrió un error al enviar la consulta. Revisá la consola para más detalles.", "danger");
        });
}
