import { prepararPagina, mostrarAviso, mostrarCargando, mostrarVacio, mostrarErrores, botonOcupado, mensajeError } from "../ui/comun.js";
import { listarTours, crearTour, actualizarTour, cambiarActivo, eliminarTour } from "../servicios/tours.js";
import { listarTodasLasReservas, confirmarReserva, rechazarReserva } from "../servicios/reservas.js";
import { cargarDatosIniciales } from "../servicios/datos-iniciales.js";
import { ordenarTours, filtrarPorEstado, ordenarReservasRecientes, calcularIndicadores } from "../utils/procesamiento.js";
import { validarTour, esValido, departamentos } from "../utils/validaciones.js";
import { dinero, fechaLarga, fechaDeTimestamp, escaparHTML } from "../utils/formato.js";

const formularioTour = document.querySelector("#formulario-tour");
const tituloFormulario = document.querySelector("#titulo-formulario-tour");
const botonCancelarEdicion = document.querySelector("#cancelar-edicion");
const tablaTours = document.querySelector("#tabla-tours");
const tablaReservas = document.querySelector("#tabla-reservas");
const filtroReservas = document.querySelector("#filtro-reservas");
const contenidoIndicadores = document.querySelector("#contenido-indicadores");

let tours = [];
let reservas = [];
let idEnEdicion = null;

function cambiarPestana(nombre) {
    ["tours", "reservas", "indicadores"].forEach((p) => {
        const activa = p === nombre;
        document.querySelector(`#pestana-${p}`).setAttribute("aria-selected", String(activa));
        document.querySelector(`#panel-${p}`).classList.toggle("oculto", !activa);
    });
    if (nombre === "indicadores") {
        pintarIndicadores();
    }
}

function leerFormularioTour() {
    return {
        titulo: formularioTour.titulo.value.trim(),
        departamento: formularioTour.departamento.value,
        descripcion: formularioTour.descripcion.value.trim(),
        fecha: formularioTour.fecha.value,
        horario: formularioTour.horario.value.trim(),
        puntoSalida: formularioTour.puntoSalida.value.trim(),
        precio: Number(formularioTour.precio.value),
        cupos: Number(formularioTour.cupos.value),
        imagen: formularioTour.imagen.value.trim(),
        activo: formularioTour.activo.checked
    };
}

function limpiarFormulario() {
    idEnEdicion = null;
    formularioTour.reset();
    mostrarErrores(formularioTour, {});
    tituloFormulario.textContent = "Nuevo tour";
    botonCancelarEdicion.classList.add("oculto");
}

function editarTour(id) {
    const tour = tours.find((t) => t.id === id);
    idEnEdicion = id;
    ["titulo", "departamento", "descripcion", "fecha", "horario", "puntoSalida", "precio", "cupos", "imagen"].forEach((campo) => {
        formularioTour[campo].value = tour[campo];
    });
    formularioTour.activo.checked = tour.activo;
    mostrarErrores(formularioTour, {});
    tituloFormulario.textContent = `Editar: ${tour.titulo}`;
    botonCancelarEdicion.classList.remove("oculto");
    formularioTour.scrollIntoView({ behavior: "smooth" });
    formularioTour.titulo.focus();
}

async function guardarTour(evento) {
    evento.preventDefault();
    const datos = leerFormularioTour();
    const errores = validarTour(datos, { esNuevo: idEnEdicion === null });
    mostrarErrores(formularioTour, errores);
    if (!esValido(errores)) {
        return;
    }
    const boton = document.querySelector("#guardar-tour");
    botonOcupado(boton, true, "Guardando...");
    try {
        if (idEnEdicion) {
            await actualizarTour(idEnEdicion, datos);
            mostrarAviso("Tour actualizado.", "exito");
        } else {
            await crearTour(datos);
            mostrarAviso("Tour creado.", "exito");
        }
        limpiarFormulario();
        await cargarDatos();
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
    } finally {
        botonOcupado(boton, false);
    }
}

