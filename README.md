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
- Soporte para múltiples bases de datos:
  - MySQL para almacenamiento relacional
  - DynamoDB para almacenamiento NoSQL
- Dockerizada para desarrollo local
- Implementable en AWS Lambda con Serverless Framework

## Requisitos

- Node.js v16+
- Docker y Docker Compose
- AWS CLI (opcional, solo para DynamoDB local)

## Configuración

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/exowars.git
cd exowars
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.back .env
# Edita .env con tus propias configuraciones
```

## Ejecución en desarrollo

1. Inicia los servicios necesarios con Docker:
```bash
./dev.sh
```

Este script iniciará:
- Un contenedor MySQL
- Un contenedor Redis
- Un contenedor DynamoDB local

2. Inicia la aplicación:
```bash
npm run dev
```

## Configuración de base de datos

El proyecto soporta dos tipos de bases de datos:

### MySQL (predeterminado)
MySQL viene configurado por defecto. Verifica que estas variables estén configuradas en tu .env:
```
DATABASE_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=exowars
```

### DynamoDB
Para usar DynamoDB, configura estas variables en tu .env:
```
DATABASE_TYPE=dynamodb
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000
```

Puedes cambiar entre bases de datos sin cambiar tu código, solo actualizando la variable DATABASE_TYPE.

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
Muestra el historial de relaciones almacenadas.

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

## API desplegada en AWS Lambda

Despliegue temporal para pruebas en AWS Lambda. A continuación se detallan los endpoints y su uso:

### URL Base
```
https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev
```

### Endpoints disponibles

1. **Generar token** - Genera un token JWT para autenticación
   ```
   GET /generate-token
   ```
   Ejemplo:
   ```bash
   curl https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/generate-token
   ```

2. **Obtener datos fusionados** - Obtiene una relación entre planetas de Star Wars y exoplanetas
   ```
   GET /fusionados
   ```
   Ejemplo: 
   ```bash
   curl https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/fusionados
   ```

3. **Almacenar relación** - Guarda una relación personalizada entre planetas
   ```
   POST /almacenar
   ```
   Cuerpo de la solicitud:
   ```json
   {
     "starwars_planet": "tatooine",
     "exoplanet": "Barnard b",
     "description": "Ambos planetas tienen potencial para sustentar vida",
     "image_url": "https://ejemplo.com/imagen.jpg"
   }
   ```
   Ejemplo:
   ```bash
   curl -X POST https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/almacenar \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TU_TOKEN" \
     -d '{"starwars_planet":"endor","exoplanet":"GJ 9827 d","description":"Planetas con abundante vegetación"}'
   ```

4. **Consultar historial** - Obtiene el historial de relaciones guardadas
   ```
   GET /historial
   ```
   Ejemplo:
   ```bash
   curl https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/historial
   ```

5. **Buscar imágenes** - Obtiene imágenes relacionadas con un exoplaneta
   ```
   GET /imagenes/{exoplaneta}
   ```
   Ejemplo:
   ```bash
   curl https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/imagenes/TRAPPIST
   ```

6. **Estado del servicio** - Verifica el estado de la API
   ```
   GET /health
   ```
   Ejemplo:
   ```bash
   curl https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/health
   ```

7. **Limpiar datos** - Limpia datos de caché y base de datos (requiere autenticación)
   ```
   GET /limpiar
   ```
   Ejemplo:
   ```bash
   curl -H "Authorization: Bearer TU_TOKEN" \
     https://0d65mikul3.execute-api.us-east-1.amazonaws.com/dev/limpiar
   ```

### Notas importantes
- La API utiliza autenticación JWT para endpoints protegidos
- Los tokens expiran después de 24 horas
- Hay límites de rate limiting implementados para proteger el servicio
- La respuesta de todos los endpoints está en formato JSON
- Todos los endpoints soportan CORS

## Próximas modificaciones

- Integrar UI (React) para interactuar con API. Aquí mostramos un efecto parallax del parecido de ambos planetas.
- Verificar con más precisión planetas que no tienen imagen en la API de Nasa
- Quitar dependencia dotenv

## Licencia

MIT