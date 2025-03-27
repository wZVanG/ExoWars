import { createClient } from 'redis';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';

dotenv.config();

// Configuración para Redis
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Cache local como fallback si Redis no está disponible
const localCache = new NodeCache({ stdTTL: 1800 }); // 30 minutos por defecto

// Crear cliente Redis
const createRedisClient = async () => {
    try {
        const client = createClient({
            socket: {
                host: redisConfig.host,
                port: redisConfig.port
            }
        });

        client.on('error', (err) => {
            console.error('Error en Redis:', err);
        });

        await client.connect();
        console.log('Conexión a Redis establecida correctamente');
        return client;
    } catch (error) {
        console.error('No se pudo conectar a Redis, usando caché local:', error);
        return null;
    }
};

// Obtener valor de caché
const getCacheValue = async (key: string) => {
    try {
        const client = await createRedisClient();
        if (client) {
            const value = await client.get(key);
            await client.quit();
            return value ? JSON.parse(value) : null;
        } else {
            return localCache.get(key) || null;
        }
    } catch (error) {
        console.error('Error al obtener valor de caché:', error);
        return localCache.get(key) || null;
    }
};

// Establecer valor en caché
const setCacheValue = async (key: string, value: any, ttl: number = 1800) => {
    try {
        const client = await createRedisClient();
        if (client) {
            await client.setEx(key, ttl, JSON.stringify(value));
            await client.quit();
        } else {
            localCache.set(key, value, ttl);
        }
    } catch (error) {
        console.error('Error al establecer valor en caché:', error);
        localCache.set(key, value, ttl);
    }
};

// Limpiar toda la caché
const clearCache = async (): Promise<boolean> => {
    try {
        // Limpiar Redis
        const client = await createRedisClient();
        if (client) {
            await client.flushAll();
            await client.quit();
            console.log('Caché de Redis limpiada correctamente');
        }

        // Limpiar caché local como respaldo
        localCache.flushAll();
        console.log('Caché local limpiada correctamente');

        return true;
    } catch (error) {
        console.error('Error al limpiar caché:', error);
        return false;
    }
};

export { getCacheValue, setCacheValue, clearCache }; 