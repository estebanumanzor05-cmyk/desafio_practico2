import { prepararPagina, mostrarAviso, mostrarCargando, mostrarVacio, mensajeError } from "../ui/comun.js";
import { listarMisReservas, cancelarReserva } from "../servicios/reservas.js";
import { filtrarPorEstado, ordenarReservasRecientes } from "../utils/procesamiento.js";
import { dinero, fechaLarga, fechaDeTimestamp, escaparHTML } from "../utils/formato.js";

const lista = document.querySelector("#lista-reservas");
const filtroEstado = document.querySelector("#filtro-estado");

let perfil = null;
let reservas = [];

function tarjetaReserva(reserva) {
    const puedeCancelar = reserva.estado === "pendiente";
    return `
        <article class="reserva">
            <div>
                <h3>${escaparHTML(reserva.tourTitulo)}</h3>
                <p><strong>Fecha del tour:</strong> ${fechaLarga(reserva.tourFecha)}</p>
                <p><strong>Personas:</strong> ${reserva.personas} · <strong>Total:</strong> ${dinero(reserva.total)}</p>
                <p><strong>Reservada:</strong> ${fechaDeTimestamp(reserva.creada)}</p>
            </div>
            <div>
                <span class="estado estado-${reserva.estado}">${reserva.estado}</span>
                ${puedeCancelar ? `<p><button type="button" class="boton boton-peligro boton-pequeno" data-cancelar="${reserva.id}">Cancelar reserva</button></p>` : ""}
            </div>
        </article>`;
}

function pintarReservas() {
    if (reservas.length === 0) {
        lista.innerHTML = `<div class="vacio">Aún no tienes reservas.<br><br><a class="boton boton-azul" href="index.html">Ver tours</a></div>`;
        return;
    }
    const visibles = ordenarReservasRecientes(filtrarPorEstado(reservas, filtroEstado.value));
    if (visibles.length === 0) {
        mostrarVacio(lista, "No tienes reservas con ese estado.");
        return;
    }
    lista.innerHTML = `<div class="lista-reservas">${visibles.map(tarjetaReserva).join("")}</div>`;
}

async function cargarReservas() {
    mostrarCargando(lista, "Cargando tus reservas...");
    try {
        reservas = await listarMisReservas(perfil.uid);
        pintarReservas();
    } catch (error) {
        console.error(error);
        mostrarVacio(lista, `No se pudieron cargar tus reservas. ${mensajeError(error)}`);
    }
}

lista.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-cancelar]");
    if (!boton) {
        return;
    }
    if (!confirm("¿Seguro que quieres cancelar esta reserva?")) {
        return;
    }
    boton.disabled = true;
    boton.textContent = "Cancelando...";
    try {
        await cancelarReserva(boton.dataset.cancelar);
        const reserva = reservas.find((r) => r.id === boton.dataset.cancelar);
        reserva.estado = "cancelada";
        pintarReservas();
        mostrarAviso("Reserva cancelada.", "exito");
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
        boton.disabled = false;
        boton.textContent = "Cancelar reserva";
    }
});

filtroEstado.addEventListener("change", pintarReservas);

async function iniciar() {
    mostrarCargando(lista, "Cargando tus reservas...");
    perfil = await prepararPagina({ pagina: "mis-reservas", requiereSesion: true });
    await cargarReservas();
}

iniciar();
