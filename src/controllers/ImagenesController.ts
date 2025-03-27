import { Request, Response } from 'express';
import { obtenerImagenesExoplaneta } from '../services/NasaService';

// Obtener imágenes de un exoplaneta
export const getImagenesExoplaneta = async (req: Request, res: Response): Promise<void> => {
    try {
        const exoplaneta = req.params.exoplaneta;

        if (!exoplaneta) {
            res.status(400).json({
                error: 'Parámetro requerido',
                message: 'Se requiere especificar el nombre del exoplaneta'
            });
            return;
        }

        // Obtener imágenes
        const imagenes = await obtenerImagenesExoplaneta(exoplaneta);

        if (!imagenes || imagenes.length === 0) {
            res.status(404).json({
                message: 'No se encontraron imágenes para este exoplaneta',
                exoplanet: exoplaneta,
                image_urls: []
            });
            return;
        }

        res.status(200).json({
            exoplanet: exoplaneta,
            image_urls: imagenes
        });
    } catch (error) {
        console.error('Error en controlador de imágenes:', error);

        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Ocurrió un error al obtener las imágenes del exoplaneta'
        });
    }
}; 