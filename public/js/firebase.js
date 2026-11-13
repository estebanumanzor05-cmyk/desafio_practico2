import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDx0nfmGnNW-q3ecZmkhu_rzvS8Nnzut3k",
    authDomain: "sivar-tours-reservas.firebaseapp.com",
    projectId: "sivar-tours-reservas",
    storageBucket: "sivar-tours-reservas.firebasestorage.app",
    messagingSenderId: "229617808971",
    appId: "1:229617808971:web:e2b7c0896446dad2487fce"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
