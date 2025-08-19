const express = require('express');
const router = express.Router();
const Maquina = require('../models/Maquina');
const Region = require('../models/Region');
const Local = require('../models/Local');
const Pulso = require('../models/Pulso');
const moment = require('moment');

// Middleware para manejo de errores asíncronos
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/analytics/data
// Endpoint principal para obtener datos filtrados para el dashboard de tablas.
router.get('/data', asyncHandler(async (req, res) => {
    // Renombramos para claridad: ahora recibimos IDs
    const { region: regionId, ciudad, maquina: maquinaId, fechaInicio, fechaFin } = req.query;

    // 1. Construir filtro de máquinas
    const maquinaFilter = { activa: true }; // Siempre traer solo máquinas activas

    // Si se proporciona un ID de región, buscamos su nombre para usarlo en el filtro
    if (regionId) {
        const region = await Region.findById(regionId).lean();
        if (region) {
            // El modelo Maquina usa el nombre de la región, no el ID
            maquinaFilter['ubicacion.region'] = region.nombre;
        } else {
            // Si el ID de región no es válido, no devolver ninguna máquina
            return res.json({ dataTable: [] });
        }
    }

    if (ciudad) maquinaFilter['ubicacion.ciudad'] = ciudad;
    
    // El filtro de máquina ahora usa el _id
    if (maquinaId) maquinaFilter['_id'] = maquinaId;

    // 2. Obtener máquinas que coinciden con el filtro
    const maquinas = await Maquina.find(maquinaFilter).lean();
    const maquinaIds = maquinas.map(m => m._id);

    // 3. Construir filtro de pulsos
    const pulsoFilter = { maquina: { $in: maquinaIds } };
    if (fechaInicio && fechaFin) {
        pulsoFilter.fechaHora = {
            $gte: moment(fechaInicio).startOf('day').toDate(),
            $lte: moment(fechaFin).endOf('day').toDate(),
        };
    }

    // 4. Agregar datos de pulsos
    const pulsosData = await Pulso.aggregate([
        { $match: pulsoFilter },
        {
            $group: {
                _id: '$maquina',
                ingresos: { $sum: '$valorPulso' },
                pulsos: { $sum: 1 },
            },
        },
    ]);

    // 5. Combinar datos de máquinas y pulsos
    const dataTable = maquinas.map(maquina => {
        const pulsoInfo = pulsosData.find(p => p._id.equals(maquina._id));
        return {
            ...maquina,
            ingresos: pulsoInfo?.ingresos || 0,
            pulsos: pulsoInfo?.pulsos || 0,
        };
    });

    res.json({ dataTable });
}));

// GET /api/analytics/filters
// Proporciona los valores para los filtros del dashboard desde las colecciones principales
router.get('/filters', asyncHandler(async (req, res) => {
    const [regiones, locales, maquinas] = await Promise.all([
        Region.find({ activa: true }).select('nombre').sort({ nombre: 1 }).lean(),
        Local.find({ activo: true }).select('ubicacion.ciudad').lean(),
        Maquina.find({ activa: true }).select('codigoMaquina nombre').sort({ codigoMaquina: 1 }).lean(),
    ]);

    // Extraer ciudades únicas, no nulas y ordenarlas
    const ciudades = [...new Set(locales.map(l => l.ubicacion.ciudad).filter(Boolean))].sort();

    res.json({
        regiones, // Devuelve [{_id, nombre}]
        ciudades, // Devuelve ["Ciudad1", "Ciudad2"]
        maquinas  // Devuelve [{_id, codigoMaquina, nombre}]
    });
}));

module.exports = router;
