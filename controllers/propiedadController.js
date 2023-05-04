import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad } from '../models/index.js'

const admin = async(req, res) => {

  const { id } = req.usuario

  const propiedades = await Propiedad.findAll({
    where: {
      usuarioId: id
    },
    include: [
      { model: Categoria, as: 'categoria' },
      { model: Precio, as: 'precio' }
    ]
  })

  res.render('propiedades/admin', {
    pagina: 'Mis propiedades',
    propiedades,
    csrfToken: req.csrfToken()
  })
}

// formulario para crear una nueva propiedad
const crear = async(req, res) => {

  //consultar modelo de precio y categorias
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll()
  ])

  res.render('propiedades/crear', {
    pagina: 'Crear propiedad',
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: {}
  })
}

const guardar = async(req, res) => {
  //validación
  let resultado = validationResult(req);
  if(!resultado.isEmpty()){
    //consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll()
    ])

    return res.render('propiedades/crear', {
      pagina: 'Crear propiedad',
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body
    })
  }

  //crear un registro
  const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio:precioId, categoria: categoriaId } = req.body;
  const { id:usuarioId } = req.usuario;

  try {
    const propiedadGuardada = await Propiedad.create({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      categoriaId,
      usuarioId,
      imagen: ''
    })
    const { id } = propiedadGuardada;
    res.redirect(`/propiedades/agregar-imagen/${id}`);
    
  } catch (error) {
    console.log(error)
  }
}

const agregarImagen = async(req, res) => {

  const { id } = req.params;

  // validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)
  if(!propiedad){
    return res.redirect('/mis-propiedades')
  }

  // validar que la propiedad no este publicada
  // 0 (false)
  if(propiedad.publicado){
    return res.redirect('/mis-propiedades')
  }

  // validar que la propiedad pertenece a quien visita esta pagina
  if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
    return res.redirect('/mis-propiedades')
  }
  
  res.render('propiedades/agregar-imagen', {
    pagina: `Agregar imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad
  })
}

const almacenarImagen = async(req, res, next) => {
  const { id } = req.params;

  // validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)
  if(!propiedad){
    return res.redirect('/mis-propiedades')
  }

  // validar que la propiedad no este publicada
  // 0 (false)
  if(propiedad.publicado){
    return res.redirect('/mis-propiedades')
  }

  // validar que la propiedad pertenece a quien visita esta pagina
  if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
    return res.redirect('/mis-propiedades')
  }

  try {
    // almacenar la imagen y publicar propiedad
    propiedad.imagen = req.file.filename
    propiedad.publicado = 1
    await propiedad.save()

    next() // avanza al href de js

  } catch (error) {
    console.log(error)
  }
}

const editar = async(req, res)=>{

  const { id } = req.params;

  //validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad){
    return res.redirect('/mis-propiedades')
  }

  //revisar quien visita la URL , es quien creo la propiedad
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
    return res.redirect('/mis-propiedades')
  }

  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll()
  ])

  res.render('propiedades/editar', {
    pagina: `Editar propiedad: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: propiedad
  })
}

const guardarCambios = async(req, res) => {

  //verificar la validacion
  let resultado = validationResult(req);

  if(!resultado.isEmpty()){
    //consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll()
    ])

    return res.render('propiedades/editar', {
      pagina: 'Editar propiedad',
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body
    })
  }

  const { id } = req.params;

  //validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad){
    return res.redirect('/mis-propiedades')
  }

  //revisar quien visita la URL , es quien creo la propiedad
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
    return res.redirect('/mis-propiedades')
  }

  //reescribir el objeto y actualizarlo
  try {
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio:precioId, categoria: categoriaId } = req.body;
    propiedad.set({
      titulo, 
      descripcion, 
      habitaciones, 
      estacionamiento, 
      wc, 
      calle, 
      lat, 
      lng, 
      precio:precioId, 
      categoria: categoriaId
    })

    await propiedad.save()
    res.redirect('/mis-propiedades')

  } catch (error) {
    console.log(error)
  }
}

const eliminar = async(req, res) => {

  const { id } = req.params;

  //validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad){
    return res.redirect('/mis-propiedades')
  }

  //revisar quien visita la URL , es quien creo la propiedad
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
    return res.redirect('/mis-propiedades')
  }

  // Eliminar la imagen
  await unlink(`public/uploads/${propiedad.imagen}`)

  console.log(`Se eliminó la imagen ${propiedad.imagen}`)

  // Eliminar la propiedad
  await propiedad.destroy()
  res.redirect('/mis-propiedades')

}

const mostrarPropiedad = async(req, res) => {

  const { id } = req.params

  //comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include:[
      { model: Precio, as: 'precio'},
      { model: Categoria, as: 'categoria'}
    ]
  })

  if(!propiedad){
    return res.redirect('/404')
  }

  res.render('propiedades/mostrar', {
    propiedad,
    pagina: propiedad.titulo
  })
}

export {
  admin,
  crear,
  guardar,
  agregarImagen,
  almacenarImagen,
  editar,
  guardarCambios,
  eliminar,
  mostrarPropiedad
}