import { check, validationResult } from 'express-validator'
import Usuario from '../models/Usuario.js'
import { generarId } from '../helpers/tokens.js'
import { emailRegistro } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
  res.render('auth/login', {
    pagina: 'Iniciar sesión'
  })
}

const formularioRegistro = (req, res) => {
  res.render('auth/registro', {
    pagina: 'Crear cuenta',
    csrfToken: req.csrfToken()
  })
}

const registrar = async(req, res) => {
  //validacion
  await check('nombre').notEmpty().withMessage('El Nombre no puede ir vacio').run(req)
  await check('email').isEmail().withMessage('Eso no parece un email').run(req)
  await check('password').isLength({ min: 6 }).withMessage('El Password debe ser de al menos 6 caracteres!!!').run(req)
  await check('repetir_password').equals(req.body.password).withMessage('Los Passwords no son iguales!!!').run(req)

  let resultado = validationResult(req)
  
  //verificar que el resultado este vacio
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/registro', {
      pagina: 'Crear cuenta',
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email
      }
    })
  }
  //Extraer los datos
  const { nombre, email, password } = req.body;

  // verificar que el usuario no este duplicado
  const existeUsuario = await Usuario.findOne({ where: { email }})
  if (existeUsuario){
    return res.render('auth/registro', {
      pagina: 'Crear cuenta',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'El usuario ya esta registrado'}],
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email
      }
    })
  }
  // almacenar un usuario
  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId()
  })

  // Enviar email de confirmación
  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token
  })

  // Mostrar mensaje de confirmación
  res.render('templates/mensaje', {
    pagina: 'Cuenta creada correctamente',
    mensaje: 'Hemos enviado un email de confirmación presiona en el enlace'
  })
}

const confirmar = async(req, res) => {
  const { token } = req.params;

  // verificar si el token es válido
  const usuario = await Usuario.findOne({where: {token}})
  if(!usuario){
    return res.render('auth/confirmar-cuenta', {
      pagina: 'Error al confirmar tu cuenta',
      mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
      error: true
    })
  }
  // confirmar la cuenta
  usuario.token = null;
  usuario.confirmado = true;

  await usuario.save();
  
  res.render('auth/confirmar-cuenta', {
    pagina: 'Cuenta confirmada',
    mensaje: 'La cuenta se confirmó correctamente'
  })
}

const formularioOlvidePassword = (req, res) => {
  res.render('auth/olvide-password', {
    pagina: 'Recupera tu acceso a Bienes Raices'
  })
}

export {
  formularioLogin,
  formularioRegistro,
  registrar,
  confirmar,
  formularioOlvidePassword
}