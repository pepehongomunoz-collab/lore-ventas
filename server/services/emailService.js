/**
 * EMAIL SERVICE - Brevo Integration
 * 
 * Servicio para enviar emails usando Brevo (SendinBlue)
 */

const brevo = require('@sendinblue/client');

// Configurar API de Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
);

/**
 * Función genérica para enviar emails
 */
async function sendEmail(to, subject, html) {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "Lore Ventas", email: "no-reply@loreventas.com" };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    try {
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email enviado exitosamente:', result);
        return result;
    } catch (error) {
        console.error('Error enviando email:', error);
        throw error;
    }
}

/**
 * NUEVO: Enviar email de recuperación de contraseña
 */
async function sendPasswordResetEmail(userEmail, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/pages/reset-password.html?token=${resetToken}`;

    const subject = 'Recuperación de Contraseña - Lore Ventas';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #888;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Recuperación de Contraseña</h1>
        </div>
        
        <div class="content">
          <p>Hola,</p>
          
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Lore Ventas</strong>.</p>
          
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </div>
          
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>2 horas</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
          </div>
          
          <p>Si tienes algún problema, contáctanos.</p>
          
          <p>Saludos,<br><strong>Equipo Lore Ventas</strong></p>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Lore Ventas. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    await sendEmail(userEmail, subject, html);
    console.log(`Email de recuperación enviado a: ${userEmail}`);
}

module.exports = {
    sendEmail,
    sendPasswordResetEmail
};
