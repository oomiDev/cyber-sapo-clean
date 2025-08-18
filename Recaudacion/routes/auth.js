const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const router = express.Router();

// Middleware de validación de errores
const manejarErroresValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Datos inválidos',
      errores: errores.array()
    });
  }
  next();
};

// Generar JWT token
const generarToken = (usuarioId) => {
  return jwt.sign(
    { usuarioId },
    process.env.JWT_SECRET || 'clave_secreta_desarrollo',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/registro - Registrar nuevo usuario
router.post('/registro', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password debe tener al menos 6 caracteres'),
  
  body('nombre')
    .notEmpty()
    .withMessage('Nombre es requerido')
    .trim(),
  
  body('apellido')
    .notEmpty()
    .withMessage('Apellido es requerido')
    .trim()
], manejarErroresValidacion, async (req, res) => {
  try {
    const { username, email, password, nombre, apellido, telefono, rol } = req.body;
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      $or: [{ email }, { username }]
    });
    
    if (usuarioExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Usuario o email ya existe'
      });
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      username,
      email,
      password,
      nombre,
      apellido,
      telefono,
      rol: rol || 'usuario',
      ipRegistro: req.ip
    });
    
    // Asignar permisos según rol
    if (nuevoUsuario.rol === 'admin') {
      nuevoUsuario.permisos = ['ver_dashboard', 'gestionar_maquinas', 'ver_reportes', 'gestionar_usuarios'];
    } else if (nuevoUsuario.rol === 'operador') {
      nuevoUsuario.permisos = ['ver_dashboard', 'gestionar_maquinas', 'ver_reportes'];
    } else {
      nuevoUsuario.permisos = ['ver_dashboard'];
    }
    
    await nuevoUsuario.save();
    
    // Generar token
    const token = generarToken(nuevoUsuario._id);
    
    res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: nuevoUsuario
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', [
  body('credencial')
    .notEmpty()
    .withMessage('Email o username requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('Password requerido')
], manejarErroresValidacion, async (req, res) => {
  try {
    const { credencial, password } = req.body;
    
    // Buscar usuario por email o username
    const usuario = await Usuario.buscarPorCredencial(credencial);
    
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas'
      });
    }
    
    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Cuenta desactivada'
      });
    }
    
    // Verificar password
    const passwordValido = await usuario.compararPassword(password);
    
    if (!passwordValido) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas'
      });
    }
    
    // Actualizar último acceso
    await usuario.actualizarUltimoAcceso();
    
    // Generar token
    const token = generarToken(usuario._id);
    
    res.json({
      exito: true,
      mensaje: 'Login exitoso',
      token,
      usuario
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token no proporcionado'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_desarrollo');
    const usuario = await Usuario.findById(decoded.usuarioId);
    
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido'
      });
    }
    
    res.json({
      exito: true,
      usuario
    });
    
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(401).json({
      exito: false,
      mensaje: 'Token inválido'
    });
  }
});

// PUT /api/auth/perfil - Actualizar perfil
router.put('/perfil', [
  body('nombre').optional().trim(),
  body('apellido').optional().trim(),
  body('telefono').optional().trim(),
  body('ubicacionFavorita').optional().trim()
], async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token no proporcionado'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_desarrollo');
    const usuario = await Usuario.findById(decoded.usuarioId);
    
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    // Actualizar campos permitidos
    const camposPermitidos = ['nombre', 'apellido', 'telefono', 'ubicacionFavorita'];
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        usuario[campo] = req.body[campo];
      }
    });
    
    await usuario.save();
    
    res.json({
      exito: true,
      mensaje: 'Perfil actualizado exitosamente',
      usuario
    });
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/cambiar-password - Cambiar contraseña
router.post('/cambiar-password', [
  body('passwordActual')
    .notEmpty()
    .withMessage('Password actual requerido'),
  
  body('passwordNuevo')
    .isLength({ min: 6 })
    .withMessage('Password nuevo debe tener al menos 6 caracteres')
], manejarErroresValidacion, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token no proporcionado'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_desarrollo');
    const usuario = await Usuario.findById(decoded.usuarioId);
    
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    const { passwordActual, passwordNuevo } = req.body;
    
    // Verificar password actual
    const passwordValido = await usuario.compararPassword(passwordActual);
    
    if (!passwordValido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Password actual incorrecto'
      });
    }
    
    // Cambiar password
    usuario.password = passwordNuevo;
    await usuario.save();
    
    res.json({
      exito: true,
      mensaje: 'Password cambiado exitosamente'
    });
    
  } catch (error) {
    console.error('Error cambiando password:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

module.exports = router;
