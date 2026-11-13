import { prepararPagina, mostrarAviso, mostrarCargando, mostrarVacio, mostrarErrores, botonOcupado, mensajeError } from "../ui/comun.js";
import { listarTours } from "../servicios/tours.js";
import { crearReserva } from "../servicios/reservas.js";
import { filtrarTours, ordenarTours } from "../utils/procesamiento.js";
import { validarReserva, esValido, departamentos } from "../utils/validaciones.js";
import { dinero, fechaLarga, escaparHTML, hoyISO } from "../utils/formato.js";

const formularioFiltros = document.querySelector("#filtros");
const selectDepartamento = document.querySelector("#departamento");
const lista = document.querySelector("#lista-tours");
const resumen = document.querySelector("#resumen");
const dialogo = document.querySelector("#dialogo-reserva");
const formularioReserva = document.querySelector("#formulario-reserva");
const detalleReserva = document.querySelector("#detalle-reserva");
const totalReserva = document.querySelector("#total-reserva");

let perfil = null;
let tours = [];
let tourSeleccionado = null;

function leerFiltros() {
    return {
        texto: formularioFiltros.buscar.value,
        departamento: formularioFiltros.departamento.value,
        soloDisponibles: formularioFiltros.soloDisponibles.checked,
        orden: formularioFiltros.ordenar.value
    };
}

function tarjetaTour(tour) {
    const hoy = hoyISO();
    const yaPaso = tour.fecha <= hoy;
    const agotado = tour.cuposDisponibles === 0;
    const pocosCupos = tour.cuposDisponibles > 0 && tour.cuposDisponibles <= 5;
    let textoBoton = "Reservar";
    if (yaPaso) {
        textoBoton = "Tour realizado";
    } else if (agotado) {
        textoBoton = "Agotado";
    }
    return `
        <article class="tarjeta-tour">
            <img src="${escaparHTML(tour.imagen)}" alt="${escaparHTML(tour.titulo)}" loading="lazy">
            <div class="tarjeta-tour-info">
                <span class="departamento-etiqueta">${escaparHTML(tour.departamento)}</span>
                <h3>${escaparHTML(tour.titulo)}</h3>
                <p><strong>Fecha:</strong> ${fechaLarga(tour.fecha)}</p>
                <p><strong>Horario:</strong> ${escaparHTML(tour.horario)}</p>
                <p><strong>Salida:</strong> ${escaparHTML(tour.puntoSalida)}</p>
                <p class="${pocosCupos ? "cupos-bajos" : ""}"><strong>Cupos disponibles:</strong> ${tour.cuposDisponibles} de ${tour.cupos}</p>
                <p class="precio">${dinero(tour.precio)} <small>por persona</small></p>
                <button type="button" class="boton" data-reservar="${tour.id}" ${yaPaso || agotado ? "disabled" : ""}>${textoBoton}</button>
            </div>
        </article>`;
}

function pintarTours() {
    const filtros = leerFiltros();
    const filtrados = ordenarTours(filtrarTours(tours, filtros), filtros.orden);
    resumen.textContent = `Mostrando ${filtrados.length} de ${tours.length} tours.`;
    if (tours.length === 0) {
        mostrarVacio(lista, "Todavía no hay tours publicados. Vuelve pronto.");
        return;
    }
    if (filtrados.length === 0) {
        mostrarVacio(lista, "Ningún tour coincide con tu búsqueda. Prueba con otro nombre o departamento.");
        return;
    }
    lista.innerHTML = `<div class="rejilla-tours">${filtrados.map(tarjetaTour).join("")}</div>`;
}

async function cargarTours() {
    mostrarCargando(lista, "Cargando tours...");
    resumen.textContent = "";
    try {
        const todos = await listarTours();
        tours = perfil?.rol === "admin" ? todos : todos.filter((tour) => tour.activo);
        pintarTours();
    } catch (error) {
        console.error(error);
        lista.innerHTML = `<div class="vacio">No se pudieron cargar los tours. ${escaparHTML(mensajeError(error))}<br><br><button type="button" class="boton boton-azul" id="reintentar">Reintentar</button></div>`;
        document.querySelector("#reintentar").addEventListener("click", cargarTours);
    }
}

function actualizarTotal() {
    const personas = Number(formularioReserva.personas.value);
    const valido = Number.isInteger(personas) && personas > 0;
    totalReserva.textContent = valido ? `Total: ${dinero(personas * tourSeleccionado.precio)}` : "Total: —";
}

function abrirReserva(id) {
    if (!perfil) {
        mostrarAviso("Inicia sesión para reservar.", "info");
        setTimeout(() => {
            window.location.href = "login.html?siguiente=index.html";
        }, 900);
        return;
    }
    tourSeleccionado = tours.find((tour) => tour.id === id);
    if (!tourSeleccionado) {
        return;
    }
    detalleReserva.innerHTML = `<strong>${escaparHTML(tourSeleccionado.titulo)}</strong><br>${fechaLarga(tourSeleccionado.fecha)} · ${dinero(tourSeleccionado.precio)} por persona · ${tourSeleccionado.cuposDisponibles} cupos disponibles`;
    formularioReserva.reset();
    mostrarErrores(formularioReserva, {});
    actualizarTotal();
    dialogo.showModal();
}

async function enviarReserva(evento) {
    evento.preventDefault();
    const personas = Number(formularioReserva.personas.value);
    const errores = validarReserva(personas, tourSeleccionado);
    mostrarErrores(formularioReserva, errores);
    if (!esValido(errores)) {
        return;
    }
    const boton = formularioReserva.querySelector("button[type=submit]");
    botonOcupado(boton, true, "Reservando...");
    try {
        await crearReserva(perfil, tourSeleccionado, personas);
        dialogo.close();
        mostrarAviso("Reserva enviada. Queda pendiente hasta que la confirmemos.", "exito");
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
    } finally {
        botonOcupado(boton, false);
    }
}

function iniciarEventos() {
    formularioFiltros.addEventListener("input", pintarTours);
    formularioFiltros.addEventListener("submit", (evento) => evento.preventDefault());
    lista.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-reservar]");
        if (boton) {
            abrirReserva(boton.dataset.reservar);
        }
    });
    formularioReserva.personas.addEventListener("input", actualizarTotal);
    formularioReserva.addEventListener("submit", enviarReserva);
    document.querySelector("#cancelar-dialogo").addEventListener("click", () => dialogo.close());
}

async function iniciar() {
    selectDepartamento.innerHTML += departamentos.map((d) => `<option value="${d}">${d}</option>`).join("");
    iniciarEventos();
    if (new URLSearchParams(window.location.search).get("aviso") === "sin-permiso") {
        mostrarAviso("Esa sección es solo para administradores.", "error");
    }
    mostrarCargando(lista, "Cargando tours...");
    perfil = await prepararPagina({ pagina: "catalogo" });
    await cargarTours();
}

iniciar();
