import { hoyISO } from "./formato.js";

function normalizar(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function filtrarTours(tours, { texto = "", departamento = "", soloDisponibles = false }) {
    const buscado = normalizar(texto.trim());
    const hoy = hoyISO();
    return tours.filter((tour) => {
        const coincideTexto = buscado === "" || normalizar(`${tour.titulo} ${tour.departamento}`).includes(buscado);
        const coincideDepartamento = departamento === "" || tour.departamento === departamento;
        const estaDisponible = !soloDisponibles || (tour.activo && tour.cuposDisponibles > 0 && tour.fecha > hoy);
        return coincideTexto && coincideDepartamento && estaDisponible;
    });
}

export function ordenarTours(tours, criterio) {
    const copia = [...tours];
    const comparadores = {
        "fecha": (a, b) => a.fecha.localeCompare(b.fecha),
        "precio-asc": (a, b) => a.precio - b.precio,
        "precio-desc": (a, b) => b.precio - a.precio,
        "cupos": (a, b) => b.cuposDisponibles - a.cuposDisponibles
    };
    return copia.sort(comparadores[criterio] ?? comparadores.fecha);
}

export function ordenarReservasRecientes(reservas) {
    return [...reservas].sort((a, b) => (b.creada?.toMillis?.() ?? 0) - (a.creada?.toMillis?.() ?? 0));
}

export function filtrarPorEstado(reservas, estado) {
    if (estado === "") {
        return reservas;
    }
    return reservas.filter((reserva) => reserva.estado === estado);
}

export function contarPorEstado(reservas) {
    const conteo = { pendiente: 0, confirmada: 0, rechazada: 0, cancelada: 0 };
    reservas.forEach((reserva) => {
        conteo[reserva.estado] = (conteo[reserva.estado] ?? 0) + 1;
    });
    return conteo;
}

export function calcularIndicadores(reservas, tours) {
    const confirmadas = reservas.filter((reserva) => reserva.estado === "confirmada");
    const ingresos = confirmadas.reduce((suma, reserva) => suma + reserva.total, 0);
    const personas = confirmadas.reduce((suma, reserva) => suma + reserva.personas, 0);
    const ocupacion = tours
        .map((tour) => {
            const ocupados = tour.cupos - tour.cuposDisponibles;
            return {
                titulo: tour.titulo,
                ocupados,
                cupos: tour.cupos,
                porcentaje: tour.cupos > 0 ? Math.round((ocupados / tour.cupos) * 100) : 0
            };
        })
        .filter((fila) => fila.ocupados > 0)
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 8);
    return {
        totalReservas: reservas.length,
        porEstado: contarPorEstado(reservas),
        ingresos,
        personas,
        ocupacion
    };
}
