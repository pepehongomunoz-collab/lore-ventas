// ============================================================
// AGREGAR ESTOS ENDPOINTS A server/routes/auth.js
// ANTES DE: module.exports = router;
// ============================================================

// PRIMERO: Agregar estos imports al inicio del archivo (después de las otras constantes):
// const crypto = require('crypto');
// const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * NUEVO: SOLICITAR RECUPERACIÓN DE CONTRASEÑA
 * Genera un token de reseteo y envía email con enlace
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email es requerido' });
        }

        // Buscar usuario
        const user = await User.findOne({ email: email.toLowerCase() });

        // IMPORTANTE: No revelar si el email existe o no (prevenir enumeración de usuarios)
        if (!user) {
            return res.json({
                message: 'Si el email existe, recibirás un enlace de recuperación'
            });
        }

        // Generar token aleatorio de 32 bytes
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hashear el token antes de guardarlo (seguridad adicional)
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Guardar token y expiración (2 horas desde ahora)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 2 * 60 * 60 * 1000; // 2 horas
        await user.save();

        // Enviar email con el token SIN hashear
        try {
            await sendPasswordResetEmail(user.email, resetToken);
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            // Limpiar token si falla el envío
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            return res.status(500).json({
                message: 'Error al enviar el email de recuperación. Intenta de nuevo más tarde.'
            });
        }

        res.json({
            message: 'Si el email existe, recibirás un enlace de recuperación'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

/**
 * NUEVO: RESETEAR CONTRASEÑA CON TOKEN
 * Verifica el token y actualiza la contraseña
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        // Validar longitud de contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Hashear el token recibido para comparar
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Buscar usuario con token válido y no expirado
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Mayor que ahora = no expirado
        });

        if (!user) {
            return res.status(400).json({
                message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.'
            });
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña y limpiar token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});
