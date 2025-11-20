/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * 
 * PROPÓSITO:
 * Este middleware centraliza la lógica de verificación de tokens JWT.
 * 
 * PROBLEMA QUE RESUELVE:
 * Antes, teníamos este código duplicado en /me y /profile:
 * 
 *   const auth = req.headers.authorization;
 *   if (!auth) return res.status(401).json({ message: 'No token' });
 *   const token = auth.split(' ')[1];
 *   const decoded = jwt.verify(token, jwtSecret);
 * 
 * BENEFICIOS:
 * 1. DRY (Don't Repeat Yourself) - código en un solo lugar
 * 2. Más fácil de mantener - cambios en un solo lugar
 * 3. Consistencia - mismo comportamiento en todas las rutas protegidas
 * 4. Seguridad - menos probabilidad de errores
 */

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'secret123';

/**
 * Middleware para verificar token JWT
 * 
 * CÓMO FUNCIONA:
 * 1. Extrae el token del header Authorization
 * 2. Verifica que el token sea válido
 * 3. Decodifica el token y agrega los datos a req.user
 * 4. Si todo está bien, llama a next() para continuar
 * 5. Si hay error, devuelve 401 Unauthorized
 * 
 * USO:
 * router.get('/ruta-protegida', verifyToken, (req, res) => {
 *   // Aquí req.user ya tiene los datos del usuario decodificados
 *   console.log(req.user.id); // ID del usuario
 * });
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
function verifyToken(req, res, next) {
    try {
        // 1. Obtener el header de autorización
        const auth = req.headers.authorization;

        // 2. Verificar que existe
        if (!auth) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // 3. Extraer el token (formato: "Bearer TOKEN_AQUI")
        const token = auth.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        // 4. Verificar y decodificar el token
        const decoded = jwt.verify(token, jwtSecret);

        // 5. Agregar los datos decodificados al request
        // Ahora cualquier ruta puede acceder a req.user
        req.user = decoded;

        // 6. Continuar con el siguiente middleware/ruta
        next();

    } catch (err) {
        // Si jwt.verify falla (token expirado, inválido, etc.)
        console.error('Token verification error:', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

/**
 * EJEMPLO DE USO:
 * 
 * ANTES (código duplicado):
 * router.get('/me', async (req, res) => {
 *   const auth = req.headers.authorization;
 *   if (!auth) return res.status(401).json({ message: 'No token' });
 *   const token = auth.split(' ')[1];
 *   const decoded = jwt.verify(token, jwtSecret);
 *   // ... resto del código
 * });
 * 
 * AHORA (usando middleware):
 * router.get('/me', verifyToken, async (req, res) => {
 *   // req.user ya tiene los datos decodificados
 *   const userId = req.user.id;
 *   // ... resto del código
 * });
 */

module.exports = { verifyToken };
