import { Request, Response } from 'express';
import { limpiarTabla } from '../models/PlanetaModel';
import { clearCache } from '../config/redis';

/**
 * Controlador para limpiar todos los datos (MySQL y caché)
 */
export const limpiarDatos = async (req: Request, res: Response): Promise<void> => {
    try {
        // Limpiar caché primero
        const cacheLimpia = await clearCache();

        // Limpiar tabla de MySQL
        const tablaLimpia = await limpiarTabla();

        if (cacheLimpia && tablaLimpia) {
            res.status(200).json({
                status: 'success',
                message: 'Datos limpiados correctamente',
                details: {
                    cache: 'Redis y caché local limpiados',
                    database: 'Tabla planeta_relaciones limpiada'
                }
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error al limpiar algunos datos',
                details: {
                    cache: cacheLimpia ? 'Limpiada correctamente' : 'Error al limpiar',
                    database: tablaLimpia ? 'Limpiada correctamente' : 'Error al limpiar'
                }
            });
        }
    } catch (error) {
        console.error('Error en controlador de limpieza:', error);

        res.status(500).json({
            status: 'error',
            message: 'Error al limpiar datos',
            error: (error as Error).message
        });
    }
}; 