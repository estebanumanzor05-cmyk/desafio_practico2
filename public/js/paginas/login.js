import { prepararPagina, mostrarErrores, mostrarAviso, botonOcupado, mensajeError } from "../ui/comun.js";
import { iniciarSesion } from "../servicios/auth.js";
import { validarLogin, esValido } from "../utils/validaciones.js";

const formulario = document.querySelector("#formulario-login");

function destino() {
    const siguiente = new URLSearchParams(window.location.search).get("siguiente");
    const permitidos = ["index.html", "mis-reservas.html", "admin.html"];
    return permitidos.includes(siguiente) ? siguiente : "index.html";
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = {
        correo: formulario.correo.value.trim(),
        contrasena: formulario.contrasena.value
    };
    const errores = validarLogin(datos);
    mostrarErrores(formulario, errores);
    if (!esValido(errores)) {
        return;
    }
    const boton = formulario.querySelector("button[type=submit]");
    botonOcupado(boton, true, "Entrando...");
    try {
        await iniciarSesion(datos.correo, datos.contrasena);
        mostrarAviso("Sesión iniciada.", "exito");
        window.location.href = destino();
    } catch (error) {
        console.error(error);
        mostrarAviso(mensajeError(error), "error");
        botonOcupado(boton, false);
    }
});

prepararPagina({ pagina: "login" }).then((perfil) => {
    if (perfil) {
        window.location.href = destino();
    }
});
