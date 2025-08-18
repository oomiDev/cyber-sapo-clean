/**
 * MODELO DE PULSO DE MÁQUINA
 * 
 * Este modelo registra cada pulso individual de la tecla "M" de cada máquina,
 * permitiendo un seguimiento detallado de todos los ingresos y análisis de tendencias.
 */

const mongoose = require('mongoose');

// Esquema para registrar cada pulso individual de las máquinas
const pulsoSchema = new mongoose.Schema({
    // IDENTIFICACIÓN DEL PULSO
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },

    // REFERENCIA A LA MÁQUINA QUE ENVIÓ EL PULSO
    maquina: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Maquina',
        required: [true, 'La referencia a la máquina es obligatoria'],
    },

    // CÓDIGO DE LA MÁQUINA (desnormalizado para consultas rápidas)
    codigoMaquina: {
        type: String,
        required: [true, 'El código de máquina es obligatorio'],
        trim: true,
        uppercase: true
    },

    // INFORMACIÓN DEL PULSO
    valorPulso: {
        type: Number,
        required: [true, 'El valor del pulso es obligatorio'],
        min: [0.01, 'El valor del pulso debe ser mayor a 0'],
        validate: {
            validator: function(v) {
                return v > 0 && Number.isFinite(v);
            },
            message: 'El valor del pulso debe ser un número positivo válido'
        }
    },

    // MONEDA DEL PULSO (desnormalizada de la máquina)
    moneda: {
        type: String,
        required: [true, 'La moneda es obligatoria'],
        enum: ['EUR', 'USD', 'COP', 'MXN', 'ARS'],
        default: 'EUR'
    },

    // TIMESTAMP EXACTO DEL PULSO
    fechaHora: {
        type: Date,
        required: [true, 'La fecha y hora son obligatorias'],
        default: Date.now,
    },

    // INFORMACIÓN TEMPORAL PARA ANÁLISIS
    temporal: {
        // Año del pulso (para agregaciones anuales)
        año: {
            type: Number,
            required: true
        },

        // Mes del pulso (1-12)
        mes: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },

        // Día del mes (1-31)
        dia: {
            type: Number,
            required: true,
            min: 1,
            max: 31
        },

        // Día de la semana (0=Domingo, 6=Sábado)
        diaSemana: {
            type: Number,
            required: true,
            min: 0,
            max: 6
        },

        // Hora del día (0-23)
        hora: {
            type: Number,
            required: true,
            min: 0,
            max: 23
        },

        // Minuto de la hora (0-59)
        minuto: {
            type: Number,
            required: true,
            min: 0,
            max: 59
        },

        // Trimestre del año (1-4)
        trimestre: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },

        // Semana del año (1-53)
        semanaAño: {
            type: Number,
            required: true,
            min: 1,
            max: 53
        }
    },

    // UBICACIÓN DE LA MÁQUINA (desnormalizada para consultas rápidas)
    ubicacion: {
        region: {
            type: String,
            required: true,
            trim: true
        },
        ciudad: {
            type: String,
            required: true,
            trim: true
        },
        direccion: {
            type: String,
            required: true,
            trim: true
        }
    },

    // METADATOS TÉCNICOS
    metadata: {
        // IP desde donde se recibió el pulso
        ipOrigen: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v);
                },
                message: 'Formato de IP inválido'
            }
        },

        // User-Agent del dispositivo que envió el pulso
        userAgent: {
            type: String,
            trim: true,
            maxlength: [500, 'User-Agent demasiado largo']
        },

        // Número de secuencia del pulso (para detectar pulsos perdidos)
        numeroSecuencia: {
            type: Number,
            min: [1, 'El número de secuencia debe ser mayor a 0']
        },

        // Indica si el pulso fue procesado correctamente
        procesado: {
            type: Boolean,
            default: true
        },

        // Tiempo de procesamiento en milisegundos
        tiempoProcesamiento: {
            type: Number,
            min: [0, 'El tiempo de procesamiento no puede ser negativo']
        }
    },

    // CAMPOS DE AUDITORÍA
    fechaCreacion: {
        type: Date,
        default: Date.now,
        immutable: true // No se puede modificar después de crear
    },

    // Indica si el pulso está activo (para soft delete)
    activo: {
        type: Boolean,
        default: true
    }
}, {
    // Opciones del esquema
    timestamps: false, // Usamos nuestros propios campos de fecha
    versionKey: false, // Elimina el campo __v
    collection: 'pulsos' // Nombre específico de la colección
});

// ÍNDICES COMPUESTOS PARA CONSULTAS OPTIMIZADAS
pulsoSchema.index({ maquina: 1, fechaHora: -1 }); // Pulsos por máquina ordenados por fecha
pulsoSchema.index({ codigoMaquina: 1, fechaHora: -1 }); // Pulsos por código de máquina
pulsoSchema.index({ 'ubicacion.region': 1, fechaHora: -1 }); // Pulsos por región
pulsoSchema.index({ 'temporal.año': 1, 'temporal.mes': 1 }); // Agregaciones mensuales
pulsoSchema.index({ 'temporal.año': 1, 'temporal.dia': 1 }); // Agregaciones diarias
pulsoSchema.index({ 'temporal.hora': 1 }); // Análisis por horas del día
pulsoSchema.index({ fechaHora: -1, activo: 1 }); // Pulsos recientes activos

