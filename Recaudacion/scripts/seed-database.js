/**
 * SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS (SEED)
 * 
 * Este script asegura que los datos esenciales para el funcionamiento
 * del sistema existan en la base de datos antes de iniciar la aplicación.
 * Se enfoca en crear o activar la máquina de prueba 'MAQ001'.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Maquina = require('../models/Maquina');
const Pulso = require('../models/Pulso');

const MONGODB_URI = process.env.MONGODB_URI;

const seedDatabase = async () => {
    if (!MONGODB_URI) {
        console.error('❌ Error: La variable de entorno MONGODB_URI no está definida.');
        return;
    }

    try {
        console.log('🌱 Conectando a la base de datos para inicialización...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Conexión exitosa a MongoDB.');

        const codigoMaquinaPrueba = 'MAQ001';

        console.log(`🔍 Buscando máquina de prueba: ${codigoMaquinaPrueba}...`);

        let maquina = await Maquina.findOne({ codigoMaquina: codigoMaquinaPrueba });

        if (maquina) {
            console.log('✔️ Máquina encontrada. Verificando estado...');
            maquina.activa = true;
            maquina.estado.operativo = 'Activa';
            await maquina.save();
            console.log(`✅ Máquina ${codigoMaquinaPrueba} activada y actualizada.`);
        } else {
            console.log('⚠️ Máquina no encontrada. Creando nueva máquina de prueba...');
            maquina = new Maquina({
                codigoMaquina: codigoMaquinaPrueba,
                nombre: 'Máquina de Simulación Principal',
                modelo: 'VEND-SIM-01',
                activa: true,
                ubicacion: {
                    region: 'Norte',
                    ciudad: 'Ciudad Demo',
                    direccion: 'Calle Falsa 123',
                    coordenadas: [-34.6037, -58.3816]
                },
                configuracion: {
                    valorPorPulso: 0.50,
                    moneda: 'EUR'
                },
                estado: {
                    operativo: 'Activa',
                    ultimoMantenimiento: new Date(),
                    proximoMantenimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
            });
            await maquina.save();
            console.log(`✅ Nueva máquina de prueba ${codigoMaquinaPrueba} creada y activada.`);
        }

        console.log('🌱 Verificando y creando pulsos de prueba...');
        const pulsosExistentes = await Pulso.countDocuments({ codigoMaquina: codigoMaquinaPrueba });

        if (pulsosExistentes === 0) {
            console.log('⚠️ No se encontraron pulsos. Creando datos de ejemplo...');
            const pulsos = [];
            const hoy = new Date();
            for (let i = 0; i < 100; i++) {
                const fechaAleatoria = new Date(hoy.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
                const horaAleatoria = Math.floor(Math.random() * 24);
                fechaAleatoria.setHours(horaAleatoria);

                pulsos.push({
                    maquina: maquina._id,
                    codigoMaquina: codigoMaquinaPrueba,
                    valorPulso: 0.50,
                    moneda: 'EUR',
                    fechaHora: fechaAleatoria,
                    ubicacion: maquina.ubicacion
                });
            }
            await Pulso.insertMany(pulsos);
            console.log(`✅ Creados ${pulsos.length} pulsos de prueba para la máquina ${codigoMaquinaPrueba}.`);
        } else {
            console.log('✔️ Pulsos de prueba ya existen. No se crearán nuevos.');
        }

    } catch (error) {
        console.error('❌ Error durante la inicialización de la base de datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de la base de datos.');
    }
};

seedDatabase();
