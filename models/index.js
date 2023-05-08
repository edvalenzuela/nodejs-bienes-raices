import Propiedad from './Propiedad.js'
import Precio from './Precio.js'
import Categoria from './Categoria.js'
import Usuario from './Usuario.js'
import Mensaje from './Mensaje.js'

//HasOne (se lee de derecha a izquierda)
//un precio tiene una propiedad
//Precio.hasOne(Propiedad)

//belongsTo (se lee de izquierda a derecha de forma mas natural)
//Propiedad.belongsTo(Precio,{ foreignKey:'precioId'})
Propiedad.belongsTo(Precio)
Propiedad.belongsTo(Categoria)
Propiedad.belongsTo(Usuario)
Propiedad.hasMany(Mensaje) // una propiedad puede tener multiples mensajes

Mensaje.belongsTo(Propiedad)
Mensaje.belongsTo(Usuario)

export{
  Propiedad,
  Precio,
  Categoria,
  Usuario,
  Mensaje
}