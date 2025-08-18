/**
 * MODELO DE LOCAL/ESTABLECIMIENTO
 * 
 * Este modelo define la estructura de datos para los locales donde
 * se ubican las máquinas expendedoras, facilitando la gestión centralizada.
 */

const mongoose = require('mongoose');

// Esquema para definir la estructura de un local/establecimiento
const localSchema = new mongoose.Schema({
    // IDENTIFICACIÓN ÚNICA DEL LOCAL
    codigoLocal: {
        type: String,
        required: [true, 'El código del local es obligatorio'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, 'El código debe tener al menos 3 caracteres'],
        maxlength: [20, 'El código no puede exceder 20 caracteres']
    },

    // INFORMACIÓN BÁSICA DEL LOCAL
    nombre: {
        type: String,
        required: [true, 'El nombre del local es obligatorio'],
        trim: true,
        maxlength: [150, 'El nombre no puede exceder 150 caracteres']
    },

    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },

    // TIPO DE ESTABLECIMIENTO
    tipoEstablecimiento: {
        type: String,
        required: [true, 'El tipo de establecimiento es obligatorio'],
        enum: {
            values: [
                'Oficina', 
                'Escuela', 
                'Universidad',
                'Hospital', 
                'Centro Comercial', 
                'Fábrica', 
                'Restaurante',
                'Hotel',
                'Gimnasio',
                'Estación de Servicio',
                'Aeropuerto',
                'Estación de Tren',
                'Centro Deportivo',
                'Biblioteca',
                'Otro'
            ],
            message: 'Tipo de establecimiento inválido'
        }
    },

    // UBICACIÓN GEOGRÁFICA COMPLETA
    ubicacion: {
        // Región administrativa
        region: {
            type: String,
            required: [true, 'La región es obligatoria'],
            trim: true,
            enum: {
                values: ['Norte', 'Sur', 'Este', 'Oeste', 'Centro', 'Metropolitana'],
                message: 'La región debe ser una de las opciones válidas'
            }
        },

        // Ciudad
        ciudad: {
            type: String,
            required: [true, 'La ciudad es obligatoria'],
            trim: true,
            maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
        },

        // Dirección completa
        direccion: {
            type: String,
            required: [true, 'La dirección es obligatoria'],
            trim: true,
            maxlength: [200, 'La dirección no puede exceder 200 caracteres']
        },

        // Código postal
        codigoPostal: {
            type: String,
            trim: true,
            maxlength: [10, 'El código postal no puede exceder 10 caracteres']
        },

        // Coordenadas GPS para mapas
        coordenadas: {
            latitud: {
                type: Number,
                min: [-90, 'La latitud debe estar entre -90 y 90'],
                max: [90, 'La latitud debe estar entre -90 y 90']
            },
            longitud: {
                type: Number,
                min: [-180, 'La longitud debe estar entre -180 y 180'],
                max: [180, 'La longitud debe estar entre -180 y 180']
            }
        },

        // Información adicional de ubicación
        piso: {
            type: String,
            trim: true,
            maxlength: [20, 'El piso no puede exceder 20 caracteres']
        },

        zona: {
            type: String,
            trim: true,
            maxlength: [50, 'La zona no puede exceder 50 caracteres']
        }
    },

    // INFORMACIÓN DE CONTACTO DEL LOCAL
    contacto: {
        // Persona responsable del local
        nombreResponsable: {
            type: String,
            trim: true,
            maxlength: [100, 'El nombre del responsable no puede exceder 100 caracteres']
        },

        // Teléfono principal
        telefono: {
            type: String,
            trim: true,
            maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
        },

        // Email de contacto
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
        },

        // Horarios de funcionamiento
        horarios: {
            lunes: { apertura: String, cierre: String },
            martes: { apertura: String, cierre: String },
            miercoles: { apertura: String, cierre: String },
            jueves: { apertura: String, cierre: String },
            viernes: { apertura: String, cierre: String },
            sabado: { apertura: String, cierre: String },
            domingo: { apertura: String, cierre: String }
        }
    },

    // CARACTERÍSTICAS DEL LOCAL
    caracteristicas: {
        // Área aproximada en metros cuadrados
        area: {
            type: Number,
            min: [0, 'El área no puede ser negativa']
        },

        // Capacidad aproximada de personas
        capacidadPersonas: {
            type: Number,
            min: [0, 'La capacidad no puede ser negativa']
        },

        // Flujo de personas estimado (bajo, medio, alto)
        flujoPersonas: {
            type: String,
            enum: ['Bajo', 'Medio', 'Alto'],
            default: 'Medio'
        },

        // Accesibilidad
        accesible: {
            type: Boolean,
            default: true
        },

        // Tiene aire acondicionado
        aireAcondicionado: {
            type: Boolean,
            default: false
        },

        // Seguridad (cámaras, vigilancia, etc.)
        nivelSeguridad: {
            type: String,
            enum: ['Básico', 'Medio', 'Alto'],
            default: 'Medio'
        }
    },

    // ESTADÍSTICAS DEL LOCAL
    estadisticas: {
        // Número total de máquinas instaladas
        totalMaquinas: {
            type: Number,
            default: 0,
            min: [0, 'El total de máquinas no puede ser negativo']
        },

        // Máquinas activas actualmente
        maquinasActivas: {
            type: Number,
            default: 0,
            min: [0, 'Las máquinas activas no pueden ser negativas']
        },

        // Ingresos totales del local
        totalIngresos: {
            type: Number,
            default: 0,
            min: [0, 'Los ingresos totales no pueden ser negativos']
        },

        // Promedio de ingresos por máquina
        promedioIngresosPorMaquina: {
            type: Number,
            default: 0,
            min: [0, 'El promedio no puede ser negativo']
        },

        // Fecha de la primera máquina instalada
        primeraInstalacion: {
            type: Date
        },

        // Fecha de la última actividad
        ultimaActividad: {
            type: Date,
            default: Date.now
        }
    },

    // CONFIGURACIÓN ESPECÍFICA DEL LOCAL
    configuracion: {
        // Comisión que cobra el local (porcentaje)
        comisionLocal: {
            type: Number,
            min: [0, 'La comisión no puede ser negativa'],
            max: [100, 'La comisión no puede exceder 100%'],
            default: 0
        },

        // Moneda preferida para este local
        monedaPreferida: {
            type: String,
            enum: ['EUR', 'USD', 'COP', 'MXN', 'ARS'],
            default: 'EUR'
        },

        // Permite instalación de nuevas máquinas
        permiteNuevasMaquinas: {
            type: Boolean,
            default: true
        },

        // Requiere autorización especial para mantenimiento
        requiereAutorizacion: {
            type: Boolean,
            default: false
        }
    },

    // METADATOS DEL REGISTRO
    fechaCreacion: {
        type: Date,
        default: Date.now,
        immutable: true
    },

    fechaActualizacion: {
        type: Date,
        default: Date.now
    },

    // Indica si el local está activo en el sistema
    activo: {
        type: Boolean,
        default: true
    },

    // Notas adicionales
    notas: {
        type: String,
        trim: true,
        maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: 'locales'
});

