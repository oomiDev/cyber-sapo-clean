// test-conexion.js
// Un script minimalista para probar la conexión a MongoDB Atlas.

require('dotenv').config(); // Cargar variables de entorno desde .env
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: La variable de entorno MONGODB_URI no está definida.');
    console.log('Asegúrate de tener un archivo .env en la raíz del proyecto con la cadena de conexión.');
    process.exit(1);
}

console.log('--- Iniciando prueba de conexión a MongoDB ---');
console.log('URI detectada (se omite la contraseña por seguridad):', MONGODB_URI.replace(/:([^:]+)@/, ':************@'));

const connect = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ ¡ÉXITO! Conexión a MongoDB establecida correctamente.');
    } catch (error) {
        console.error('❌ ¡FALLO! No se pudo conectar a MongoDB.');
        console.error('Error detallado:', error.message);
    } finally {
        // Cerramos la conexión para que el script pueda terminar.
        await mongoose.connection.close();
        console.log('--- Prueba de conexión finalizada ---');
    }
};

connect();
