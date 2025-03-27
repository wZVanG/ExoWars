import axios from 'axios';
import { StarWarsPlaneta } from '../models/PlanetaModel';
import { getCacheValue, setCacheValue } from '../config/redis';

const SWAPI_BASE_URL = 'https://swapi.dev/api';

// Obtener todos los planetas de Star Wars
export const obtenerPlanetasStarWars = async (): Promise<StarWarsPlaneta[]> => {
    try {
        // Intentar obtener desde caché
        const cacheKey = 'swapi_planetas';
        const cachedData = await getCacheValue(cacheKey);

        if (cachedData) {
            console.log('Datos de planetas Star Wars obtenidos de caché');
            return cachedData;
        }

        // Si no está en caché, obtener de la API
        let planetas: StarWarsPlaneta[] = [];
        let nextUrl = `${SWAPI_BASE_URL}/planets/`;

        const max_page = 10;
        let page = 1;

        while (nextUrl && page <= max_page) {
            const response = await axios.get(nextUrl);
            const { results, next } = response.data;

            // Mapear respuesta a nuestro modelo
            const planetasMapeados = results.map((planeta: any) => ({
                nombre: planeta.name,
                clima: planeta.climate,
                terreno: planeta.terrain,
                poblacion: planeta.population,
                diametro: planeta.diameter
            }));

            planetas = [...planetas, ...planetasMapeados];
            nextUrl = next;
            page++;
        }

        // Guardar en caché por 30 minutos
        await setCacheValue(cacheKey, planetas, 1800);

        return planetas;
    } catch (error) {
        console.error('Error al obtener planetas de Star Wars:', error);
        throw new Error('Error al obtener datos de SWAPI');
    }
};

// Obtener un planeta específico de Star Wars por nombre
export const obtenerPlanetaStarWarsPorNombre = async (nombre: string): Promise<StarWarsPlaneta | null> => {
    try {
        // Intentar obtener desde caché
        const cacheKey = `swapi_planeta_${nombre.toLowerCase()}`;
        const cachedData = await getCacheValue(cacheKey);

        if (cachedData) {
            console.log(`Datos del planeta ${nombre} obtenidos de caché`);
            return cachedData;
        }

        // Si no está en caché, obtener de la API
        const response = await axios.get(`${SWAPI_BASE_URL}/planets/?search=${nombre}`);
        const { results } = response.data;

        if (results.length === 0) {
            return null;
        }

        // Mapear respuesta a nuestro modelo
        const planeta: StarWarsPlaneta = {
            nombre: results[0].name,
            clima: results[0].climate,
            terreno: results[0].terrain,
            poblacion: results[0].population,
            diametro: results[0].diameter
        };

        // Guardar en caché por 30 minutos
        await setCacheValue(cacheKey, planeta, 1800);

        return planeta;
    } catch (error) {
        console.error(`Error al obtener planeta ${nombre} de Star Wars:`, error);
        throw new Error('Error al obtener datos de SWAPI');
    }
}; 