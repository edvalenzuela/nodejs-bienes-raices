
(function(){

  const lat = 20.67444163271174;
  const lng = -103.38739216304566;
  const mapa = L.map('mapa-inicio').setView([lat, lng ], 13);

  let markers = new L.FeatureGroup().addTo(mapa)
  let propiedades= []

  //filtros
  const filtros = {
    categoria: '',
    precio: ''
  }

  const categoriasSelect = document.querySelector('#categorias');
  const preciosSelect = document.querySelector('#precios');



  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapa)

  // filtrado de categorias y precios
  categoriasSelect.addEventListener('change', e => {
    filtros.categoria = +e.target.value
    filtrarPropiedades()
  })

  preciosSelect.addEventListener('change', e => {
    filtros.precio = +e.target.value
    filtrarPropiedades()
  })

  const obtenerPropiedades = async() => {
    try {
      const url = '/api/propiedades'
      const respuesta = await fetch(url)
      propiedades = await respuesta.json()

      mostrarPropiedades(propiedades)

    } catch (error) {
      console.log(error)
    }
  }

  const mostrarPropiedades = propiedades => {

    //limpiar los markers previos
    markers.clearLayers()

    propiedades.forEach(item => {
      //agregar los pines
      const marker = new L.marker([item?.lat, item?.lng], {
        autoPan: true
      })
      .addTo(mapa)
      .bindPopup(`
        <p class="text-indigo-600 font-bold">${item?.categoria.nombre}</p>
        <h1 class="text-xl font-extrabold uppercase my-2">${item?.titulo}</h1>
        <img src="/uploads/${item?.imagen}" alt="Imagen de la propiedad ${item.titulo}" >
        <p class="text-gray-600 font-bold">${item?.precio.nombre}</p>
        <a href="/propiedad/${item.id}" class="bg-indigo-600 block p-2 text-center font-bold uppercase">Ver propiedad</a>
      `)
      markers.addLayer(marker)

    })
  }

  const filtrarPropiedades = () => {
    const resultado = propiedades
      .filter(filtrarCategoria)
      .filter(filtrarPrecio)
    mostrarPropiedades(resultado)
  }

  const filtrarCategoria = item => filtros.categoria ? item.categoriaId === filtros.categoria : item

  const filtrarPrecio = item => filtros.precio ? item.precioId === filtros.precio : item

  obtenerPropiedades()
})()