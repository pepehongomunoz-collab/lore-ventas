/**
 * MIDDLEWARE DE AUTORIZACIÓN POR ROLES
 * 
 * PROPÓSITO:
 * Verificar que el usuario tenga uno de los roles permitidos para acceder a una ruta.
 * 
 * DIFERENCIA CON verifyToken:
 * - verifyToken: verifica que el usuario esté autenticado (tiene token válido)
 * - authorize: verifica que el usuario tenga el ROL correcto
 * 
 * USO:
 * router.get('/admin', verifyToken, authorize('admin', 'developer'), (req, res) => {
 *   // Solo admin y developer pueden acceder aquí
 * });
 */

/**
 * Middleware de autorización por roles
 * 
 * CÓMO FUNCIONA:
 * 1. Recibe una lista de roles permitidos
 * 2. Verifica que req.user.role esté en esa lista
 * 3. Si está permitido, continúa (next())
 * 4. Si no, devuelve 403 Forbidden
 * 
 * IMPORTANTE: Este middleware debe usarse DESPUÉS de verifyToken
 * porque necesita que req.user ya exista
 * 
 * @param {...string} roles - Roles permitidos (ej: 'admin', 'developer')
 * @returns {Function} Middleware de Express
 * 
 * EJEMPLOS:
 * 
 * // Solo admin puede acceder
 * router.get('/ruta', verifyToken, authorize('admin'), handler);
 * 
 * // Admin o developer pueden acceder
 * router.get('/ruta', verifyToken, authorize('admin', 'developer'), handler);
 * 
 * // Cualquier usuario autenticado (no necesita authorize)
 * router.get('/ruta', verifyToken, handler);
 */
function authorize(...roles) {
    return (req, res, next) => {
        // 1. Verificar que req.user existe (debe haber pasado por verifyToken)
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        // 2. Verificar que req.user.role existe
        if (!req.user.role) {
            return res.status(403).json({
                message: 'User role not defined'
            });
        }

        // 3. Verificar que el rol del usuario está en la lista de roles permitidos
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
            });
        }

        // 4. Si todo está bien, continuar
        next();
    };
}

/**
 * EJEMPLO DE USO COMPLETO:
 * 
 * const { verifyToken } = require('../middleware/auth');
 * const { authorize } = require('../middleware/authorize');
 * 
 * // Ruta solo para admin
 * router.get('/admin/users', 
 *   verifyToken,                    // 1. Verifica token
 *   authorize('admin', 'developer'), // 2. Verifica rol
 *   async (req, res) => {            // 3. Handler
 *     // req.user tiene: { id, email, role }
 *     const users = await User.find();
 *     res.json({ users });
 *   }
 * );
 * 
 * CÓDIGOS DE RESPUESTA:
 * - 401: No autenticado (no pasó verifyToken o no hay req.user)
 * - 403: Autenticado pero sin permisos (rol incorrecto)
 * - 200: Todo OK, tiene permisos
 */

module.exports = { authorize };
