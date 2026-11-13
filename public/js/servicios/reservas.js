import { db } from "../firebase.js";
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const reservasRef = collection(db, "reservas");

function aReserva(documento) {
    return { id: documento.id, ...documento.data() };
}

export async function crearReserva(perfil, tour, personas) {
    const reserva = {
        uid: perfil.uid,
        nombreCliente: perfil.nombre,
        correoCliente: perfil.correo,
        tourId: tour.id,
        tourTitulo: tour.titulo,
        tourFecha: tour.fecha,
        personas,
        precioUnitario: tour.precio,
        total: tour.precio * personas,
        estado: "pendiente",
        creada: serverTimestamp()
    };
    const referencia = await addDoc(reservasRef, reserva);
    return referencia.id;
}

export async function listarMisReservas(uid) {
    const consulta = query(reservasRef, where("uid", "==", uid));
    const resultado = await getDocs(consulta);
    return resultado.docs.map(aReserva);
}

export async function listarTodasLasReservas() {
    const resultado = await getDocs(reservasRef);
    return resultado.docs.map(aReserva);
}

export async function cancelarReserva(id) {
    await updateDoc(doc(db, "reservas", id), {
        estado: "cancelada",
        actualizada: serverTimestamp()
    });
}

export async function rechazarReserva(id) {
    await updateDoc(doc(db, "reservas", id), {
        estado: "rechazada",
        actualizada: serverTimestamp()
    });
}

export async function confirmarReserva(id) {
    const reservaRef = doc(db, "reservas", id);
    await runTransaction(db, async (transaccion) => {
        const reserva = await transaccion.get(reservaRef);
        if (!reserva.exists()) {
            throw new Error("La reserva ya no existe.");
        }
        const datos = reserva.data();
        if (datos.estado !== "pendiente") {
            throw new Error("Solo se pueden confirmar reservas pendientes.");
        }
        const tourRef = doc(db, "tours", datos.tourId);
        const tour = await transaccion.get(tourRef);
        if (!tour.exists()) {
            throw new Error("El tour de esta reserva ya no existe.");
        }
        const disponibles = tour.data().cuposDisponibles;
        if (datos.personas > disponibles) {
            throw new Error(`Solo quedan ${disponibles} cupos en este tour.`);
        }
        transaccion.update(tourRef, {
            cuposDisponibles: disponibles - datos.personas,
            actualizado: serverTimestamp()
        });
        transaccion.update(reservaRef, {
            estado: "confirmada",
            actualizada: serverTimestamp()
        });
    });
}