// ÍNDICES PARA OPTIMIZAR CONSULTAS
localSchema.index({ codigoLocal: 1 });
localSchema.index({ 'ubicacion.region': 1 });
localSchema.index({ 'ubicacion.ciudad': 1 });
localSchema.index({ tipoEstablecimiento: 1 });
localSchema.index({ activo: 1 });
localSchema.index({ fechaCreacion: -1 });

// MIDDLEWARE PRE-SAVE
localSchema.pre('save', function(next) {
    this.fechaActualizacion = new Date();
    next();
});

// MÉTODOS VIRTUALES
localSchema.virtual('ubicacionCompleta').get(function() {
    let ubicacion = `${this.ubicacion.direccion}, ${this.ubicacion.ciudad}, ${this.ubicacion.region}`;
    if (this.ubicacion.codigoPostal) {
        ubicacion += ` (${this.ubicacion.codigoPostal})`;
    }
    return ubicacion;
});

localSchema.virtual('eficienciaPromedio').get(function() {
    if (this.estadisticas.totalMaquinas > 0) {
        return this.estadisticas.totalIngresos / this.estadisticas.totalMaquinas;
    }
    return 0;
});

// MÉTODOS DE INSTANCIA
localSchema.methods.actualizarEstadisticas = async function() {
    const Maquina = mongoose.model('Maquina');
    
    const maquinasDelLocal = await Maquina.find({
        'ubicacion.direccion': this.ubicacion.direccion,
        'ubicacion.ciudad': this.ubicacion.ciudad,
        activa: true
    });

    this.estadisticas.totalMaquinas = maquinasDelLocal.length;
    this.estadisticas.maquinasActivas = maquinasDelLocal.filter(m => m.estado.operativo === 'Activa').length;
    this.estadisticas.totalIngresos = maquinasDelLocal.reduce((sum, m) => sum + m.estadisticas.totalIngresos, 0);
    this.estadisticas.promedioIngresosPorMaquina = this.estadisticas.totalMaquinas > 0 
        ? this.estadisticas.totalIngresos / this.estadisticas.totalMaquinas 
        : 0;

    if (maquinasDelLocal.length > 0 && !this.estadisticas.primeraInstalacion) {
        this.estadisticas.primeraInstalacion = maquinasDelLocal
            .sort((a, b) => a.fechaInstalacion - b.fechaInstalacion)[0].fechaInstalacion;
    }

    return this.save();
};

// MÉTODOS ESTÁTICOS
localSchema.statics.obtenerPorRegion = function(region) {
    return this.find({ 'ubicacion.region': region, activo: true });
};

localSchema.statics.obtenerPorTipo = function(tipo) {
    return this.find({ tipoEstablecimiento: tipo, activo: true });
};

localSchema.statics.buscarPorNombre = function(nombre) {
    return this.find({ 
        nombre: new RegExp(nombre, 'i'), 
        activo: true 
    });
};

localSchema.statics.obtenerEstadisticasGenerales = function() {
    return this.aggregate([
        { $match: { activo: true } },
        {
            $group: {
                _id: null,
                totalLocales: { $sum: 1 },
                totalMaquinas: { $sum: '$estadisticas.totalMaquinas' },
                totalIngresos: { $sum: '$estadisticas.totalIngresos' },
                promedioMaquinasPorLocal: { $avg: '$estadisticas.totalMaquinas' }
            }
        }
    ]);
};

// Configurar virtuals en JSON
localSchema.set('toJSON', { virtuals: true });
localSchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const Local = mongoose.model('Local', localSchema);

module.exports = Local;