function pintarTablaTours() {
    if (tours.length === 0) {
        mostrarVacio(tablaTours, "No hay tours registrados. Crea uno con el formulario o carga los datos iniciales.");
        return;
    }
    const filas = ordenarTours(tours, "fecha").map((tour) => `
        <tr>
            <td>${escaparHTML(tour.titulo)}</td>
            <td>${escaparHTML(tour.departamento)}</td>
            <td>${fechaLarga(tour.fecha)}</td>
            <td>${dinero(tour.precio)}</td>
            <td>${tour.cuposDisponibles} / ${tour.cupos}</td>
            <td><span class="estado estado-${tour.activo ? "activo" : "inactivo"}">${tour.activo ? "activo" : "inactivo"}</span></td>
            <td class="celda-acciones">
                <button type="button" class="boton boton-azul boton-pequeno" data-accion="editar" data-id="${tour.id}">Editar</button>
                <button type="button" class="boton boton-borde boton-pequeno" data-accion="activar" data-id="${tour.id}">${tour.activo ? "Desactivar" : "Activar"}</button>
                <button type="button" class="boton boton-peligro boton-pequeno" data-accion="eliminar" data-id="${tour.id}">Eliminar</button>
            </td>
        </tr>`).join("");
    tablaTours.innerHTML = `
        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr><th>Tour</th><th>Departamento</th><th>Fecha</th><th>Precio</th><th>Cupos</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;
}

async function accionTour(evento) {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) {
        return;
    }
    const { accion, id } = boton.dataset;
    const tour = tours.find((t) => t.id === id);
    if (accion === "editar") {
        editarTour(id);
        return;
    }
    if (accion === "eliminar" && !confirm(`¿Eliminar "${tour.titulo}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    boton.disabled = true;
    try {
        if (accion === "activar") {
            await cambiarActivo(id, !tour.activo);
            mostrarAviso(tour.activo ? "Tour desactivado." : "Tour activado.", "exito");
        } else if (accion === "eliminar") {
            await eliminarTour(id);
            mostrarAviso("Tour eliminado.", "exito");
            if (idEnEdicion === id) {
                limpiarFormulario();
            }
        }
        await cargarDatos();
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
        boton.disabled = false;
    }
}

