import { observarSesion, cerrarSesion } from "../servicios/auth.js";
import { escaparHTML } from "../utils/formato.js";

const mensajesFirebase = {
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Inicia sesión.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e intenta de nuevo.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
    "permission-denied": "No tienes permiso para realizar esta operación.",
    "unavailable": "El servicio no está disponible. Revisa tu conexión."
};

export function mensajeError(error) {
    return mensajesFirebase[error?.code] ?? error?.message ?? "Ocurrió un error inesperado.";
}

export function mostrarAviso(mensaje, tipo = "info") {
    let contenedor = document.querySelector(".avisos");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.className = "avisos";
        contenedor.setAttribute("aria-live", "polite");
        document.body.append(contenedor);
    }
    const aviso = document.createElement("div");
    aviso.className = `aviso aviso-${tipo}`;
    aviso.setAttribute("role", tipo === "error" ? "alert" : "status");
    aviso.textContent = mensaje;
    contenedor.append(aviso);
    setTimeout(() => aviso.remove(), 4500);
}

export function mostrarCargando(contenedor, texto = "Cargando...") {
    contenedor.innerHTML = `<div class="cargando" role="status">${escaparHTML(texto)}</div>`;
}

export function mostrarVacio(contenedor, texto) {
    contenedor.innerHTML = `<div class="vacio">${escaparHTML(texto)}</div>`;
}

export function mostrarErrores(formulario, errores) {
    formulario.querySelectorAll(".error-campo").forEach((span) => {
        span.textContent = "";
    });
    formulario.querySelectorAll("[aria-invalid]").forEach((campo) => {
        campo.removeAttribute("aria-invalid");
    });
    Object.entries(errores).forEach(([nombre, mensaje]) => {
        const campo = formulario.elements[nombre];
        const span = formulario.querySelector(`#error-${nombre}`);
        if (campo) {
            campo.setAttribute("aria-invalid", "true");
        }
        if (span) {
            span.textContent = mensaje;
        }
    });
    const primero = Object.keys(errores)[0];
    if (primero && formulario.elements[primero]) {
        formulario.elements[primero].focus();
    }
}

export function botonOcupado(boton, ocupado, texto) {
    if (ocupado) {
        boton.dataset.textoOriginal = boton.textContent;
        boton.textContent = texto;
        boton.disabled = true;
    } else {
        boton.textContent = boton.dataset.textoOriginal ?? boton.textContent;
        boton.disabled = false;
    }
}

function pintarMenu(perfil, paginaActiva) {
    const menu = document.querySelector("#menu-principal");
    const enlaces = [{ href: "index.html", texto: "Tours", clave: "catalogo" }];
    if (perfil) {
        enlaces.push({ href: "mis-reservas.html", texto: "Mis reservas", clave: "mis-reservas" });
    }
    if (perfil?.rol === "admin") {
        enlaces.push({ href: "admin.html", texto: "Administración", clave: "admin" });
    }
    let html = enlaces
        .map((e) => `<li><a href="${e.href}"${e.clave === paginaActiva ? ' class="activo" aria-current="page"' : ""}>${e.texto}</a></li>`)
        .join("");
    if (perfil) {
        html += `<li class="saludo">Hola, ${escaparHTML(perfil.nombre.split(" ")[0])}</li>`;
        html += `<li><button type="button" class="enlace-boton" id="boton-salir">Cerrar sesión</button></li>`;
    } else {
        html += `<li><a href="login.html"${paginaActiva === "login" ? ' class="activo"' : ""}>Iniciar sesión</a></li>`;
        html += `<li><a href="registro.html"${paginaActiva === "registro" ? ' class="activo"' : ""}>Registrarse</a></li>`;
    }
    menu.innerHTML = html;

    const salir = document.querySelector("#boton-salir");
    if (salir) {
        salir.addEventListener("click", async () => {
            try {
                await cerrarSesion();
                window.location.href = "index.html";
            } catch (error) {
                mostrarAviso(mensajeError(error), "error");
            }
        });
    }
}

export function prepararPagina({ pagina, requiereSesion = false, requiereAdmin = false }) {
    return new Promise((resolver) => {
        let primeraVez = true;
        observarSesion((perfil) => {
            pintarMenu(perfil, pagina);
            if (!primeraVez) {
                return;
            }
            primeraVez = false;
            if ((requiereSesion || requiereAdmin) && !perfil) {
                window.location.href = `login.html?siguiente=${encodeURIComponent(window.location.pathname.split("/").pop())}`;
                return;
            }
            if (requiereAdmin && perfil.rol !== "admin") {
                window.location.href = "index.html?aviso=sin-permiso";
                return;
            }
            resolver(perfil);
        });
    });
}
