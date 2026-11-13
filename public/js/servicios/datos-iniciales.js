import { db } from "../firebase.js";
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    limit,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { toursIniciales } from "../datos/tours-iniciales.js";
import { fechaDentroDe } from "../utils/formato.js";

const estadosEjemplo = ["pendiente", "confirmada", "pendiente", "confirmada", "rechazada", "cancelada", "pendiente", "confirmada", "pendiente", "confirmada"];
const personasEjemplo = [2, 4, 1, 3, 2, 2, 5, 2, 3, 1];

export async function cargarDatosIniciales() {
    const existentes = await getDocs(query(collection(db, "tours"), limit(1)));
    if (!existentes.empty) {
        throw new Error("Ya hay tours en la base de datos. Los datos iniciales solo se cargan una vez.");
    }

    const clientes = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "cliente")));
    const listaClientes = clientes.docs.map((c) => ({ uid: c.id, ...c.data() }));

    const tours = toursIniciales.map((t) => {
        const { diasDesdeHoy, ...resto } = t;
        return {
            ref: doc(collection(db, "tours")),
            datos: {
                ...resto,
                fecha: fechaDentroDe(diasDesdeHoy),
                cuposDisponibles: t.cupos,
                activo: true,
                actualizado: serverTimestamp()
            }
        };
    });

    const reservas = [];
    if (listaClientes.length > 0) {
        estadosEjemplo.forEach((estado, i) => {
            const tour = tours[i];
            const cliente = listaClientes[i % listaClientes.length];
            const personas = personasEjemplo[i];
            if (estado === "confirmada") {
                tour.datos.cuposDisponibles -= personas;
            }
            reservas.push({
                uid: cliente.uid,
                nombreCliente: cliente.nombre,
                correoCliente: cliente.correo,
                tourId: tour.ref.id,
                tourTitulo: tour.datos.titulo,
                tourFecha: tour.datos.fecha,
                personas,
                precioUnitario: tour.datos.precio,
                total: tour.datos.precio * personas,
                estado,
                creada: serverTimestamp()
            });
        });
    }

    const lote = writeBatch(db);
    tours.forEach((t) => lote.set(t.ref, t.datos));
    reservas.forEach((r) => lote.set(doc(collection(db, "reservas")), r));
    await lote.commit();

    return { tours: tours.length, reservas: reservas.length, clientes: listaClientes.length };
}
