import { hoyISO } from "./formato.js";

const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const patronTelefono = /^[267]\d{3}-?\d{4}$/;
const patronNombre = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export const departamentos = [
    "Ahuachapán", "Santa Ana", "Sonsonate", "Chalatenango", "La Libertad", "San Salvador", "Cuscatlán",
    "Cabañas", "La Paz", "San Vicente", "Usulután", "San Miguel", "Morazán", "La Unión"
];

export const LIMITES = {
    cuposMinimos: 1,
    cuposMaximos: 50,
    personasMaximas: 10
};

export function esValido(errores) {
    return Object.keys(errores).length === 0;
}

export function validarRegistro({ nombre, correo, telefono, contrasena, confirmacion }) {
    const errores = {};
    if (nombre.length < 3 || !patronNombre.test(nombre)) {
        errores.nombre = "Escribe tu nombre completo, solo letras (mínimo 3).";
    }
    if (!patronCorreo.test(correo)) {
        errores.correo = "Escribe un correo válido, por ejemplo ana@gmail.com.";
    }
    if (!patronTelefono.test(telefono)) {
        errores.telefono = "Teléfono salvadoreño de 8 dígitos que empiece con 2, 6 o 7.";
    }
    if (contrasena.length < 6) {
        errores.contrasena = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (confirmacion !== contrasena) {
        errores.confirmacion = "Las contraseñas no coinciden.";
    }
    return errores;
}

export function validarLogin({ correo, contrasena }) {
    const errores = {};
    if (!patronCorreo.test(correo)) {
        errores.correo = "Escribe un correo válido.";
    }
    if (contrasena.length === 0) {
        errores.contrasena = "Escribe tu contraseña.";
    }
    return errores;
}

export function validarTour(datos, { esNuevo }) {
    const errores = {};
    if (datos.titulo.length < 3 || datos.titulo.length > 80) {
        errores.titulo = "El título debe tener entre 3 y 80 caracteres.";
    }
    if (!departamentos.includes(datos.departamento)) {
        errores.departamento = "Elige un departamento.";
    }
    if (datos.descripcion.length < 10 || datos.descripcion.length > 300) {
        errores.descripcion = "La descripción debe tener entre 10 y 300 caracteres.";
    }
    if (!datos.fecha) {
        errores.fecha = "Elige la fecha del tour.";
    } else if (esNuevo && datos.fecha <= hoyISO()) {
        errores.fecha = "La fecha debe ser posterior a hoy.";
    }
    if (datos.horario.length < 5) {
        errores.horario = "Escribe el horario, por ejemplo 7:00 a.m. a 5:00 p.m.";
    }
    if (datos.puntoSalida.length < 5) {
        errores.puntoSalida = "Escribe el punto de salida.";
    }
    if (!Number.isFinite(datos.precio) || datos.precio <= 0 || datos.precio > 500) {
        errores.precio = "El precio debe ser mayor que $0 y como máximo $500.";
    }
    if (!Number.isInteger(datos.cupos) || datos.cupos < LIMITES.cuposMinimos || datos.cupos > LIMITES.cuposMaximos) {
        errores.cupos = `Los cupos deben ser un número entero entre ${LIMITES.cuposMinimos} y ${LIMITES.cuposMaximos}.`;
    }
    if (!/^https:\/\/.+/.test(datos.imagen)) {
        errores.imagen = "Pega la dirección de una imagen que empiece con https://";
    }
    return errores;
}

export function validarReserva(personas, tour) {
    const errores = {};
    if (!Number.isInteger(personas) || personas < 1 || personas > LIMITES.personasMaximas) {
        errores.personas = `Reserva entre 1 y ${LIMITES.personasMaximas} personas.`;
    } else if (personas > tour.cuposDisponibles) {
        errores.personas = `Solo quedan ${tour.cuposDisponibles} cupos disponibles.`;
    }
    if (!tour.activo) {
        errores.personas = "Este tour ya no está disponible.";
    }
    if (tour.fecha <= hoyISO()) {
        errores.personas = "Este tour ya se realizó; no se puede reservar.";
    }
    return errores;
}
