import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { guardarRelacionPersonalizada } from '../services/FusionService';
import { PlanetaRelacion } from '../models/PlanetaModel';

// Almacenar relación personalizada
export const postAlmacenarRelacion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { starwars_planet, exoplanet, description, image_url } = req.body;

        // Validar datos obligatorios
        if (!starwars_planet || !exoplanet || !description) {
            res.status(400).json({
                error: 'Datos incompletos',
                message: 'Se requieren los campos starwars_planet, exoplanet y description'
            });
            return;
        }

        // Validar longitud de descripción
        if (description.length < 10 || description.length > 500) {
            res.status(400).json({
                error: 'Descripción inválida',
                message: 'La descripción debe tener entre 10 y 500 caracteres'
            });
            return;
        }

        // Crear objeto de relación
        const relacion: PlanetaRelacion = {
            starwars_planet,
            exoplanet,
            description,
            image_url // Incluir URL de imagen si está presente
        };

        // Guardar relación
        await guardarRelacionPersonalizada(relacion);

        res.status(201).json({
            message: 'Relación guardada con éxito',
            data: relacion
        });
    } catch (error: any) {
        console.error('Error en controlador de almacenar:', error);

        // Si es un error controlado del servicio, devolver mensaje específico
        if (error.message && (
            error.message.includes('no existe en Star Wars') ||
            error.message.includes('no existe en la base de datos de la NASA')
        )) {
            res.status(404).json({
                error: 'Recurso no encontrado',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Ocurrió un error al guardar la relación'
        });
    }
}; 