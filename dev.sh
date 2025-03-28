#!/bin/bash

# Detener contenedores si existen
echo "Deteniendo contenedores existentes..."
docker-compose down

# Iniciar servicios de MySQL, Redis y DynamoDB Local
echo "Iniciando MySQL, Redis y DynamoDB Local..."
docker-compose up -d

echo "Esperando a que los servicios estén listos..."
sleep 10

echo "Entorno de desarrollo Docker listo."
echo "- MySQL disponible en: localhost:3306"
echo "- Redis disponible en: localhost:6379"
echo "- DynamoDB disponible en: localhost:8000"
echo ""
echo "Para cambiar a DynamoDB, actualiza DATABASE_TYPE=dynamodb en .env"
echo "Para iniciar la aplicación ejecuta: npm run dev"
echo "Para detener los servicios ejecuta: docker-compose down" 