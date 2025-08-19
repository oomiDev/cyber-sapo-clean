const mongoose = require('mongoose');

/**
 * Esquema para los Tipos de Establecimiento
 * Define las categorías de los locales donde se instalan las máquinas (ej. Hospital, Escuela).
 */
const tipoEstablecimientoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del tipo de establecimiento es obligatorio.'],
        unique: true,
        trim: true,
        maxlength: [100, 'El nombre no puede tener más de 100 caracteres.']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede tener más de 500 caracteres.']
    },
    icono: {
        type: String,
        trim: true,
        default: 'fas fa-store'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'tipos_establecimiento'
});

const TipoEstablecimiento = mongoose.model('TipoEstablecimiento', tipoEstablecimientoSchema);

module.exports = TipoEstablecimiento;
