const express = require('express');
const router = express.Router();
const TipoMaquina = require('../models/TipoMaquina');

// GET todos los tipos de máquina
router.get('/', async (req, res) => {
    try {
        const tipos = await TipoMaquina.find();
        res.json(tipos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET un tipo de máquina
router.get('/:id', getTipoMaquina, (req, res) => {
    res.json(res.tipoMaquina);
});

// POST crear un tipo de máquina
router.post('/', async (req, res) => {
    const tipoMaquina = new TipoMaquina({
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        caracteristicas: req.body.caracteristicas
    });

    try {
        const nuevoTipoMaquina = await tipoMaquina.save();
        res.status(201).json(nuevoTipoMaquina);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT actualizar un tipo de máquina
router.put('/:id', getTipoMaquina, async (req, res) => {
    if (req.body.nombre != null) {
        res.tipoMaquina.nombre = req.body.nombre;
    }
    if (req.body.descripcion != null) {
        res.tipoMaquina.descripcion = req.body.descripcion;
    }
    if (req.body.caracteristicas != null) {
        res.tipoMaquina.caracteristicas = req.body.caracteristicas;
    }
    if (req.body.activo != null) {
        res.tipoMaquina.activo = req.body.activo;
    }
    try {
        const tipoMaquinaActualizado = await res.tipoMaquina.save();
        res.json(tipoMaquinaActualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE un tipo de máquina
router.delete('/:id', getTipoMaquina, async (req, res) => {
    try {
        await res.tipoMaquina.remove();
        res.json({ message: 'Tipo de máquina eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware para obtener tipo de máquina por ID
async function getTipoMaquina(req, res, next) {
    let tipoMaquina;
    try {
        tipoMaquina = await TipoMaquina.findById(req.params.id);
        if (tipoMaquina == null) {
            return res.status(404).json({ message: 'No se puede encontrar el tipo de máquina' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.tipoMaquina = tipoMaquina;
    next();
}

module.exports = router;
