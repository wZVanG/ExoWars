import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Cache para almacenar las solicitudes por IP
const requestCache = new NodeCache({ stdTTL: 60 }); // 60 segundos de TTL

// Interfaz para configurar el rate limiter
interface RateLimiterOptions {
    windowMs: number; // Ventana de tiempo en milisegundos
    max: number; // Número máximo de solicitudes permitidas en la ventana
    message?: string; // Mensaje personalizado para respuesta de error
}

// Función para crear middleware de rate limiting
export const createRateLimiter = (options: RateLimiterOptions) => {
    const { windowMs, max, message } = options;

    // Convertir windowMs a segundos para el TTL de NodeCache
    const windowSec = Math.ceil(windowMs / 1000);

    return (req: Request, res: Response, next: NextFunction): void => {
        // Obtener IP del cliente
        const ip = req.ip || req.socket.remoteAddress || 'unknown';

        // Clave única para esta IP y ruta
        const key = `${ip}:${req.originalUrl}`;

        // Obtener contador actual
        let requests = requestCache.get<number>(key) || 0;

        // Incrementar contador
        requests++;

        // Verificar si excede el límite
        if (requests > max) {
            res.status(429).json({
                error: 'Demasiadas solicitudes',
                message: message || `Demasiadas solicitudes, por favor intente de nuevo en ${windowSec} segundos.`
            });
            return;
        }

        // Guardar contador actualizado
        requestCache.set(key, requests, windowSec);

        // Añadir headers de rate limit
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', (max - requests).toString());

        next();
    };
};

// Crear limitadores predefinidos
export const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // 60 solicitudes por minuto
    message: 'Demasiadas solicitudes a la API, por favor intente de nuevo en 1 minuto.'
});

export const almacenarLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 solicitudes por minuto
    message: 'Demasiadas solicitudes de almacenamiento, por favor intente de nuevo en 1 minuto.'
}); 