const mongoose = require('mongoose');

/**
 * MODELO DE REGIÓN
 * 
 * Este modelo permite gestionar regiones personalizadas para organizar
 * geográficamente las máquinas expendedoras y locales del sistema.
 * 
 * Características:
 * - Código único para cada región
 * - Nombre descriptivo
 * - Descripción opcional
 * - Color para identificación visual
 * - Estado activo/inactivo
 * - Estadísticas automáticas
 * - Timestamps de creación y actualización
 */

const regionSchema = new mongoose.Schema({
    // === IDENTIFICACIÓN ===
    codigoRegion: {
        type: String,
        required: [true, 'El código de región es obligatorio'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [10, 'El código no puede exceder 10 caracteres'],
        match: [/^[A-Z0-9_-]+$/, 'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos']
    },

    nombre: {
        type: String,
        required: [true, 'El nombre de la región es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },

    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },

    // === CONFIGURACIÓN VISUAL ===
    color: {
        type: String,
        default: '#2563eb',
        match: [/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (#RRGGBB)']
    },

    icono: {
        type: String,
        default: 'fas fa-map-marker-alt',
        maxlength: [50, 'El icono no puede exceder 50 caracteres']
    },

    // === CONFIGURACIÓN ===
    activa: {
        type: Boolean,
        default: true
    },

    orden: {
        type: Number,
        default: 0,
        min: [0, 'El orden no puede ser negativo']
    },

    // === ESTADÍSTICAS AUTOMÁTICAS ===
    estadisticas: {
        totalLocales: {
            type: Number,
            default: 0,
            min: 0
        },
        
        totalMaquinas: {
            type: Number,
            default: 0,
            min: 0
        },
        
        maquinasActivas: {
            type: Number,
            default: 0,
            min: 0
        },
        
        totalPulsos: {
            type: Number,
            default: 0,
            min: 0
        },
        
        totalIngresos: {
            type: Number,
            default: 0,
            min: 0
        },
        
        ultimaActividad: {
            type: Date,
            default: null
        }
    },

    // === METADATOS ===
    creadoPor: {
        type: String,
        default: 'Sistema',
        maxlength: [100, 'El campo creadoPor no puede exceder 100 caracteres']
    },

    notas: {
        type: String,
        maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
    }

}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'regiones'
});

// === ÍNDICES PARA OPTIMIZACIÓN ===
regionSchema.index({ codigoRegion: 1 }, { unique: true });
regionSchema.index({ nombre: 1 });
regionSchema.index({ activa: 1 });
regionSchema.index({ orden: 1 });
regionSchema.index({ 'estadisticas.totalMaquinas': -1 });
regionSchema.index({ 'estadisticas.totalIngresos': -1 });

// === MÉTODOS VIRTUALES ===

// Obtener el porcentaje de máquinas activas
regionSchema.virtual('porcentajeMaquinasActivas').get(function() {
    if (this.estadisticas.totalMaquinas === 0) return 0;
    return Math.round((this.estadisticas.maquinasActivas / this.estadisticas.totalMaquinas) * 100);
});

// Obtener ingresos promedio por máquina
regionSchema.virtual('ingresoPromedioPorMaquina').get(function() {
    if (this.estadisticas.totalMaquinas === 0) return 0;
    return this.estadisticas.totalIngresos / this.estadisticas.totalMaquinas;
});

// === MIDDLEWARE PRE-SAVE ===
regionSchema.pre('save', function(next) {
    // Convertir código a mayúsculas
    if (this.codigoRegion) {
        this.codigoRegion = this.codigoRegion.toUpperCase();
    }
    
    // Capitalizar nombre
    if (this.nombre) {
        this.nombre = this.nombre.charAt(0).toUpperCase() + this.nombre.slice(1);
    }
    
    next();
});

// === MÉTODOS ESTÁTICOS ===

// Obtener todas las regiones activas ordenadas
regionSchema.statics.obtenerRegionesActivas = function() {
    return this.find({ activa: true })
               .sort({ orden: 1, nombre: 1 })
               .select('codigoRegion nombre descripcion color icono estadisticas');
};

// Buscar región por código
regionSchema.statics.buscarPorCodigo = function(codigo) {
    return this.findOne({ codigoRegion: codigo.toUpperCase() });
};

// Obtener estadísticas generales de regiones
regionSchema.statics.obtenerEstadisticasGenerales = function() {
    return this.aggregate([
        {
            $match: { activa: true }
        },
        {
            $group: {
                _id: null,
                totalRegiones: { $sum: 1 },
                totalLocales: { $sum: '$estadisticas.totalLocales' },
                totalMaquinas: { $sum: '$estadisticas.totalMaquinas' },
                maquinasActivas: { $sum: '$estadisticas.maquinasActivas' },
                totalIngresos: { $sum: '$estadisticas.totalIngresos' },
                regionMasProductiva: {
                    $max: {
                        region: '$nombre',
                        ingresos: '$estadisticas.totalIngresos'
                    }
                }
            }
        }
    ]);
};

// === MÉTODOS DE INSTANCIA ===

// Actualizar estadísticas de la región
regionSchema.methods.actualizarEstadisticas = async function() {
    try {
        const Local = mongoose.model('Local');
        const Maquina = mongoose.model('Maquina');
        const Pulso = mongoose.model('Pulso');

        // Contar locales en esta región
        const totalLocales = await Local.countDocuments({ 
            'ubicacion.region': this.codigoRegion,
            eliminado: { $ne: true }
        });

        // Contar máquinas en esta región
        const totalMaquinas = await Maquina.countDocuments({ 
            'ubicacion.region': this.codigoRegion,
            eliminado: { $ne: true }
        });

        // Contar máquinas activas
        const maquinasActivas = await Maquina.countDocuments({ 
            'ubicacion.region': this.codigoRegion,
            estado: 'Activa',
            eliminado: { $ne: true }
        });

        // Obtener estadísticas de pulsos
        const estadisticasPulsos = await Pulso.aggregate([
            {
                $match: {
                    'ubicacion.region': this.codigoRegion
                }
            },
            {
                $group: {
                    _id: null,
                    totalPulsos: { $sum: 1 },
                    totalIngresos: { $sum: '$valor' },
                    ultimaActividad: { $max: '$timestamp' }
                }
            }
        ]);

        const stats = estadisticasPulsos[0] || {};

        // Actualizar estadísticas
        this.estadisticas = {
            totalLocales,
            totalMaquinas,
            maquinasActivas,
            totalPulsos: stats.totalPulsos || 0,
            totalIngresos: stats.totalIngresos || 0,
            ultimaActividad: stats.ultimaActividad || null
        };

        await this.save();
        return this.estadisticas;

    } catch (error) {
        console.error('Error actualizando estadísticas de región:', error);
        throw error;
    }
};

// Validar si se puede eliminar la región
regionSchema.methods.puedeEliminar = async function() {
    try {
        const Local = mongoose.model('Local');
        const Maquina = mongoose.model('Maquina');

        const localesEnRegion = await Local.countDocuments({ 
            'ubicacion.region': this.codigoRegion,
            eliminado: { $ne: true }
        });

        const maquinasEnRegion = await Maquina.countDocuments({ 
            'ubicacion.region': this.codigoRegion,
            eliminado: { $ne: true }
        });

        return {
            puedeEliminar: localesEnRegion === 0 && maquinasEnRegion === 0,
            razon: localesEnRegion > 0 ? 
                `Hay ${localesEnRegion} locales en esta región` :
                maquinasEnRegion > 0 ? 
                `Hay ${maquinasEnRegion} máquinas en esta región` :
                'Se puede eliminar'
        };

    } catch (error) {
        console.error('Error validando eliminación de región:', error);
        return { puedeEliminar: false, razon: 'Error interno' };
    }
};

// === CONFIGURACIÓN DE SALIDA JSON ===
regionSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Region', regionSchema);
