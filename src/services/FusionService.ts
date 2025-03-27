import { obtenerPlanetasStarWars, obtenerPlanetaStarWarsPorNombre } from './SwapiService';
import { obtenerExoplanetas, obtenerExoplanetaPorNombre, obtenerImagenesExoplaneta } from './NasaService';
import { getCacheValue, setCacheValue } from '../config/redis';
import { PlanetaRelacion, guardarRelacion } from '../models/PlanetaModel';

// Interfaz para datos fusionados
export interface DatoFusionado {
    starwars_planet: string;
    exoplanet: string;
    description: string;
    image_url: string;
    temperature: string;
    distance_from_earth: string;
    stellar_age?: string;
    right_ascension?: string;
    declination?: string;
    distance_light_years?: string;
}

// Reglas para relacionar planetas
const relacionarPorClima = (climaStarWars: string, temperaturaExo: string): boolean => {
    // Si el clima de Star Wars es cálido y el exoplaneta tiene alta temperatura
    if (
        (climaStarWars.includes('hot') || climaStarWars.includes('arid') || climaStarWars.includes('tropical')) &&
        parseInt(temperaturaExo) > 300
    ) {
        return true;
    }

    // Si el clima de Star Wars es frío y el exoplaneta tiene baja temperatura
    if (
        (climaStarWars.includes('frozen') || climaStarWars.includes('cold') || climaStarWars.includes('frigid')) &&
        parseInt(temperaturaExo) < 0
    ) {
        return true;
    }

    // Si el clima de Star Wars es templado
    if (
        (climaStarWars.includes('temperate') || climaStarWars.includes('mild')) &&
        parseInt(temperaturaExo) > 0 && parseInt(temperaturaExo) < 300
    ) {
        return true;
    }

    return false;
};

// Generar descripción automática
const generarDescripcion = (planetaStarWars: string, exoplaneta: string, clima: string, temperatura: string): string => {
    if (parseInt(temperatura) > 300) {
        return `${exoplaneta} es un planeta cálido similar a ${planetaStarWars} en Star Wars. Ambos comparten condiciones desérticas y altas temperaturas.`;
    }

    if (parseInt(temperatura) < 0) {
        return `${exoplaneta} es un planeta helado como ${planetaStarWars} en la saga de Star Wars. Las temperaturas extremadamente frías son comunes en ambos mundos.`;
    }

    if (clima.includes('temperate') || clima.includes('mild')) {
        return `${exoplaneta} tiene condiciones templadas similares a ${planetaStarWars} en el universo de Star Wars. Podría potencialmente albergar vida como lo hace ${planetaStarWars}.`;
    }

    return `${exoplaneta} comparte similitudes con ${planetaStarWars} del universo de Star Wars, aunque en diferentes galaxias.`;
};

// Obtener datos fusionados de todas las fuentes
export const obtenerDatosFusionados = async (): Promise<DatoFusionado[]> => {
    try {
        // Intentar obtener desde caché
        const cacheKey = 'datos_fusionados';
        const cachedData = await getCacheValue(cacheKey);

        if (cachedData) {
            console.log('Datos fusionados obtenidos de caché');
            return cachedData;
        }

        // Obtener datos en paralelo
        const [planetasStarWars, exoplanetas] = await Promise.all([
            obtenerPlanetasStarWars(),
            obtenerExoplanetas()
        ]);

        const datosFusionados: DatoFusionado[] = [];

        // Recorrer planetas de Star Wars y buscar coincidencias
        for (const planetaSW of planetasStarWars) {
            let mejorMatch = null;

            // Buscar mejor coincidencia entre exoplanetas
            for (const exoplaneta of exoplanetas) {
                const temperatura = exoplaneta.temperatura.replace('°C', '');

                if (relacionarPorClima(planetaSW.clima, temperatura)) {
                    mejorMatch = exoplaneta;
                    break;
                }
            }

            // Si encontramos coincidencia, crear dato fusionado
            if (mejorMatch) {
                const descripcion = generarDescripcion(
                    planetaSW.nombre,
                    mejorMatch.nombre,
                    planetaSW.clima,
                    mejorMatch.temperatura.replace('°C', '')
                );

                // Buscar imágenes
                const imagenes = await obtenerImagenesExoplaneta(mejorMatch.nombre);
                const imagen = imagenes.length > 0 ? imagenes[0] : '';

                datosFusionados.push({
                    starwars_planet: planetaSW.nombre,
                    exoplanet: mejorMatch.nombre,
                    description: descripcion,
                    image_url: imagen,
                    temperature: mejorMatch.temperatura,
                    distance_from_earth: mejorMatch.distancia_tierra,
                    stellar_age: mejorMatch.edad_sistema,
                    right_ascension: mejorMatch.ascension_recta,
                    declination: mejorMatch.declinacion,
                    distance_light_years: mejorMatch.distancia_ly
                });

                // Guardar automáticamente en la base de datos
                await guardarRelacion({
                    starwars_planet: planetaSW.nombre,
                    exoplanet: mejorMatch.nombre,
                    description: descripcion,
                    image_url: imagen
                });
            }

            // Limitar a 10 resultados para no sobrecargar
            if (datosFusionados.length >= 10) {
                break;
            }
        }

        // Guardar en caché por 30 minutos
        await setCacheValue(cacheKey, datosFusionados, 1800);

        return datosFusionados;
    } catch (error) {
        console.error('Error al obtener datos fusionados:', error);
        throw new Error('Error al fusionar datos de APIs');
    }
};

// Guardar una relación personalizada
export const guardarRelacionPersonalizada = async (relacion: PlanetaRelacion): Promise<boolean> => {
    try {
        // Verificar que el planeta de Star Wars existe
        const planetaSW = await obtenerPlanetaStarWarsPorNombre(relacion.starwars_planet);
        if (!planetaSW) {
            throw new Error(`El planeta ${relacion.starwars_planet} no existe en Star Wars`);
        }

        // Verificar que el exoplaneta existe
        const exoplaneta = await obtenerExoplanetaPorNombre(relacion.exoplanet);
        if (!exoplaneta) {
            throw new Error(`El exoplaneta ${relacion.exoplanet} no existe en la base de datos de la NASA`);
        }

        // Si no se proporcionó una imagen, intentar buscar una
        if (!relacion.image_url) {
            const imagenes = await obtenerImagenesExoplaneta(relacion.exoplanet);
            if (imagenes && imagenes.length > 0) {
                relacion.image_url = imagenes[0];
            }
        }

        // Guardar la relación
        await guardarRelacion(relacion);

        // Invalidar caché de datos fusionados
        await setCacheValue('datos_fusionados', null, 1);

        return true;
    } catch (error) {
        console.error('Error al guardar relación personalizada:', error);
        throw error;
    }
}; 