import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'exowars_secret_key';

// Interfaz para solicitud con usuario
export interface AuthRequest extends Request {
    user?: any;
}

// Middleware de autenticación
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                error: 'No autorizado',
                message: 'Token de autenticación no proporcionado'
            });
            return;
        }

        // Verificar formato del token
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            res.status(401).json({
                error: 'No autorizado',
                message: 'Formato de token inválido'
            });
            return;
        }

        const token = tokenParts[1];

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        console.error('Error de autenticación:', error);

        res.status(401).json({
            error: 'No autorizado',
            message: 'Token inválido o expirado'
        });
    }
};

// Función para generar token (para pruebas)
export const generateToken = (userId: string, username: string) => {
    return jwt.sign(
        { id: userId, username },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
}; 