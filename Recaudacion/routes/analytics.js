const express = require('express');
const router = express.Router();
const Maquina = require('../models/Maquina');
const Pulso = require('../models/Pulso');
const moment = require('moment');

// Middleware para manejo de errores asíncronos
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/analytics/data
// Endpoint principal para obtener datos filtrados para el dashboard de tablas.
router.get('/data', asyncHandler(async (req, res) => {
    const { region, ciudad, codigoMaquina, fechaInicio, fechaFin } = req.query;

    // 1. Construir filtro de máquinas
    const maquinaFilter = {};
    if (region) maquinaFilter['ubicacion.region'] = region;
    if (ciudad) maquinaFilter['ubicacion.ciudad'] = ciudad;
    if (codigoMaquina) maquinaFilter['codigoMaquina'] = codigoMaquina;

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
// Proporciona los valores únicos para los filtros del dashboard
router.get('/filters', asyncHandler(async (req, res) => {
    const [regiones, ciudades, codigosMaquina] = await Promise.all([
        Maquina.distinct('ubicacion.region'),
        Maquina.distinct('ubicacion.ciudad'),
        Maquina.distinct('codigoMaquina'),
    ]);

    res.json({ regiones, ciudades, codigosMaquina });
}));

module.exports = router;
