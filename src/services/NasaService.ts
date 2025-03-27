import axios from 'axios';
import { ExoPlaneta } from '../models/PlanetaModel';
import { getCacheValue, setCacheValue } from '../config/redis';

const NASA_EXOPLANET_API = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const NASA_IMAGE_API = 'https://images-api.nasa.gov';

// Obtener exoplanetas de la NASA
export const obtenerExoplanetas = async (): Promise<ExoPlaneta[]> => {
    try {
        // Intentar obtener desde caché
        const cacheKey = 'nasa_exoplanetas';
        const cachedData = await getCacheValue(cacheKey);

        if (cachedData) {
            console.log('Datos de exoplanetas obtenidos de caché');
            return cachedData;
        }

        // Si no está en caché, obtener de la API con la nueva consulta
        const query = `SELECT pl_name,pl_eqt,pl_orbsmax,disc_year,st_age,ra,dec,sy_dist FROM ps WHERE sy_dist>0 and sy_dist<20 and default_flag=1`;

        // Colocar la key en el header
        const headers = {
            'X-API-Key': process.env.NASA_KEY
        };

        const response = await axios.get(NASA_EXOPLANET_API, {
            params: {
                query: query,
                format: 'json'
            },
            headers: headers
        });

        // Mapear respuesta a nuestro modelo con los nuevos campos
        const exoplanetas: ExoPlaneta[] = response.data.map((exoplaneta: any) => ({
            nombre: exoplaneta.pl_name,
            temperatura: exoplaneta.pl_eqt ? `${Math.round(exoplaneta.pl_eqt)}°C` : 'Desconocida',
            distancia_tierra: exoplaneta.pl_orbsmax ? `${exoplaneta.pl_orbsmax} UA` : 'Desconocida', // Unidades Astronómicas
            descripcion: `Exoplaneta descubierto en ${exoplaneta.disc_year || 'fecha desconocida'}`,
            imagen_url: '', // Se completará con la función de imágenes
            edad_sistema: exoplaneta.st_age ? `${exoplaneta.st_age} billones de años` : 'Desconocida',
            ascension_recta: exoplaneta.ra ? `${exoplaneta.ra}°` : 'Desconocida',
            declinacion: exoplaneta.dec ? `${exoplaneta.dec}°` : 'Desconocida',
            distancia_ly: exoplaneta.sy_dist ? `${exoplaneta.sy_dist} años luz` : 'Desconocida'
        }));

        // Guardar en caché por 30 minutos
        await setCacheValue(cacheKey, exoplanetas, 1800);

        return exoplanetas;
    } catch (error) {
        console.error('Error al obtener exoplanetas de NASA:', error);
        throw new Error('Error al obtener datos de NASA Exoplanet Archive');
    }
};

// Obtener un exoplaneta específico por nombre
export const obtenerExoplanetaPorNombre = async (nombre: string): Promise<ExoPlaneta | null> => {
    try {
        // Intentar obtener desde caché
        const cacheKey = `nasa_exoplaneta_${nombre.toLowerCase()}`;
        const cachedData = await getCacheValue(cacheKey);

        if (cachedData) {
            console.log(`Datos del exoplaneta ${nombre} obtenidos de caché`);
            return cachedData;
        }

        // Si no está en caché, obtener de la API
        const query = `SELECT pl_name,pl_eqt,pl_orbsmax,disc_year,st_age,ra,dec,sy_dist FROM ps WHERE pl_name like '${nombre}' and default_flag=1`;

        const response = await axios.get(NASA_EXOPLANET_API, {
            params: {
                query: query,
                format: 'json'
            },
            headers: {
                'X-API-Key': process.env.NASA_KEY
            }
        });

        if (!response.data || response.data.length === 0) {
            return null;
        }

        const exoData = response.data[0]; // Obtener el primer exoplaneta

        // Mapear respuesta a nuestro modelo
        const exoplaneta: ExoPlaneta = {
            nombre: exoData.pl_name,
            temperatura: exoData.pl_eqt ? `${Math.round(exoData.pl_eqt)}°C` : 'Desconocida',
            distancia_tierra: exoData.pl_orbsmax ? `${exoData.pl_orbsmax} UA` : 'Desconocida',
            descripcion: `Exoplaneta ${exoData.pl_name} descubierto en ${exoData.disc_year || 'fecha desconocida'}`,
            imagen_url: '',
            edad_sistema: exoData.st_age ? `${exoData.st_age} billones de años` : 'Desconocida',
            ascension_recta: exoData.ra ? `${exoData.ra}°` : 'Desconocida',
            declinacion: exoData.dec ? `${exoData.dec}°` : 'Desconocida',
            distancia_ly: exoData.sy_dist ? `${exoData.sy_dist} años luz` : 'Desconocida'
        };

        // Intentar obtener imágenes
        const imagenes = await obtenerImagenesExoplaneta(nombre);
        if (imagenes && imagenes.length > 0) {
            exoplaneta.imagen_url = imagenes[0];
        }

        // Guardar en caché por 30 minutos
        await setCacheValue(cacheKey, exoplaneta, 1800);

        return exoplaneta;
    } catch (error) {
        console.error(`Error al obtener exoplaneta ${nombre}:`, error);
        throw new Error('Error al obtener datos de NASA Exoplanet Archive');
    }
};

// Obtener imágenes de exoplanetas
export const obtenerImagenesExoplaneta = async (nombreExoplaneta: string): Promise<string[]> => {
    try {
        // Intentar obtener desde caché
        const cacheKey = `nasa_imagenes_${nombreExoplaneta.toLowerCase()}`;
        const cachedData = await getCacheValue(cacheKey);

        if (cachedData) {
            console.log(`Imágenes del exoplaneta ${nombreExoplaneta} obtenidas de caché`);
            return cachedData;
        }

        // Buscar términos relacionados para mejorar resultados
        const searchTerm = `${nombreExoplaneta} exoplanet`;

        console.log("searchTerm -->", searchTerm);

        const response = await axios.get(`${NASA_IMAGE_API}/search`, {
            params: {
                q: searchTerm,
                media_type: 'image'
            }
        });

        if (!response.data.collection.items || response.data.collection.items.length === 0) {
            // Si no hay resultados específicos, intentar con búsqueda genérica
            const genericResponse = await axios.get(`${NASA_IMAGE_API}/search`, {
                params: {
                    q: 'exoplanet',
                    media_type: 'image'
                }
            });

            if (!genericResponse.data.collection.items || genericResponse.data.collection.items.length === 0) {
                return [];
            }

            const imagenes = genericResponse.data.collection.items
                .slice(0, 5)
                .map((item: any) => item.links[0].href);

            // Guardar en caché por 1 día (86400 segundos)
            await setCacheValue(cacheKey, imagenes, 86400);

            return imagenes;
        }

        const imagenes = response.data.collection.items
            .slice(0, 5)
            .map((item: any) => item.links[0].href);

        // Guardar en caché por 1 día (86400 segundos)
        await setCacheValue(cacheKey, imagenes, 86400);

        return imagenes;
    } catch (error) {
        console.error(`Error al obtener imágenes para ${nombreExoplaneta}:`, error);
        return [];
    }
}; 