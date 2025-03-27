# ExoWars

ExoWars es una API que fusiona datos de planetas de Star Wars con exoplanetas reales descubiertos por la NASA, generando relaciones entre ambos mundos basadas en sus características.

## Tecnologías Utilizadas

- **Backend:** Node.js 20 + TypeScript
- **Framework:** Serverless Framework
- **Base de Datos:** MySQL
- **Cache:** Redis
- **APIs Externas:**
  - SWAPI (Star Wars API)
  - NASA Exoplanet Archive API
  - NASA Image API

## Características

- Fusiona automáticamente planetas de Star Wars con exoplanetas reales
- Almacena relaciones personalizadas entre planetas
- Proporciona imágenes reales de exoplanetas
- Implementa JWT para seguridad
- Utiliza caché con Redis para mejorar rendimiento

## Endpoints

### GET /generate-token
Genera un token JWT para acceder a los endpoints protegidos.

### GET /fusionados
Devuelve datos fusionados de planetas de Star Wars y exoplanetas reales.

### POST /almacenar
Permite guardar relaciones personalizadas entre planetas.

Ejemplo:
```json
{
    "starwars_planet": "Tatooine",
    "exoplanet": "Barnard b",
    "description": "Ambos planetas tienen dos soles, etc...",
    "image_url": "https://google.com/imagen.jpg"
}
```
El campo `image_url` es opcional, si se pasa un valor la aplicación tratará de buscar en la API (Nasa Images) en base a su nombre.

### GET /historial
Muestra el historial de relaciones almacenadas. Requiere autenticación.

### GET /imagenes/{exoplaneta}
Obtiene imágenes reales del exoplaneta especificado.

## Instalación

1. Prerequisitos: Node.js 20+, MySQL 8.0+, Redis (opcional)

2. Clonar e instalar:
```bash
git clone git@github.com:wZVanG/ExoWars.git
cd exowars
npm install
```

3. Configurar `.env` con tus credenciales de MySQL, Redis y una clave JWT

4. Configurar base de datos (Se inserta la única tabla de relaciones al ejecutar por primera vez)

5. Iniciar el servidor:
```bash
npm run build
npm run start:direct
```

## Uso rápido

1. Generar token:
```bash
curl http://localhost:3000/generate-token
```

2. Para endpoints protegidos, usar:
```bash
curl -H "Authorization: Bearer EL_TOKEN_GENERADO" http://localhost:3000/historial
```

## Docker (opcional)

Para desarrollar con Docker:
```bash
docker-compose up -d  # Inicia MySQL y Redis
docker-compose down   # Detiene los servicios
```

## Próximas modificaciones

- Integrar UI (React) para interactuar con API. Aquí mostramos un efecto parallax del parecido de ambos planetas.
- Verificar con más precisión planetas que no tienen imagen en la API de Nasa
- Quitar dependencia dotenv

## Licencia

MIT