/**
 * MODELO DE MÁQUINA EXPENDEDORA
 * 
 * Este modelo define la estructura de datos para cada máquina expendedora
 * incluyendo ubicación, configuración y estado operativo.
 */

const mongoose = require('mongoose');

// Esquema para definir la estructura de una máquina expendedora
const maquinaSchema = new mongoose.Schema({
    // IDENTIFICACIÓN ÚNICA DE LA MÁQUINA
    codigoMaquina: {
        type: String,
        required: [true, 'El código de máquina es obligatorio'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, 'El código debe tener al menos 3 caracteres'],
        maxlength: [20, 'El código no puede exceder 20 caracteres']
    },

    // INFORMACIÓN BÁSICA DE LA MÁQUINA
    nombre: {
        type: String,
        required: [true, 'El nombre de la máquina es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },

    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },

    // UBICACIÓN GEOGRÁFICA Y ADMINISTRATIVA
    ubicacion: {
        // Región administrativa (ej: "Norte", "Sur", "Centro")
        region: {
            type: String,
            required: [true, 'La región es obligatoria'],
            trim: true,
            enum: {
                values: ['Norte', 'Sur', 'Este', 'Oeste', 'Centro', 'Metropolitana'],
                message: 'La región debe ser una de las opciones válidas'
            }
        },

        // Ciudad donde está ubicada la máquina
        ciudad: {
            type: String,
            required: [true, 'La ciudad es obligatoria'],
            trim: true,
            maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
        },

        // Dirección específica de la máquina
        direccion: {
            type: String,
            required: [true, 'La dirección es obligatoria'],
            trim: true,
            maxlength: [200, 'La dirección no puede exceder 200 caracteres']
        },

        // Coordenadas GPS para mapas (opcional)
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

        // Tipo de establecimiento donde está ubicada
        tipoEstablecimiento: {
            type: String,
            enum: ['Oficina', 'Escuela', 'Hospital', 'Centro Comercial', 'Fábrica', 'Otro'],
            default: 'Otro'
        }
    },

    // CONFIGURACIÓN TÉCNICA DE LA MÁQUINA
    configuracion: {
        // Valor monetario de cada pulso de la tecla "M"
        valorPorPulso: {
            type: Number,
            required: [true, 'El valor por pulso es obligatorio'],
            min: [0.01, 'El valor por pulso debe ser mayor a 0'],
            default: 1.00
        },

        // Moneda utilizada (ej: "EUR", "USD", "COP")
        moneda: {
            type: String,
            required: [true, 'La moneda es obligatoria'],
            enum: ['EUR', 'USD', 'COP', 'MXN', 'ARS'],
            default: 'EUR'
        },

        // Capacidad máxima de dinero que puede almacenar
        capacidadMaxima: {
            type: Number,
            min: [0, 'La capacidad máxima debe ser mayor o igual a 0'],
            default: 1000
        },

        // Intervalo de tiempo para reportes automáticos (en minutos)
        intervaloReporte: {
            type: Number,
            min: [1, 'El intervalo debe ser al menos 1 minuto'],
            default: 60
        }
    },

    // ESTADO OPERATIVO DE LA MÁQUINA
    estado: {
        // Estado actual de funcionamiento
        operativo: {
            type: String,
            enum: ['Activa', 'Inactiva', 'Mantenimiento', 'Averiada'],
            default: 'Activa'
        },

        // Última vez que se recibió un pulso
        ultimaActividad: {
            type: Date,
            default: Date.now
        },

        // Indica si la máquina está conectada al sistema
        conectada: {
            type: Boolean,
            default: false
        },

        // Nivel de llenado estimado (porcentaje)
        nivelLlenado: {
            type: Number,
            min: [0, 'El nivel de llenado no puede ser negativo'],
            max: [100, 'El nivel de llenado no puede exceder 100%'],
            default: 0
        }
    },

    // ESTADÍSTICAS RÁPIDAS (se actualizan con cada pulso)
    estadisticas: {
        // Total de pulsos recibidos desde la instalación
        totalPulsos: {
            type: Number,
            default: 0,
            min: [0, 'El total de pulsos no puede ser negativo']
        },

        // Total de ingresos acumulados
        totalIngresos: {
            type: Number,
            default: 0,
            min: [0, 'El total de ingresos no puede ser negativo']
        },

        // Pulsos del día actual
        pulsosHoy: {
            type: Number,
            default: 0,
            min: [0, 'Los pulsos de hoy no pueden ser negativos']
        },

        // Ingresos del día actual
        ingresosHoy: {
            type: Number,
            default: 0,
            min: [0, 'Los ingresos de hoy no pueden ser negativos']
        },

        // Fecha del último reseteo de estadísticas diarias
        ultimoResetDiario: {
            type: Date,
            default: Date.now
        }
    },

    // INFORMACIÓN DE CONTACTO Y RESPONSABLE
    responsable: {
        nombre: {
            type: String,
            trim: true,
            maxlength: [100, 'El nombre del responsable no puede exceder 100 caracteres']
        },
        telefono: {
            type: String,
            trim: true,
            maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
        }
    },

    // METADATOS DEL REGISTRO
    fechaInstalacion: {
        type: Date,
        default: Date.now
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    },

    fechaActualizacion: {
        type: Date,
        default: Date.now
    },

    // Indica si la máquina está activa en el sistema
    activa: {
        type: Boolean,
        default: true
    }
}, {
    // Opciones del esquema
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
    versionKey: false // Elimina el campo __v
});

// ÍNDICES PARA OPTIMIZAR CONSULTAS
maquinaSchema.index({ codigoMaquina: 1 }); // Búsqueda por código
maquinaSchema.index({ 'ubicacion.region': 1 }); // Filtro por región
maquinaSchema.index({ 'ubicacion.ciudad': 1 }); // Filtro por ciudad
maquinaSchema.index({ 'estado.operativo': 1 }); // Filtro por estado
maquinaSchema.index({ fechaCreacion: -1 }); // Ordenar por fecha de creación

// MIDDLEWARE PRE-SAVE: Se ejecuta antes de guardar
maquinaSchema.pre('save', function(next) {
    // Actualizar fecha de modificación
    this.fechaActualizacion = new Date();
    
    // Calcular nivel de llenado basado en ingresos y capacidad
    if (this.configuracion.capacidadMaxima > 0) {
        const porcentaje = (this.estadisticas.totalIngresos / this.configuracion.capacidadMaxima) * 100;
        this.estado.nivelLlenado = Math.min(porcentaje, 100);
    }
    
    next();
});

// MÉTODOS VIRTUALES: Campos calculados que no se guardan en la BD
maquinaSchema.virtual('ingresoPromedioDiario').get(function() {
    const diasOperando = Math.ceil((Date.now() - this.fechaInstalacion) / (1000 * 60 * 60 * 24));
    return diasOperando > 0 ? this.estadisticas.totalIngresos / diasOperando : 0;
});

maquinaSchema.virtual('ubicacionCompleta').get(function() {
    return `${this.ubicacion.direccion}, ${this.ubicacion.ciudad}, ${this.ubicacion.region}`;
});

// MÉTODOS DE INSTANCIA: Funciones que se pueden llamar en cada máquina
maquinaSchema.methods.registrarPulso = function(valorPulso = null) {
    const valor = valorPulso || this.configuracion.valorPorPulso;
    
    // Actualizar estadísticas
    this.estadisticas.totalPulsos += 1;
    this.estadisticas.totalIngresos += valor;
    
    // Verificar si es un nuevo día para resetear estadísticas diarias
    const hoy = new Date();
    const ultimoReset = new Date(this.estadisticas.ultimoResetDiario);
    
    if (hoy.toDateString() !== ultimoReset.toDateString()) {
        this.estadisticas.pulsosHoy = 1;
        this.estadisticas.ingresosHoy = valor;
        this.estadisticas.ultimoResetDiario = hoy;
    } else {
        this.estadisticas.pulsosHoy += 1;
        this.estadisticas.ingresosHoy += valor;
    }
    
    // Actualizar estado
    this.estado.ultimaActividad = new Date();
    this.estado.conectada = true;
    
    return this.save();
};

maquinaSchema.methods.cambiarEstado = function(nuevoEstado) {
    this.estado.operativo = nuevoEstado;
    this.fechaActualizacion = new Date();
    return this.save();
};

// MÉTODOS ESTÁTICOS: Funciones que se pueden llamar en el modelo
maquinaSchema.statics.obtenerPorRegion = function(region) {
    return this.find({ 'ubicacion.region': region, activa: true });
};

maquinaSchema.statics.obtenerActivas = function() {
    return this.find({ 'estado.operativo': 'Activa', activa: true });
};

maquinaSchema.statics.obtenerEstadisticasGenerales = function() {
    return this.aggregate([
        { $match: { activa: true } },
        {
            $group: {
                _id: null,
                totalMaquinas: { $sum: 1 },
                totalIngresos: { $sum: '$estadisticas.totalIngresos' },
                totalPulsos: { $sum: '$estadisticas.totalPulsos' },
                promedioIngresosPorMaquina: { $avg: '$estadisticas.totalIngresos' }
            }
        }
    ]);
};

// Configurar el modelo para incluir virtuals en JSON
maquinaSchema.set('toJSON', { virtuals: true });
maquinaSchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const Maquina = mongoose.model('Maquina', maquinaSchema);

module.exports = Maquina;
