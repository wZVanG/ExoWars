#!/bin/bash

# Detener contenedores si existen
echo "Deteniendo contenedores existentes..."
docker-compose down

# Iniciar servicios de MySQL y Redis
echo "Iniciando MySQL y Redis..."
docker-compose up -d

echo "Esperando a que MySQL esté listo..."
sleep 10

echo "Entorno de desarrollo Docker listo."
echo "- MySQL disponible en: localhost:3306"
echo "- Redis disponible en: localhost:6379"
echo ""
echo "Para iniciar la aplicación ejecuta: npm run dev"
echo "Para detener los servicios ejecuta: docker-compose down" 