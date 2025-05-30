document.addEventListener('DOMContentLoaded', function () {
    const URL_BASE_API = "https://dragonball-api.com/api/characters";

    const botonCargarTodos = document.getElementById('boton-cargar-todos');
    const formularioBusqueda = document.getElementById('formularioBusqueda');
    const entradaBusqueda = document.getElementById('entradaBusqueda');
    const contenedorPersonajes = document.getElementById('contenedorPersonajes');
    const areaMensajes = document.getElementById('areaMensajes');
    const indicadorCarga = document.getElementById('indicadorCarga');

    const elementoModalPersonaje = new bootstrap.Modal(document.getElementById('modalPersonaje'));
    const nombreModal = document.getElementById('nombreModal');
    const imagenModal = document.getElementById('imagenModal');
    const razaModal = document.getElementById('razaModal');
    const generoModal = document.getElementById('generoModal');
    const kiModal = document.getElementById('kiModal');
    const kiMaximoModal = document.getElementById('kiMaximoModal');
    const afiliacionModal = document.getElementById('afiliacionModal');
    const descripcionModal = document.getElementById('descripcionModal');
    const contenedorTransformacionesModal = document.getElementById('contenedorTransformacionesModal');
    const listaTransformacionesModal = document.getElementById('listaTransformacionesModal');

    let paginaActual = 1;
    const limitePorPagina = 12;
    let estaCargando = false;
    let todosLosPersonajesCargados = false;
    let vistaActualEsBusqueda = false;

    async function obtenerDatos(url) {
        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) {
                throw new Error(`Error al obtener datos: ${respuesta.status} ${respuesta.statusText}`);
            }
            const datos = await respuesta.json();
            return datos;
        } catch (error) {
            console.error('Error en obtenerDatos:', error);
            throw error;
        }
    }

    function limpiarResultados() {
        contenedorPersonajes.innerHTML = '';
        areaMensajes.textContent = '';
        areaMensajes.className = 'alert d-none';
    }

    function mostrarMensaje(mensaje, tipo = 'info') {
        areaMensajes.textContent = mensaje;
        areaMensajes.className = `alert alert-${tipo}`;
    }

    function alternarIndicadorCarga(mostrar) {
        if (mostrar) {
            indicadorCarga.classList.remove('d-none');
        } else {
            indicadorCarga.classList.add('d-none');
        }
    }

    function crearTarjetaPersonaje(personaje) {
        const imagenSrc = personaje.image || 'https://via.placeholder.com/150x200?text=No+Imagen';
        const nombre = personaje.name || 'Nombre desconocido';
        const raza = personaje.race || 'Desconocida';
        const genero = personaje.gender || 'Desconocido';
        
        return `
            <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
                <div class="card h-100 tarjeta-personaje" data-id="${personaje.id}" style="cursor: pointer;">
                    <img src="${imagenSrc}" class="card-img-top" alt="${nombre}" 
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/150x200?text=No+Imagen';">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${nombre}</h5>
                        <p class="card-text mb-1">Raza: ${raza}</p>
                        <p class="card-text mb-3">Género: ${genero}</p>
                        <button class="btn btn-sm btn-outline-light mt-auto boton-ver-detalles" 
                                data-id="${personaje.id}" 
                                onclick="event.stopPropagation();">
                            Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function agregarPersonajes(personajes) {
        if (personajes.length === 0 && paginaActual === 1 && !vistaActualEsBusqueda) {
            mostrarMensaje("No se encontraron personajes.", 'info');
            return;
        }
        
        personajes.forEach(personaje => {
            const tarjetaHTML = crearTarjetaPersonaje(personaje);
            contenedorPersonajes.innerHTML += tarjetaHTML;
        });
        
        // Agregar event listeners a las nuevas cards
        agregarEventListenersACards();
    }

    function agregarEventListenersACards() {
        // Remover listeners anteriores para evitar duplicados
        const cards = document.querySelectorAll('.tarjeta-personaje');
        cards.forEach(card => {
            // Clonar el elemento para remover todos los event listeners
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });

        // Agregar nuevos event listeners
        const newCards = document.querySelectorAll('.tarjeta-personaje');
        newCards.forEach(card => {
            card.addEventListener('click', function(evento) {
                const idPersonaje = this.dataset.id;
                if (idPersonaje) {
                    console.log('Card clickeada, ID:', idPersonaje);
                    mostrarModalDetallesPersonaje(idPersonaje);
                }
            });
        });

        // Event listeners para botones "Ver detalles"
        const botones = document.querySelectorAll('.boton-ver-detalles');
        botones.forEach(boton => {
            boton.addEventListener('click', function(evento) {
                evento.preventDefault();
                evento.stopPropagation();
                const idPersonaje = this.dataset.id;
                if (idPersonaje) {
                    console.log('Botón clickeado, ID:', idPersonaje);
                    mostrarModalDetallesPersonaje(idPersonaje);
                }
            });
        });
    }

    async function cargarPersonajesIniciales(paginaACargar, anexar) {
        if (estaCargando || (todosLosPersonajesCargados && anexar)) {
            return;
        }

        estaCargando = true;
        vistaActualEsBusqueda = false;
        alternarIndicadorCarga(true);

        if (!anexar) {
            limpiarResultados();
            paginaActual = 1;
            todosLosPersonajesCargados = false;
        } else {
            paginaActual = paginaACargar;
        }

        try {
            const url = `${URL_BASE_API}?page=${paginaActual}&limit=${limitePorPagina}`;
            console.log('Cargando desde:', url);
            const datos = await obtenerDatos(url);
            const personajes = datos.items || [];

            if (personajes.length > 0) {
                agregarPersonajes(personajes);
            }

            if (!anexar && personajes.length === 0) {
                mostrarMensaje("No se encontraron personajes.", 'info');
            }

            if (datos.meta && paginaActual >= datos.meta.totalPages) {
                todosLosPersonajesCargados = true;
                if (contenedorPersonajes.children.length > 0 && anexar) {
                    mostrarMensaje("Todos los personajes han sido cargados.", 'success');
                }
            }
        } catch (error) {
            console.error("Error al cargar personajes:", error);
            mostrarMensaje(`Error al cargar personajes: ${error.message}`, 'danger');
            todosLosPersonajesCargados = true;
        } finally {
            estaCargando = false;
            alternarIndicadorCarga(false);
        }
    }

    async function buscarPersonajesPorNombre(nombre) {
        if (nombre.trim() === "") {
            mostrarMensaje("Por favor, ingresa un nombre para buscar.", 'warning');
            return;
        }

        estaCargando = true;
        vistaActualEsBusqueda = true;
        todosLosPersonajesCargados = true;
        limpiarResultados();
        alternarIndicadorCarga(true);

        try {
            const url = `${URL_BASE_API}?name=${encodeURIComponent(nombre)}`;
            console.log('Buscando en:', url);
            const personajes = await obtenerDatos(url);

            if (personajes.length === 0) {
                mostrarMensaje(`No se encontraron personajes para "${nombre}". Intenta con otro nombre.`, 'info');
            } else {
                agregarPersonajes(personajes);
            }
        } catch (error) {
            console.error("Error al buscar personajes:", error);
            mostrarMensaje(`Error al buscar personajes: ${error.message}`, 'danger');
        } finally {
            estaCargando = false;
            alternarIndicadorCarga(false);
        }
    }

    async function mostrarModalDetallesPersonaje(idPersonaje) {
        console.log('Abriendo modal para personaje ID:', idPersonaje);
        alternarIndicadorCarga(true);
        
        try {
            const url = `${URL_BASE_API}/${idPersonaje}`;
            console.log('Obteniendo detalles desde:', url);
            const personaje = await obtenerDatos(url);
            console.log('Datos del personaje:', personaje);

            // Llenar los datos del modal
            nombreModal.textContent = personaje.name || 'Nombre desconocido';
            imagenModal.src = personaje.image || 'https://via.placeholder.com/300x400?text=No+Imagen';
            imagenModal.alt = personaje.name || 'Personaje';
            razaModal.textContent = personaje.race || 'Desconocida';
            generoModal.textContent = personaje.gender || 'Desconocido';
            kiModal.textContent = personaje.ki || 'Desconocido';
            kiMaximoModal.textContent = personaje.maxKi || 'Desconocido';
            afiliacionModal.textContent = personaje.affiliation || 'Desconocida';
            descripcionModal.textContent = personaje.description || 'No hay descripción disponible.';

            // Manejar transformaciones
            listaTransformacionesModal.innerHTML = '';
            if (personaje.transformations && personaje.transformations.length > 0) {
                contenedorTransformacionesModal.style.display = 'block';
                personaje.transformations.forEach(transformacion => {
                    const li = document.createElement('li');
                    li.textContent = transformacion.name + (transformacion.ki ? ` (Ki: ${transformacion.ki})` : '');
                    listaTransformacionesModal.appendChild(li);
                });
            } else {
                contenedorTransformacionesModal.style.display = 'block';
                const li = document.createElement('li');
                li.textContent = 'Ninguna conocida.';
                listaTransformacionesModal.appendChild(li);
            }

            // Mostrar el modal
            elementoModalPersonaje.show();
            console.log('Modal mostrado correctamente');
            
        } catch (error) {
            console.error("Error al obtener detalles del personaje:", error);
            mostrarMensaje(`Error al cargar detalles del personaje: ${error.message}`, 'danger');
        } finally {
            alternarIndicadorCarga(false);
        }
    }

    // Event Listeners principales
    botonCargarTodos.addEventListener('click', function () {
        console.log('Botón cargar todos clickeado');
        cargarPersonajesIniciales(1, false);
    });

    formularioBusqueda.addEventListener('submit', function (evento) {
        evento.preventDefault();
        console.log('Formulario de búsqueda enviado:', entradaBusqueda.value);
        buscarPersonajesPorNombre(entradaBusqueda.value);
    });

    // Scroll infinito
    window.addEventListener('scroll', function () {
        if (vistaActualEsBusqueda || estaCargando || todosLosPersonajesCargados) {
            return;
        }

        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
            if (!todosLosPersonajesCargados) {
                console.log('Cargando más personajes...');
                cargarPersonajesIniciales(paginaActual + 1, true);
            }
        }
    });

    // Cargar personajes iniciales al cargar la página
    console.log('Aplicación inicializada');
});