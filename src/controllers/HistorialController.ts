import { Request, Response } from 'express';
import { obtenerHistorial } from '../models/PlanetaModel';

// Obtener historial de relaciones
export const getHistorial = async (req: Request, res: Response): Promise<void> => {
    try {
        // Obtener parámetros de consulta
        const pagina = parseInt(req.query.page as string) || 1;
        const limite = parseInt(req.query.limit as string) || 10;
        const orderBy = (req.query.orderBy as string) || 'created_at';
        const orden = (req.query.order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Validar parámetros
        if (pagina < 1) {
            res.status(400).json({
                error: 'Parámetro inválido',
                message: 'La página debe ser un número positivo'
            });
            return;
        }

        if (limite < 1 || limite > 100) {
            res.status(400).json({
                error: 'Parámetro inválido',
                message: 'El límite debe estar entre 1 y 100'
            });
            return;
        }

        // Obtener historial paginado
        const historial = await obtenerHistorial(pagina, limite, orderBy, orden as 'ASC' | 'DESC');

        res.status(200).json(historial);
    } catch (error) {
        console.error('Error en controlador de historial:', error);

        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Ocurrió un error al obtener el historial de relaciones'
        });
    }
}; 