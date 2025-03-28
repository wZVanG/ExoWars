import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();

// Enumeración para tipos de base de datos
export enum DatabaseType {
    MYSQL = 'mysql',
    DYNAMODB = 'dynamodb'
}

// Tipo de base de datos a utilizar (configurable por variable de entorno)
export const dbType = (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.MYSQL;

// Configuración para la conexión a MySQL
const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'exowars',
};

// Crear un pool de conexiones para MySQL
const pool = mysql.createPool(mysqlConfig);

// Configuración para DynamoDB
// En Lambda, AWS SDK obtiene automáticamente la región del entorno
const dynamoConfig = process.env.DYNAMODB_ENDPOINT
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT,
        region: process.env.AWS_REGION || 'us-east-1'
    }
    : {}; // Vacío para usar configuración automática de AWS en entorno Lambda

// Cliente de DynamoDB
const dynamoClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

// Verificar conexión
const testConnection = async () => {
    if (dbType === DatabaseType.MYSQL) {
        try {
            const connection = await pool.getConnection();
            console.log('Conexión a MySQL establecida correctamente');
            connection.release();
        } catch (error) {
            console.error('Error al conectar a MySQL:', error);
        }
    } else {
        try {
            // Probamos listar tablas para verificar la conexión
            const dynamo = new AWS.DynamoDB(dynamoConfig);
            await dynamo.listTables().promise();
            console.log('Conexión a DynamoDB establecida correctamente');
        } catch (error) {
            console.error('Error al conectar a DynamoDB:', error);
        }
    }
};

export { pool, dynamoClient, testConnection }; 