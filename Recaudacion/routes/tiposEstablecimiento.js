const express = require('express');
const router = express.Router();
const TipoEstablecimiento = require('../models/TipoEstablecimiento');

// GET todos los tipos de establecimiento
router.get('/', async (req, res) => {
    try {
        const tipos = await TipoEstablecimiento.find().sort({ nombre: 1 });
        res.json(tipos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST crear un tipo de establecimiento
router.post('/', async (req, res) => {
    const tipo = new TipoEstablecimiento({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        icono: req.body.icono
    });

    try {
        const nuevoTipo = await tipo.save();
        res.status(201).json(nuevoTipo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT actualizar un tipo de establecimiento
router.put('/:id', getTipoEstablecimiento, async (req, res) => {
    if (req.body.nombre != null) res.tipoEstablecimiento.nombre = req.body.nombre;
    if (req.body.descripcion != null) res.tipoEstablecimiento.descripcion = req.body.descripcion;
    if (req.body.icono != null) res.tipoEstablecimiento.icono = req.body.icono;
    if (req.body.activo != null) res.tipoEstablecimiento.activo = req.body.activo;
    
    try {
        const actualizado = await res.tipoEstablecimiento.save();
        res.json(actualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE un tipo de establecimiento
router.delete('/:id', getTipoEstablecimiento, async (req, res) => {
    try {
        await res.tipoEstablecimiento.remove();
        res.json({ message: 'Tipo de establecimiento eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware para obtener tipo por ID
async function getTipoEstablecimiento(req, res, next) {
    let tipo;
    try {
        tipo = await TipoEstablecimiento.findById(req.params.id);
        if (tipo == null) {
            return res.status(404).json({ message: 'No se puede encontrar el tipo de establecimiento' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.tipoEstablecimiento = tipo;
    next();
}

module.exports = router;