// MIDDLEWARE PRE-SAVE: Calcular campos temporales automáticamente
pulsoSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('fechaHora')) {
        const fecha = new Date(this.fechaHora);
        
        // Calcular todos los campos temporales
        this.temporal.año = fecha.getFullYear();
        this.temporal.mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
        this.temporal.dia = fecha.getDate();
        this.temporal.diaSemana = fecha.getDay(); // 0=Domingo
        this.temporal.hora = fecha.getHours();
        this.temporal.minuto = fecha.getMinutes();
        
        // Calcular trimestre
        this.temporal.trimestre = Math.ceil(this.temporal.mes / 3);
        
        // Calcular semana del año
        const inicioAño = new Date(fecha.getFullYear(), 0, 1);
        const diasTranscurridos = Math.floor((fecha - inicioAño) / (24 * 60 * 60 * 1000));
        this.temporal.semanaAño = Math.ceil((diasTranscurridos + inicioAño.getDay() + 1) / 7);
    }
    
    next();
});

// MÉTODOS ESTÁTICOS PARA ANÁLISIS Y REPORTES

// Obtener pulsos por rango de fechas
pulsoSchema.statics.obtenerPorRangoFechas = function(fechaInicio, fechaFin, filtros = {}) {
    const query = {
        fechaHora: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin)
        },
        activo: true,
        ...filtros
    };
    
    return this.find(query).sort({ fechaHora: -1 });
};

// Estadísticas por día
pulsoSchema.statics.estadisticasPorDia = function(fechaInicio, fechaFin, filtros = {}) {
    const matchStage = {
        fechaHora: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin)
        },
        activo: true,
        ...filtros
    };

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    año: '$temporal.año',
                    mes: '$temporal.mes',
                    dia: '$temporal.dia'
                },
                totalPulsos: { $sum: 1 },
                totalIngresos: { $sum: '$valorPulso' },
                promedioValorPulso: { $avg: '$valorPulso' },
                maquinasActivas: { $addToSet: '$codigoMaquina' },
                primerPulso: { $min: '$fechaHora' },
                ultimoPulso: { $max: '$fechaHora' }
            }
        },
        {
            $addFields: {
                fecha: {
                    $dateFromParts: {
                        year: '$_id.año',
                        month: '$_id.mes',
                        day: '$_id.dia'
                    }
                },
                cantidadMaquinasActivas: { $size: '$maquinasActivas' }
            }
        },
        { $sort: { fecha: -1 } }
    ]);
};

// Estadísticas por hora del día
pulsoSchema.statics.estadisticasPorHora = function(filtros = {}) {
    const matchStage = { activo: true, ...filtros };

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$temporal.hora',
                totalPulsos: { $sum: 1 },
                totalIngresos: { $sum: '$valorPulso' },
                promedioIngresos: { $avg: '$valorPulso' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

// Top máquinas por ingresos
pulsoSchema.statics.topMaquinasPorIngresos = function(limite = 10, filtros = {}) {
    const matchStage = { activo: true, ...filtros };

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$codigoMaquina',
                totalPulsos: { $sum: 1 },
                totalIngresos: { $sum: '$valorPulso' },
                promedioIngresos: { $avg: '$valorPulso' },
                ultimaActividad: { $max: '$fechaHora' },
                region: { $first: '$ubicacion.region' },
                ciudad: { $first: '$ubicacion.ciudad' }
            }
        },
        { $sort: { totalIngresos: -1 } },
        { $limit: limite }
    ]);
};

// Tendencias por región
pulsoSchema.statics.tendenciasPorRegion = function(fechaInicio, fechaFin) {
    return this.aggregate([
        {
            $match: {
                fechaHora: {
                    $gte: new Date(fechaInicio),
                    $lte: new Date(fechaFin)
                },
                activo: true
            }
        },
        {
            $group: {
                _id: {
                    region: '$ubicacion.region',
                    año: '$temporal.año',
                    mes: '$temporal.mes'
                },
                totalPulsos: { $sum: 1 },
                totalIngresos: { $sum: '$valorPulso' },
                maquinasActivas: { $addToSet: '$codigoMaquina' }
            }
        },
        {
            $addFields: {
                cantidadMaquinas: { $size: '$maquinasActivas' },
                ingresoPromedioPorMaquina: {
                    $divide: ['$totalIngresos', { $size: '$maquinasActivas' }]
                }
            }
        },
        { $sort: { '_id.region': 1, '_id.año': -1, '_id.mes': -1 } }
    ]);
};

// Crear y exportar el modelo
const Pulso = mongoose.model('Pulso', pulsoSchema);

module.exports = Pulso;
