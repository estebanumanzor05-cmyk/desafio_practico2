import { prepararPagina, mostrarErrores, mostrarAviso, botonOcupado, mensajeError } from "../ui/comun.js";
import { registrarUsuario } from "../servicios/auth.js";
import { validarRegistro, esValido } from "../utils/validaciones.js";

const formulario = document.querySelector("#formulario-registro");
let registrando = false;

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = {
        nombre: formulario.nombre.value.trim(),
        correo: formulario.correo.value.trim().toLowerCase(),
        telefono: formulario.telefono.value.trim(),
        contrasena: formulario.contrasena.value,
        confirmacion: formulario.confirmacion.value
    };
    const errores = validarRegistro(datos);
    mostrarErrores(formulario, errores);
    if (!esValido(errores)) {
        return;
    }
    const boton = formulario.querySelector("button[type=submit]");
    botonOcupado(boton, true, "Creando cuenta...");
    registrando = true;
    try {
        await registrarUsuario(datos);
        mostrarAviso("Cuenta creada. ¡Bienvenido!", "exito");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);
    } catch (error) {
        console.error(error);
        registrando = false;
        mostrarAviso(mensajeError(error), "error");
        botonOcupado(boton, false);
    }
});

prepararPagina({ pagina: "registro" }).then((perfil) => {
    if (perfil && !registrando) {
        window.location.href = "index.html";
    }
});
