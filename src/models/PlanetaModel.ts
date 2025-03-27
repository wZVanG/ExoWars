import { pool } from '../config/database';

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

// Inicializar tabla en la base de datos
export const initPlanetaTabla = async () => {
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
        console.log('Tabla planeta_relaciones inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar tabla planeta_relaciones:', error);
    }
};

// Guardar relación en la base de datos
export const guardarRelacion = async (relacion: PlanetaRelacion) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO planeta_relaciones (starwars_planet, exoplanet, description, image_url) VALUES (?, ?, ?, ?)',
            [relacion.starwars_planet, relacion.exoplanet, relacion.description, relacion.image_url || null]
        );
        return result;
    } catch (error) {
        console.error('Error al guardar relación:', error);
        throw new Error('Error al guardar relación en la base de datos');
    }
};

// Obtener historial de relaciones
export const obtenerHistorial = async (pagina: number = 1, limite: number = 10, orderBy: string = 'created_at', orden: 'ASC' | 'DESC' = 'DESC') => {
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
        console.error('Error al obtener historial:', error);
        throw new Error('Error al obtener historial de relaciones');
    }
};

// Limpiar todos los registros de la tabla
export const limpiarTabla = async (): Promise<boolean> => {
    try {
        await pool.query('TRUNCATE TABLE planeta_relaciones');
        console.log('Tabla planeta_relaciones limpiada correctamente');
        return true;
    } catch (error) {
        console.error('Error al limpiar tabla:', error);
        throw new Error('Error al limpiar tabla de relaciones');
    }
}; 