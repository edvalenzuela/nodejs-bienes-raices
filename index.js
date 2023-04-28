//const express = require('express')
import express from 'express'
import usuarioRoutes from './routes/usuarioRoutes.js'
import db from './config/db.js'

//Crear la APP
const app = express()

// Conexión a la base de datos
try {
  await db.authenticate();
  console.log('Conexión correcta a la DB')
} catch (error) {
  console.log(error)
}

//Habilitar Pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta pública
app.use( express.static('public'))

//Routing
app.use('/auth', usuarioRoutes)

//Definir un puerto y arrancar el proyecto
const port = 80

app.listen(port, () => {
  console.log(`Èl servidor esta funcionando en el puerto ${port}`)
})