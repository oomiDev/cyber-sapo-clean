/**
 * MODELO DE REPORTES AUTOMÁTICOS
 * 
 * Este modelo almacena reportes pre-calculados para optimizar
 * la carga de dashboards y análisis de tendencias.
 */

const mongoose = require('mongoose');

// Esquema para reportes agregados y pre-calculados
const reporteSchema = new mongoose.Schema({
    // IDENTIFICACIÓN DEL REPORTE
    tipoReporte: {
        type: String,
        required: [true, 'El tipo de reporte es obligatorio'],
        enum: {
            values: ['diario', 'semanal', 'mensual', 'trimestral', 'anual', 'por_maquina', 'por_region'],
            message: 'Tipo de reporte inválido'
        },
        index: true
    },

    // PERÍODO DEL REPORTE
    periodo: {
        fechaInicio: {
            type: Date,
            required: [true, 'La fecha de inicio es obligatoria'],
            index: true
        },
        fechaFin: {
            type: Date,
            required: [true, 'La fecha de fin es obligatoria'],
            index: true
        },
        
        // Campos para facilitar consultas
        año: {
            type: Number,
            required: true,
            index: true
        },
        mes: {
            type: Number,
            min: 1,
            max: 12
        },
        semana: {
            type: Number,
            min: 1,
            max: 53
        },
        trimestre: {
            type: Number,
            min: 1,
            max: 4
        }
    },

    // FILTROS APLICADOS AL REPORTE
    filtros: {
        region: {
            type: String,
            trim: true
        },
        ciudad: {
            type: String,
            trim: true
        },
        codigoMaquina: {
            type: String,
            trim: true,
            uppercase: true
        },
        estadoMaquina: {
            type: String,
            enum: ['Activa', 'Inactiva', 'Mantenimiento', 'Averiada']
        }
    },

    // DATOS AGREGADOS DEL REPORTE
    datos: {
        // Resumen general
        resumen: {
            totalPulsos: {
                type: Number,
                default: 0,
                min: [0, 'El total de pulsos no puede ser negativo']
            },
            totalIngresos: {
                type: Number,
                default: 0,
                min: [0, 'El total de ingresos no puede ser negativo']
            },
            promedioIngresosPorPulso: {
                type: Number,
                default: 0,
                min: [0, 'El promedio no puede ser negativo']
            },
            maquinasActivas: {
                type: Number,
                default: 0,
                min: [0, 'Las máquinas activas no pueden ser negativas']
            },
            maquinasInactivas: {
                type: Number,
                default: 0,
                min: [0, 'Las máquinas inactivas no pueden ser negativas']
            }
        },

        // Distribución por horas (array de 24 elementos)
        distribucionHoraria: [{
            hora: {
                type: Number,
                min: 0,
                max: 23
            },
            pulsos: {
                type: Number,
                default: 0
            },
            ingresos: {
                type: Number,
                default: 0
            }
        }],

        // Distribución por días de la semana (array de 7 elementos)
        distribucionSemanal: [{
            diaSemana: {
                type: Number,
                min: 0,
                max: 6
            },
            nombreDia: {
                type: String,
                enum: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            },
            pulsos: {
                type: Number,
                default: 0
            },
            ingresos: {
                type: Number,
                default: 0
            }
        }],

        // Top 10 máquinas por rendimiento
        topMaquinas: [{
            codigoMaquina: String,
            nombre: String,
            region: String,
            ciudad: String,
            pulsos: Number,
            ingresos: Number,
            promedioIngresos: Number,
            ultimaActividad: Date
        }],

        // Estadísticas por región
        estadisticasRegiones: [{
            region: String,
            totalPulsos: Number,
            totalIngresos: Number,
            maquinasActivas: Number,
            promedioIngresosPorMaquina: Number,
            porcentajeDelTotal: Number
        }],

        // Tendencias y comparaciones
        tendencias: {
            crecimientoPulsos: {
                type: Number,
                default: 0 // Porcentaje de crecimiento vs período anterior
            },
            crecimientoIngresos: {
                type: Number,
                default: 0
            },
            mejorDia: {
                fecha: Date,
                pulsos: Number,
                ingresos: Number
            },
            peorDia: {
                fecha: Date,
                pulsos: Number,
                ingresos: Number
            },
            horasPico: [{
                hora: Number,
                pulsos: Number,
                ingresos: Number
            }]
        }
    },

    // METADATOS DEL REPORTE
    metadata: {
        fechaGeneracion: {
            type: Date,
            default: Date.now
        },
        tiempoGeneracion: {
            type: Number, // Tiempo en milisegundos
            min: [0, 'El tiempo de generación no puede ser negativo']
        },
        registrosProcesados: {
            type: Number,
            default: 0,
            min: [0, 'Los registros procesados no pueden ser negativos']
        },
        version: {
            type: String,
            default: '1.0'
        }
    },

    // ESTADO DEL REPORTE
    estado: {
        type: String,
        enum: ['generando', 'completado', 'error', 'obsoleto'],
        default: 'generando',
        index: true
    },

    // CAMPOS DE AUDITORÍA
    fechaCreacion: {
        type: Date,
        default: Date.now,
        immutable: true
    },

    fechaActualizacion: {
        type: Date,
        default: Date.now
    },

    activo: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: 'reportes'
});

// ÍNDICES PARA OPTIMIZAR CONSULTAS DE REPORTES
reporteSchema.index({ tipoReporte: 1, 'periodo.fechaInicio': -1 });
reporteSchema.index({ 'periodo.año': 1, 'periodo.mes': 1 });
reporteSchema.index({ 'filtros.region': 1, tipoReporte: 1 });
reporteSchema.index({ estado: 1, fechaCreacion: -1 });

// MÉTODOS ESTÁTICOS PARA GESTIÓN DE REPORTES

// Obtener último reporte de un tipo específico
reporteSchema.statics.obtenerUltimoReporte = function(tipo, filtros = {}) {
    return this.findOne({
        tipoReporte: tipo,
        estado: 'completado',
        activo: true,
        ...filtros
    }).sort({ 'periodo.fechaInicio': -1 });
};

// Verificar si existe un reporte para un período específico
reporteSchema.statics.existeReporte = function(tipo, fechaInicio, fechaFin, filtros = {}) {
    return this.findOne({
        tipoReporte: tipo,
        'periodo.fechaInicio': new Date(fechaInicio),
        'periodo.fechaFin': new Date(fechaFin),
        estado: 'completado',
        activo: true,
        ...filtros
    });
};

// Marcar reportes como obsoletos
reporteSchema.statics.marcarObsoletos = function(tipo, fechaLimite) {
    return this.updateMany(
        {
            tipoReporte: tipo,
            fechaCreacion: { $lt: new Date(fechaLimite) },
            activo: true
        },
        {
            estado: 'obsoleto',
            fechaActualizacion: new Date()
        }
    );
};

// MÉTODOS DE INSTANCIA

// Marcar reporte como completado
reporteSchema.methods.marcarCompletado = function(tiempoGeneracion, registrosProcesados) {
    this.estado = 'completado';
    this.metadata.tiempoGeneracion = tiempoGeneracion;
    this.metadata.registrosProcesados = registrosProcesados;
    this.fechaActualizacion = new Date();
    return this.save();
};

// Marcar reporte con error
reporteSchema.methods.marcarError = function(mensajeError) {
    this.estado = 'error';
    this.metadata.error = mensajeError;
    this.fechaActualizacion = new Date();
    return this.save();
};

// Crear y exportar el modelo
const Reporte = mongoose.model('Reporte', reporteSchema);

module.exports = Reporte;
