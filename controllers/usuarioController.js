import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Usuario from '../models/Usuario.js'
import { generarId, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
  res.render('auth/login', {
    pagina: 'Iniciar sesión',
    csrfToken: req.csrfToken()
  })
}

const cerrarSesion = async(req, res) => {
  return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const autenticar = async(req, res) => {
  // validación
  await check('email').isEmail().withMessage('El email es obligatorio').run(req)
  await check('password').notEmpty().withMessage('El Password es obligatorio').run(req)

  let resultado = validationResult(req)
  //verificar que el resultado este vacio
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/login', {
      pagina: 'Iniciar sesión',
      csrfToken: req.csrfToken(),
      errores: resultado.array()
    })
  }
  const {email, password} = req.body;
  //comprobar si el usuario existe

  const usuario = await Usuario.findOne({where: {email}})
  if(!usuario){
    return res.render('auth/login', {
      pagina: 'Iniciar sesión',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'El usuario no existe'}]
    })
  }

  // comprobar si el usuario esta confirmado
  if(!usuario.confirmado){
    return res.render('auth/login', {
      pagina: 'Iniciar sesión',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
    })
  }

  // revisar el password
  if(!usuario.verificarPassword(password)){
    return res.render('auth/login', {
      pagina: 'Iniciar sesión',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'El password es incorrecto'}]
    })
  }

  //autenticar al usuario
  const token = generarJWT({id: usuario.id, nombre: usuario.nombre})

  //almacenar en un cookie
  return res.cookie('_token', token, {
    httpOnly: true, //crossSite
    secure: true, //conexiones seguras certificado SSL
    sameSite: true
  }).redirect('/mis-propiedades')
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
    pagina: 'Recupera tu acceso a Bienes Raices',
    csrfToken: req.csrfToken()
  })
}

const resetPassword = async(req, res) => {
  //validacion
  await check('email').isEmail().withMessage('Eso no parece un email').run(req)

  let resultado = validationResult(req)
  
  //verificar que el resultado este vacio
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/olvide-password', {
      pagina: 'Recupera tu acceso a Bienes Raices',
      csrfToken: req.csrfToken(),
      errores: resultado.array()
    })
  }

  //buscar el usuario
  const {email}= req.body;
  const usuario = await Usuario.findOne({where: {email}})

  if(!usuario){
    return res.render('auth/olvide-password', {
      pagina: 'Recupera tu acceso a Bienes Raices',
      csrfToken: req.csrfToken(),
      errores: [{msg:'El email no pertenece a ningún usuario'}]
    })
  }

  //generar un token y enviar el email
  usuario.token = generarId();
  await usuario.save();

  //enviar un email
  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token
  })

  //renderizar un mensaje
  res.render('templates/mensaje', {
    pagina: 'Reestable tu password',
    mensaje: 'Hemos enviado un email con las instrucciones'
  })
}

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const usuario = await Usuario.findOne({where:{token}});

  if(!usuario){
    return res.render('auth/confirmar-cuenta', {
      pagina: 'Reestablece tu password',
      mensaje: 'Hubo un error al validar tu información, intenta de nuevo',
      error: true
    })
  }

  //mostrar formulario para modificar el password
  res.render('auth/reset-password',{
    pagina: 'Reestablece tu password',
    csrfToken: req.csrfToken(),
  })
}

const nuevoPassword = async(req, res) => {
  //validar el password
  await check('password').isLength({ min: 6 }).withMessage('El Password debe ser de al menos 6 caracteres!!!').run(req)

  let resultado = validationResult(req)
  
  //verificar que el resultado este vacio
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/reset-password', {
      pagina: 'Reestablece tu password',
      csrfToken: req.csrfToken(),
      errores: resultado.array()
    })
  }

  const { token } = req.params;
  const { password } = req.body;
  
  //identificar quien hace el cambio
  const usuario = await Usuario.findOne({where: {token}})

  //hashear el nuevo password
  const salt = await bcrypt.genSalt(10)
  usuario.password = await bcrypt.hash(password, salt);
  usuario.token = null;

  await usuario.save();

  res.render('auth/confirmar-cuenta', {
    pagina: 'Password reestablecido',
    mensaje: 'El password se guardó correctamente'
  })
}

export {
  formularioLogin,
  cerrarSesion,
  autenticar,
  formularioRegistro,
  registrar,
  confirmar,
  formularioOlvidePassword,
  resetPassword,
  comprobarToken,
  nuevoPassword
}