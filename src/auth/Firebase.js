import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDoeIFDMxeDuNYkLgacv9g6rjkamO-f-iA",
    authDomain: "diary-mark1.firebaseapp.com",
    projectId: "diary-mark1",
    storageBucket: "diary-mark1.appspot.com",
    messagingSenderId: "459437541041",
    appId: "1:459437541041:web:f3bd9319d2fe08721f0490",
    measurementId: "G-DP6R43RY2S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;