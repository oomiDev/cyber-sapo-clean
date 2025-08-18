const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. Token no proporcionado'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_desarrollo');
    
    // Buscar usuario
    const usuario = await Usuario.findById(decoded.usuarioId);
    
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido'
      });
    }
    
    if (!usuario.activo) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Cuenta desactivada'
      });
    }
    
    // Agregar usuario a la request
    req.usuario = usuario;
    next();
    
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({
      exito: false,
      mensaje: 'Token inválido'
    });
  }
};

// Middleware para verificar roles específicos
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
    }
    
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Acceso denegado. Permisos insuficientes'
      });
    }
    
    next();
  };
};

// Middleware para verificar permisos específicos
const verificarPermiso = (permisoRequerido) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
    }
    
    if (!req.usuario.tienePermiso(permisoRequerido)) {
      return res.status(403).json({
        exito: false,
        mensaje: `Acceso denegado. Permiso '${permisoRequerido}' requerido`
      });
    }
    
    next();
  };
};

// Middleware opcional - no falla si no hay token
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_desarrollo');
      const usuario = await Usuario.findById(decoded.usuarioId);
      
      if (usuario && usuario.activo) {
        req.usuario = usuario;
      }
    }
    
    next();
    
  } catch (error) {
    // Continuar sin usuario autenticado
    next();
  }
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarPermiso,
  verificarTokenOpcional
};