function pintarTablaReservas() {
    const visibles = ordenarReservasRecientes(filtrarPorEstado(reservas, filtroReservas.value));
    if (visibles.length === 0) {
        mostrarVacio(tablaReservas, reservas.length === 0 ? "Todavía no hay reservas." : "No hay reservas con ese estado.");
        return;
    }
    const filas = visibles.map((reserva) => `
        <tr>
            <td>${escaparHTML(reserva.nombreCliente)}<br><small>${escaparHTML(reserva.correoCliente)}</small></td>
            <td>${escaparHTML(reserva.tourTitulo)}<br><small>${fechaLarga(reserva.tourFecha)}</small></td>
            <td>${reserva.personas}</td>
            <td>${dinero(reserva.total)}</td>
            <td>${fechaDeTimestamp(reserva.creada)}</td>
            <td><span class="estado estado-${reserva.estado}">${reserva.estado}</span></td>
            <td class="celda-acciones">${reserva.estado === "pendiente" ? `
                <button type="button" class="boton boton-azul boton-pequeno" data-reserva="confirmar" data-id="${reserva.id}">Confirmar</button>
                <button type="button" class="boton boton-peligro boton-pequeno" data-reserva="rechazar" data-id="${reserva.id}">Rechazar</button>` : "—"}
            </td>
        </tr>`).join("");
    tablaReservas.innerHTML = `
        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr><th>Cliente</th><th>Tour</th><th>Personas</th><th>Total</th><th>Creada</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;
}

async function accionReserva(evento) {
    const boton = evento.target.closest("[data-reserva]");
    if (!boton) {
        return;
    }
    const { reserva: accion, id } = boton.dataset;
    boton.disabled = true;
    boton.textContent = accion === "confirmar" ? "Confirmando..." : "Rechazando...";
    try {
        if (accion === "confirmar") {
            await confirmarReserva(id);
            mostrarAviso("Reserva confirmada y cupos descontados.", "exito");
        } else {
            await rechazarReserva(id);
            mostrarAviso("Reserva rechazada.", "exito");
        }
        await cargarDatos();
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
        await cargarDatos();
    }
}

function pintarIndicadores() {
    if (reservas.length === 0 && tours.length === 0) {
        mostrarVacio(contenidoIndicadores, "No hay datos suficientes para calcular indicadores.");
        return;
    }
    const datos = calcularIndicadores(reservas, tours);
    const barras = datos.ocupacion.length === 0
        ? `<div class="vacio">Ningún tour tiene cupos confirmados todavía.</div>`
        : `<div class="barras">${datos.ocupacion.map((fila) => `
            <div class="barra-fila">
                <span>${escaparHTML(fila.titulo)}</span>
                <div class="barra-fondo" role="img" aria-label="${fila.porcentaje}% ocupado"><div class="barra-relleno" style="width: ${fila.porcentaje}%"></div></div>
                <strong>${fila.porcentaje}%</strong>
            </div>`).join("")}</div>`;
    contenidoIndicadores.innerHTML = `
        <div class="indicadores">
            <div class="indicador"><p>Reservas totales</p><strong>${datos.totalReservas}</strong></div>
            <div class="indicador"><p>Pendientes por revisar</p><strong>${datos.porEstado.pendiente}</strong></div>
            <div class="indicador"><p>Personas confirmadas</p><strong>${datos.personas}</strong></div>
            <div class="indicador"><p>Ingresos confirmados</p><strong>${dinero(datos.ingresos)}</strong></div>
        </div>
        <h2>Reservas por estado</h2>
        <p>Confirmadas: ${datos.porEstado.confirmada} · Pendientes: ${datos.porEstado.pendiente} · Rechazadas: ${datos.porEstado.rechazada} · Canceladas: ${datos.porEstado.cancelada}</p>
        <h2>Ocupación de los tours más vendidos</h2>
        ${barras}`;
}

async function cargarDatos() {
    try {
        [tours, reservas] = await Promise.all([listarTours(), listarTodasLasReservas()]);
        pintarTablaTours();
        pintarTablaReservas();
        if (!document.querySelector("#panel-indicadores").classList.contains("oculto")) {
            pintarIndicadores();
        }
    } catch (error) {
        console.error(error);
        mostrarVacio(tablaTours, `No se pudieron cargar los datos. ${mensajeError(error)}`);
        mostrarVacio(tablaReservas, `No se pudieron cargar los datos. ${mensajeError(error)}`);
    }
}

async function sembrarDatos(evento) {
    if (!confirm("Se cargarán 28 tours y reservas de ejemplo para los clientes registrados. ¿Continuar?")) {
        return;
    }
    const boton = evento.currentTarget;
    botonOcupado(boton, true, "Cargando datos...");
    try {
        const resultado = await cargarDatosIniciales();
        const nota = resultado.clientes === 0 ? " No hay clientes registrados, así que no se crearon reservas." : "";
        mostrarAviso(`Se cargaron ${resultado.tours} tours y ${resultado.reservas} reservas.${nota}`, "exito");
        await cargarDatos();
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
    } finally {
        botonOcupado(boton, false);
    }
}

async function iniciar() {
    document.querySelector("#departamento-tour").innerHTML += departamentos.map((d) => `<option value="${d}">${d}</option>`).join("");
    ["tours", "reservas", "indicadores"].forEach((p) => {
        document.querySelector(`#pestana-${p}`).addEventListener("click", () => cambiarPestana(p));
    });
    formularioTour.addEventListener("submit", guardarTour);
    botonCancelarEdicion.addEventListener("click", limpiarFormulario);
    tablaTours.addEventListener("click", accionTour);
    tablaReservas.addEventListener("click", accionReserva);
    filtroReservas.addEventListener("change", pintarTablaReservas);
    document.querySelector("#cargar-datos").addEventListener("click", sembrarDatos);

    mostrarCargando(tablaTours, "Cargando tours...");
    mostrarCargando(tablaReservas, "Cargando reservas...");
    await prepararPagina({ pagina: "admin", requiereAdmin: true });
    await cargarDatos();
}

iniciar();
