import express, { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'express';
import routes from './routes';
import { testConnection } from './config/database';
import { initPlanetaTabla } from './models/PlanetaModel';

// Crear aplicación Express
const app = express();

// Middleware para parseo de JSON y URL encoded
app.use(json());
app.use(urlencoded({ extended: true }));

// Middleware para CORS
app.use((req: Request, res: Response, next: NextFunction): void => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
});

// Registrar rutas
app.use('/', routes);

// Middleware para manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error no controlado:', err);

    const statusCode = (err as any).statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(statusCode).json({
        error: 'Error interno',
        message
    });
});

// Middleware para rutas no encontradas
app.use((req: Request, res: Response): void => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.path} no existe en esta API`
    });
});

// Inicializar base de datos
const initDatabase = async () => {
    try {
        await testConnection();
        await initPlanetaTabla();
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    }
};

// Iniciar aplicación
const startApp = async () => {
    await initDatabase();
    console.log('ExoWars API inicializada correctamente');
};

// Ejecutar inicialización
startApp();

// Solo si no estamos en entorno serverless
if (process.env.NODE_ENV !== 'serverless') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}

export default app; 