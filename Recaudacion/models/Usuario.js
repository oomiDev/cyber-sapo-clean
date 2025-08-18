const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  // Información básica
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Información del perfil
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  
  // Roles y permisos
  rol: {
    type: String,
    enum: ['admin', 'operador', 'usuario'],
    default: 'usuario'
  },
  permisos: [{
    type: String,
    enum: ['ver_dashboard', 'gestionar_maquinas', 'ver_reportes', 'gestionar_usuarios']
  }],
  
  // Estado de la cuenta
  activo: {
    type: Boolean,
    default: true
  },
  emailVerificado: {
    type: Boolean,
    default: false
  },
  
  // Información de juego (para app móvil)
  puntuacionTotal: {
    type: Number,
    default: 0
  },
  partidasJugadas: {
    type: Number,
    default: 0
  },
  mejorPuntuacion: {
    type: Number,
    default: 0
  },
  ubicacionFavorita: {
    type: String,
    trim: true
  },
  
  // Metadatos
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date,
    default: Date.now
  },
  ipRegistro: String,
  tokenRecuperacion: String,
  expiraTokenRecuperacion: Date
}, {
  timestamps: true
});

// Índices para optimización
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ username: 1 });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ activo: 1 });

// Middleware para hashear password antes de guardar
usuarioSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();
  
  try {
    // Generar salt y hashear password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener datos públicos del usuario
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  
  // Eliminar campos sensibles
  delete usuario.password;
  delete usuario.tokenRecuperacion;
  delete usuario.expiraTokenRecuperacion;
  delete usuario.ipRegistro;
  
  return usuario;
};

// Método para actualizar último acceso
usuarioSchema.methods.actualizarUltimoAcceso = function() {
  this.ultimoAcceso = new Date();
  return this.save();
};

// Método para verificar permisos
usuarioSchema.methods.tienePermiso = function(permiso) {
  if (this.rol === 'admin') return true;
  return this.permisos.includes(permiso);
};

// Método estático para buscar por email o username
usuarioSchema.statics.buscarPorCredencial = function(credencial) {
  return this.findOne({
    $or: [
      { email: credencial.toLowerCase() },
      { username: credencial }
    ]
  });
};

module.exports = mongoose.model('Usuario', usuarioSchema);
