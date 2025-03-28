import { createClient } from 'redis';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import { dbType, DatabaseType, dynamoClient } from './database';
import AWS from 'aws-sdk';

dotenv.config();

// Nombre de la tabla DynamoDB para caché
const CACHE_TABLE_NAME = 'exowars_cache';

// Configuración para Redis
const redisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Cache local como fallback si Redis no está disponible
const localCache = new NodeCache({ stdTTL: 1800 }); // 30 minutos por defecto

// Inicializar tabla de caché en DynamoDB
export const initCacheTable = async () => {
    if (dbType === DatabaseType.DYNAMODB) {
        try {
            // Verificamos si la tabla existe
            const dynamo = new AWS.DynamoDB();

            try {
                await dynamo.describeTable({ TableName: CACHE_TABLE_NAME }).promise();
                console.log(`Tabla de caché ${CACHE_TABLE_NAME} ya existe en DynamoDB`);
            } catch (tableError) {
                // Si la tabla no existe, la creamos con TTL
                const params = {
                    TableName: CACHE_TABLE_NAME,
                    KeySchema: [
                        { AttributeName: 'key', KeyType: 'HASH' }
                    ],
                    AttributeDefinitions: [
                        { AttributeName: 'key', AttributeType: 'S' }
                    ],
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                };

                await dynamo.createTable(params).promise();
                console.log(`Tabla de caché ${CACHE_TABLE_NAME} creada en DynamoDB`);

                // Esperar a que la tabla esté activa antes de configurar TTL
                console.log(`Esperando a que la tabla ${CACHE_TABLE_NAME} esté activa...`);

                await dynamo.waitFor('tableExists', { TableName: CACHE_TABLE_NAME }).promise();

                // Esperar un poco más para asegurarnos que la tabla está completamente disponible
                await new Promise(resolve => setTimeout(resolve, 5000));

                try {
                    // Configurar TTL
                    await dynamo.updateTimeToLive({
                        TableName: CACHE_TABLE_NAME,
                        TimeToLiveSpecification: {
                            Enabled: true,
                            AttributeName: 'expires_at'
                        }
                    }).promise();
                    console.log('TTL configurado para tabla de caché DynamoDB');
                } catch (ttlError) {
                    console.error('Error al configurar TTL:', ttlError);
                    // Incluso si falla TTL, la tabla aún es utilizable
                }
            }
        } catch (error) {
            console.error('Error al inicializar tabla de caché en DynamoDB:', error);
        }
    }
};

// Crear cliente Redis
const createRedisClient = async () => {
    // Solo creamos el cliente Redis si estamos usando MySQL o si se fuerza su uso
    if (dbType === DatabaseType.DYNAMODB) {
        return null;
    }

    try {
        const client = createClient({
            url: redisConfig.url,
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
    // Si usamos DynamoDB, obtenemos de la tabla de caché
    if (dbType === DatabaseType.DYNAMODB) {
        try {
            const params = {
                TableName: CACHE_TABLE_NAME,
                Key: { key }
            };

            const result = await dynamoClient.get(params).promise();

            if (result.Item) {
                const now = Math.floor(Date.now() / 1000);

                // Verificar si el ítem ha expirado
                if (!result.Item.expires_at || result.Item.expires_at > now) {
                    return JSON.parse(result.Item.value);
                }

                // Si expiró, lo eliminamos
                await dynamoClient.delete(params).promise();
                return null;
            }
            return null;
        } catch (error) {
            console.error('Error al obtener valor de caché en DynamoDB:', error);
            return null;
        }
    } else {
        // Comportamiento original para MySQL con Redis o caché local
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
    }
};

// Establecer valor en caché
const setCacheValue = async (key: string, value: any, ttl: number = 1800) => {
    // Si usamos DynamoDB, guardamos en la tabla de caché con TTL
    if (dbType === DatabaseType.DYNAMODB) {
        try {
            const now = Math.floor(Date.now() / 1000);
            const expires_at = now + ttl;

            const params = {
                TableName: CACHE_TABLE_NAME,
                Item: {
                    key,
                    value: JSON.stringify(value),
                    created_at: now,
                    expires_at
                }
            };

            await dynamoClient.put(params).promise();
        } catch (error) {
            console.error('Error al establecer valor en caché DynamoDB:', error);
        }
    } else {
        // Comportamiento original para MySQL con Redis o caché local
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
    }
};

// Limpiar toda la caché
const clearCache = async (): Promise<boolean> => {
    try {
        if (dbType === DatabaseType.DYNAMODB) {
            // Para DynamoDB, escaneamos todos los items y los eliminamos
            const scanParams = {
                TableName: CACHE_TABLE_NAME
            };

            const result = await dynamoClient.scan(scanParams).promise();

            if (result.Items && result.Items.length > 0) {
                const promises = result.Items.map(item => {
                    const deleteParams = {
                        TableName: CACHE_TABLE_NAME,
                        Key: { key: item.key }
                    };

                    return dynamoClient.delete(deleteParams).promise();
                });

                await Promise.all(promises);
            }

            console.log('Caché de DynamoDB limpiada correctamente');
        } else {
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
        }

        return true;
    } catch (error) {
        console.error('Error al limpiar caché:', error);
        return false;
    }
};

// Exportamos las funciones públicas
export { getCacheValue, setCacheValue, clearCache }; 