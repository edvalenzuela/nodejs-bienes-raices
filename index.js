import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import { connectDB } from './config/db.js'

//Crear la APP
const app = express()

// Habilitar lectura de datos de forms
app.use(express.urlencoded({extended: true}))

// Habilitar cookie parser
app.use(cookieParser())

// Habilitar CSRF
app.use(csurf({cookie: true}))

await connectDB();

//Habilitar Pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta pública
app.use( express.static('public'))

//Routing
app.use('/auth', usuarioRoutes)

//Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`El servidor esta funcionando en el puerto ${port}`)
})