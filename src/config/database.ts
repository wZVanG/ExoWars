import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para la conexión a MySQL
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'exowars',
};

// Crear un pool de conexiones
const pool = mysql.createPool(dbConfig);

// Verificar conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a MySQL establecida correctamente');
        connection.release();
    } catch (error) {
        console.error('Error al conectar a MySQL:', error);
    }
};

export { pool, testConnection }; 