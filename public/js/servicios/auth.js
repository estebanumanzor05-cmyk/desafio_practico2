import { auth, db } from "../firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function registrarUsuario({ nombre, correo, telefono, contrasena }) {
    const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);
    await updateProfile(credencial.user, { displayName: nombre });
    await setDoc(doc(db, "usuarios", credencial.user.uid), {
        nombre,
        correo,
        telefono,
        rol: "cliente",
        creado: serverTimestamp()
    });
    return credencial.user;
}

export async function iniciarSesion(correo, contrasena) {
    const credencial = await signInWithEmailAndPassword(auth, correo, contrasena);
    return credencial.user;
}

export async function cerrarSesion() {
    await signOut(auth);
}

export async function obtenerPerfil(uid) {
    const documento = await getDoc(doc(db, "usuarios", uid));
    if (!documento.exists()) {
        return null;
    }
    return { uid, ...documento.data() };
}

export function observarSesion(callback) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            callback(null);
            return;
        }
        try {
            const perfil = await obtenerPerfil(usuario.uid);
            callback(perfil ?? { uid: usuario.uid, nombre: usuario.displayName ?? usuario.email, correo: usuario.email, rol: "cliente" });
        } catch (error) {
            console.error(error);
            callback({ uid: usuario.uid, nombre: usuario.displayName ?? usuario.email, correo: usuario.email, rol: "cliente" });
        }
    });
}
