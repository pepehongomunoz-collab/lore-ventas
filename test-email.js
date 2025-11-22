require('dotenv').config({ path: './server/.env' });
const { sendPasswordResetEmail } = require('./server/services/emailService');

// Email de prueba (puedes cambiarlo si quieres probar con otro)
// Usaremos un email genérico o el que el usuario mencione si lo supiera, 
// pero mejor pedirle que lo ejecute o usar uno de prueba.
const testEmail = 'test@example.com';
const testToken = 'token-de-prueba-123456';

console.log('--- INICIO DE PRUEBA DE EMAIL ---');
console.log('API Key configurada:', process.env.BREVO_API_KEY ? 'SÍ (Oculta)' : 'NO');
console.log('Enviando email a:', testEmail);

async function runTest() {
    try {
        await sendPasswordResetEmail(testEmail, testToken);
        console.log('✅ Email enviado exitosamente.');
        console.log('Revisa la bandeja de entrada de:', testEmail);
        console.log('(Si es un email ficticio, obviamente no llegará, pero confirma que Brevo aceptó la solicitud)');
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        if (error.response) {
            console.error('Detalles del error de Brevo:', JSON.stringify(error.response.body, null, 2));
        }
    }
}

runTest();
