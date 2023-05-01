import Propiedad from './Propiedad.js'
import Precio from './Precio.js'
import Categoria from './Categoria.js'
import Usuario from './Usuario.js'

//HasOne (se lee de derecha a izquierda)
//un precio tiene una propiedad
//Precio.hasOne(Propiedad)

//belongsTo (se lee de izquierda a derecha de forma mas natural)
//Propiedad.belongsTo(Precio,{ foreignKey:'precioId'})
Propiedad.belongsTo(Precio)
Propiedad.belongsTo(Categoria)
Propiedad.belongsTo(Usuario)

export{
  Propiedad,
  Precio,
  Categoria,
  Usuario
}