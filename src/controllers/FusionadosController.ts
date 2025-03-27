import { Request, Response } from 'express';
import { obtenerDatosFusionados } from '../services/FusionService';

// Obtener datos fusionados
export const getDatosFusionados = async (req: Request, res: Response): Promise<void> => {
    try {
        const datosFusionados = await obtenerDatosFusionados();

        res.status(200).json(datosFusionados);
    } catch (error) {
        console.error('Error en controlador de datos fusionados:', error);

        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Ocurrió un error al obtener los datos fusionados'
        });
    }
}; 