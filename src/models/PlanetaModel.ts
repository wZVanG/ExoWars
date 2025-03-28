import { pool, dynamoClient, dbType, DatabaseType } from '../config/database';
import AWS from 'aws-sdk';

export interface StarWarsPlaneta {
    nombre: string;
    clima: string;
    terreno: string;
    poblacion: string;
    diametro: string;
}

export interface ExoPlaneta {
    nombre: string;
    temperatura: string;
    distancia_tierra: string;
    descripcion: string;
    imagen_url?: string;
    edad_sistema?: string;
    ascension_recta?: string;
    declinacion?: string;
    distancia_ly?: string;
}

export interface PlanetaRelacion {
    id?: number;
    starwars_planet: string;
    exoplanet: string;
    description: string;
    image_url?: string;
    created_at?: Date;
}

// Nombre de la tabla DynamoDB
const TABLA_NOMBRE = 'planeta_relaciones';

// Inicializar tabla en la base de datos
export const initPlanetaTabla = async () => {
    if (dbType === DatabaseType.MYSQL) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS planeta_relaciones (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    starwars_planet VARCHAR(255) NOT NULL,
                    exoplanet VARCHAR(255) NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Tabla planeta_relaciones inicializada correctamente en MySQL');
        } catch (error) {
            console.error('Error al inicializar tabla planeta_relaciones en MySQL:', error);
        }
    } else {
        try {
            // Para DynamoDB, verificamos si la tabla existe
            const dynamo = new AWS.DynamoDB();

            try {
                await dynamo.describeTable({ TableName: TABLA_NOMBRE }).promise();
                console.log(`Tabla ${TABLA_NOMBRE} ya existe en DynamoDB`);
            } catch (tableError) {
                // Si la tabla no existe, la creamos
                const params = {
                    TableName: TABLA_NOMBRE,
                    KeySchema: [
                        { AttributeName: 'id', KeyType: 'HASH' }
                    ],
                    AttributeDefinitions: [
                        { AttributeName: 'id', AttributeType: 'S' }
                    ],
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                };

                await dynamo.createTable(params).promise();
                console.log(`Tabla ${TABLA_NOMBRE} creada en DynamoDB`);
            }
        } catch (error) {
            console.error('Error al inicializar tabla en DynamoDB:', error);
        }
    }
};

// Guardar relación en la base de datos
export const guardarRelacion = async (relacion: PlanetaRelacion) => {
    if (dbType === DatabaseType.MYSQL) {
        try {
            const [result] = await pool.query(
                'INSERT INTO planeta_relaciones (starwars_planet, exoplanet, description, image_url) VALUES (?, ?, ?, ?)',
                [relacion.starwars_planet, relacion.exoplanet, relacion.description, relacion.image_url || null]
            );
            return result;
        } catch (error) {
            console.error('Error al guardar relación en MySQL:', error);
            throw new Error('Error al guardar relación en la base de datos MySQL');
        }
    } else {
        try {
            // Generamos un ID único para DynamoDB
            const id = Date.now().toString();

            const params = {
                TableName: TABLA_NOMBRE,
                Item: {
                    id,
                    starwars_planet: relacion.starwars_planet,
                    exoplanet: relacion.exoplanet,
                    description: relacion.description,
                    image_url: relacion.image_url || null,
                    created_at: new Date().toISOString()
                }
            };

            await dynamoClient.put(params).promise();
            return { id };
        } catch (error) {
            console.error('Error al guardar relación en DynamoDB:', error);
            throw new Error('Error al guardar relación en la base de datos DynamoDB');
        }
    }
};

// Obtener historial de relaciones
export const obtenerHistorial = async (pagina: number = 1, limite: number = 10, orderBy: string = 'created_at', orden: 'ASC' | 'DESC' = 'DESC') => {
    if (dbType === DatabaseType.MYSQL) {
        try {
            const offset = (pagina - 1) * limite;

            // Validar orderBy para evitar inyección SQL
            const columnasValidas = ['starwars_planet', 'exoplanet', 'created_at'];
            if (!columnasValidas.includes(orderBy)) {
                orderBy = 'created_at';
            }

            const [rows] = await pool.query(
                `SELECT * FROM planeta_relaciones ORDER BY ${orderBy} ${orden} LIMIT ? OFFSET ?`,
                [limite, offset]
            );

            const [countResult] = await pool.query('SELECT COUNT(*) as total FROM planeta_relaciones');
            const totalResults = (countResult as any)[0].total;

            return {
                page: pagina,
                total_results: totalResults,
                data: rows
            };
        } catch (error) {
            console.error('Error al obtener historial en MySQL:', error);
            throw new Error('Error al obtener historial de relaciones en MySQL');
        }
    } else {
        try {
            const params = {
                TableName: TABLA_NOMBRE,
                Limit: limite
            };

            const result = await dynamoClient.scan(params).promise();

            // Ordenamos los resultados manualmente
            let items = result.Items || [];
            items = items.sort((a, b) => {
                if (orderBy === 'created_at') {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return orden === 'ASC' ? dateA - dateB : dateB - dateA;
                }
                return orden === 'ASC'
                    ? a[orderBy].localeCompare(b[orderBy])
                    : b[orderBy].localeCompare(a[orderBy]);
            });

            // Aplicamos paginación manual
            const startIndex = (pagina - 1) * limite;
            const paginatedItems = items.slice(startIndex, startIndex + limite);

            return {
                page: pagina,
                total_results: items.length,
                data: paginatedItems
            };
        } catch (error) {
            console.error('Error al obtener historial en DynamoDB:', error);
            throw new Error('Error al obtener historial de relaciones en DynamoDB');
        }
    }
};

// Limpiar todos los registros de la tabla
export const limpiarTabla = async (): Promise<boolean> => {
    if (dbType === DatabaseType.MYSQL) {
        try {
            await pool.query('TRUNCATE TABLE planeta_relaciones');
            console.log('Tabla planeta_relaciones limpiada correctamente en MySQL');
            return true;
        } catch (error) {
            console.error('Error al limpiar tabla en MySQL:', error);
            throw new Error('Error al limpiar tabla de relaciones en MySQL');
        }
    } else {
        try {
            // En DynamoDB, necesitamos escanear todos los items y eliminarlos uno por uno
            const dynamo = new AWS.DynamoDB();

            // Primero, obtenemos todos los items
            const scanParams = {
                TableName: TABLA_NOMBRE
            };

            const result = await dynamoClient.scan(scanParams).promise();

            // Si hay items, los eliminamos
            if (result.Items && result.Items.length > 0) {
                const promises = result.Items.map(item => {
                    const deleteParams = {
                        TableName: TABLA_NOMBRE,
                        Key: {
                            id: item.id
                        }
                    };

                    return dynamoClient.delete(deleteParams).promise();
                });

                await Promise.all(promises);
            }

            console.log('Tabla planeta_relaciones limpiada correctamente en DynamoDB');
            return true;
        } catch (error) {
            console.error('Error al limpiar tabla en DynamoDB:', error);
            throw new Error('Error al limpiar tabla de relaciones en DynamoDB');
        }
    }
}; 