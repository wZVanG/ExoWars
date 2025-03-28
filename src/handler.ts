import serverless from 'serverless-http';
import app from './app';

// Exportar el handler para Lambda
export const handler = serverless(app, {
    provider: 'aws'
}); 