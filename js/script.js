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
    //funcion para obtener datos
    async function obtenerDatos(url) {
        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            throw new Error(`Error al obtener datos: ${respuesta.status} ${respuesta.statusText}`);
        }
        const datos = await respuesta.json();
        return datos;
    }
    //funcion para limpiar resultados
    function limpiarResultados() {
        contenedorPersonajes.innerHTML = '';
        areaMensajes.textContent = '';
        areaMensajes.className = 'alert d-none';
    }
    //funcion para mostrar mensajes
    function mostrarMensaje(mensaje, tipo = 'info') {
        areaMensajes.textContent = mensaje;
        areaMensajes.className = `alert alert-${tipo}`;
    }
    //funcion para alternar indicador de carga
    function alternarIndicadorCarga(mostrar) {
        if (mostrar) {
            indicadorCarga.classList.remove('d-none');
        } else {
            indicadorCarga.classList.add('d-none');
        }
    }
    //funcion para crear tarjeta de personaje
    function crearTarjetaPersonaje(personaje) {
        return `
            <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
                <div class="card h-100 tarjeta-personaje" data-id="${personaje.id}">
                    <img src="${personaje.image}" class="card-img-top" alt="${personaje.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150x200?text=No+Pudo+Cargar+Imagen';">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${personaje.name}</h5>
                        <p class="card-text mb-1">Raza: ${personaje.race || 'Desconocida'}</p>
                        <p class="card-text">Género: ${personaje.gender || 'Desconocido'}</p>
                        <button class="btn btn-sm btn-outline-light mt-auto boton-ver-detalles" data-id="${personaje.id}">Ver detalles</button>
                    </div>
                </div>
            </div>
        `;
    }
    //funcion para agregar personajes
    function agregarPersonajes(personajes) {
        if (personajes.length === 0 && paginaActual === 1 && !vistaActualEsBusqueda) {
            mostrarMensaje("No se encontraron personajes.", 'info');
            return;
        }
        for (let i = 0; i < personajes.length; i++) {
            const personaje = personajes[i];
            const tarjetaHTML = crearTarjetaPersonaje(personaje);
            contenedorPersonajes.innerHTML += tarjetaHTML;
        }
    }
    //funcion para cargar personajes iniciales
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
            const datos = await obtenerDatos(url);
            const personajes = datos.items;

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
    //funcion para buscar personajes por nombre
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
    //funcion para mostrar modal de detalles del personaje
    async function mostrarModalDetallesPersonaje(idPersonaje) {
        alternarIndicadorCarga(true);
        try {
            const url = `${URL_BASE_API}/${idPersonaje}`;
            const personaje = await obtenerDatos(url);

            nombreModal.textContent = personaje.name;
            imagenModal.src = personaje.image || 'https://via.placeholder.com/150x200?text=No+Pudo+Cargar+Imagen';
            imagenModal.alt = personaje.name;
            razaModal.textContent = personaje.race || 'Desconocida';
            generoModal.textContent = personaje.gender || 'Desconocido';
            kiModal.textContent = personaje.ki || 'Desconocido';
            kiMaximoModal.textContent = personaje.maxKi || 'Desconocido';
            afiliacionModal.textContent = personaje.affiliation || 'Desconocida';
            descripcionModal.textContent = personaje.description || 'No hay descripción disponible.';

            listaTransformacionesModal.innerHTML = '';
            if (personaje.transformations && personaje.transformations.length > 0) {
                contenedorTransformacionesModal.style.display = 'block';
                for (let i = 0; i < personaje.transformations.length; i++) {
                    const transformacion = personaje.transformations[i];
                    const li = document.createElement('li');
                    li.textContent = transformacion.name + (transformacion.ki ? ` (Ki: ${transformacion.ki})` : '');
                    listaTransformacionesModal.appendChild(li);
                }
            } else {
                const li = document.createElement('li');
                li.textContent = 'Ninguna conocida.';
                listaTransformacionesModal.appendChild(li);
            }

            elementoModalPersonaje.show();
        } catch (error) {
            console.error("Error al obtener detalles del personaje:", error);
            mostrarMensaje(`Error al cargar detalles del personaje: ${error.message}`, 'danger');
        } finally {
            alternarIndicadorCarga(false);
        }
    }

    botonCargarTodos.addEventListener('click', function () {
        cargarPersonajesIniciales(1, false);
    });

    formularioBusqueda.addEventListener('submit', function (evento) {
        evento.preventDefault();
        buscarPersonajesPorNombre(entradaBusqueda.value);
    });

    contenedorPersonajes.addEventListener('click', function (evento) {
        let elementoClicado = evento.target;
        let divTarjetaPersonaje = null;

        while (elementoClicado && elementoClicado !== contenedorPersonajes) {
            if (elementoClicado.classList.contains('tarjeta-personaje')) {
                divTarjetaPersonaje = elementoClicado;
                break;
            }
            if (elementoClicado.classList.contains('boton-ver-detalles')) {
                divTarjetaPersonaje = elementoClicado.closest('.tarjeta-personaje');
                break;
            }
            elementoClicado = elementoClicado.parentElement;
        }

        if (divTarjetaPersonaje) {
            const idPersonaje = divTarjetaPersonaje.dataset.id;
            if (idPersonaje) {
                mostrarModalDetallesPersonaje(idPersonaje);
            }
        }
    });
    // Cargar personajes iniciales al cargar la página
    window.addEventListener('scroll', function () {
        if (vistaActualEsBusqueda || estaCargando || todosLosPersonajesCargados) {
            return;
        }

        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
            if (!todosLosPersonajesCargados) {
                cargarPersonajesIniciales(paginaActual + 1, true);
            }
        }
    });
});