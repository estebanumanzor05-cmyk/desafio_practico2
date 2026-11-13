const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function dinero(valor) {
    return `$${Number(valor).toFixed(2)}`;
}

export function hoyISO() {
    const hoy = new Date();
    return aISO(hoy);
}

export function aISO(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

export function fechaDentroDe(cantidadDias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + cantidadDias);
    return aISO(fecha);
}

export function fechaLarga(iso) {
    if (!iso) {
        return "";
    }
    const [anio, mes, dia] = iso.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return `${dias[fecha.getDay()]} ${dia} de ${meses[mes - 1]} de ${anio}`;
}

export function fechaDeTimestamp(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "";
    }
    const fecha = timestamp.toDate();
    return `${fecha.getDate()} de ${meses[fecha.getMonth()]}, ${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}

export function escaparHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
