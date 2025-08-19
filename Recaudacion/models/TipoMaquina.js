const mongoose = require('mongoose');

/**
 * Esquema para los Tipos de Máquina
 * Define las categorías o modelos de las máquinas expendedoras.
 */
const tipoMaquinaSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'El código del tipo de máquina es obligatorio.'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'El código no puede tener más de 20 caracteres.']
    },
    nombre: {
        type: String,
        required: [true, 'El nombre del tipo de máquina es obligatorio.'],
        trim: true,
        maxlength: [100, 'El nombre no puede tener más de 100 caracteres.']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede tener más de 500 caracteres.']
    },
    caracteristicas: [{
        nombre: String,
        valor: String
    }],
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'tipos_maquina'
});

const TipoMaquina = mongoose.model('TipoMaquina', tipoMaquinaSchema);

module.exports = TipoMaquina;
