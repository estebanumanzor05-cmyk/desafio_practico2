import { db } from "../firebase.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    query,
    where,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const toursRef = collection(db, "tours");

function aTour(documento) {
    return { id: documento.id, ...documento.data() };
}

export async function listarTours() {
    const resultado = await getDocs(toursRef);
    return resultado.docs.map(aTour);
}

export async function obtenerTour(id) {
    const documento = await getDoc(doc(db, "tours", id));
    if (!documento.exists()) {
        throw new Error("El tour ya no existe.");
    }
    return aTour(documento);
}

export async function crearTour(datos) {
    const nuevo = {
        ...datos,
        cuposDisponibles: datos.cupos,
        actualizado: serverTimestamp()
    };
    const referencia = await addDoc(toursRef, nuevo);
    return referencia.id;
}

export async function actualizarTour(id, datos) {
    const tourRef = doc(db, "tours", id);
    await runTransaction(db, async (transaccion) => {
        const actual = await transaccion.get(tourRef);
        if (!actual.exists()) {
            throw new Error("El tour ya no existe.");
        }
        const reservados = actual.data().cupos - actual.data().cuposDisponibles;
        if (datos.cupos < reservados) {
            throw new Error(`Ya hay ${reservados} cupos confirmados; los cupos no pueden ser menos.`);
        }
        transaccion.update(tourRef, {
            ...datos,
            cuposDisponibles: datos.cupos - reservados,
            actualizado: serverTimestamp()
        });
    });
}

export async function cambiarActivo(id, activo) {
    await updateDoc(doc(db, "tours", id), { activo, actualizado: serverTimestamp() });
}

export async function eliminarTour(id) {
    const consulta = query(collection(db, "reservas"), where("tourId", "==", id));
    const reservas = await getDocs(consulta);
    const activas = reservas.docs.filter((r) => ["pendiente", "confirmada"].includes(r.data().estado));
    if (activas.length > 0) {
        throw new Error(`El tour tiene ${activas.length} reserva(s) pendiente(s) o confirmada(s). Desactívalo en lugar de eliminarlo.`);
    }
    await deleteDoc(doc(db, "tours", id));
}
