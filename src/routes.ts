import { Router } from 'express';
import { getDatosFusionados } from './controllers/FusionadosController';
import { postAlmacenarRelacion } from './controllers/AlmacenarController';
import { getHistorial } from './controllers/HistorialController';
import { getImagenesExoplaneta } from './controllers/ImagenesController';
import { limpiarDatos } from './controllers/LimpiezaController';
import { authMiddleware, generateToken } from './middleware/auth';
import { apiLimiter, almacenarLimiter } from './middleware/rateLimiter';

const router = Router();

// Ruta para generar token de prueba
router.get('/generate-token', (req, res) => {
    const userId = req.query.userId?.toString() || 'user123';
    const username = req.query.username?.toString() || 'testuser';
    const token = generateToken(userId, username);

    res.status(200).json({
        message: 'Token generado para pruebas',
        token,
        expiresIn: '1 día',
        tokenType: 'Bearer',
        userId,
        username
    });
});

// Rutas públicas con rate limiting básico
router.get('/fusionados', apiLimiter, getDatosFusionados);
router.get('/imagenes/:exoplaneta', apiLimiter, getImagenesExoplaneta);
router.get('/historial', apiLimiter, getHistorial);

// Rutas protegidas con autenticación y rate limiting
router.post('/almacenar', authMiddleware, almacenarLimiter, postAlmacenarRelacion);

// Ruta para limpiar datos (MySQL y caché)
router.get('/limpiar', authMiddleware, limpiarDatos);

// Ruta para verificar estado del API
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'ExoWars API',
        version: '1.1.0',
        timestamp: new Date().toISOString()
    });
});

export default router; 