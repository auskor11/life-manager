import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
}
from "./firebase.js";

import {
    setPersistence,
    browserLocalPersistence
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


async function signup() {

    let email =
    document.getElementById("email").value.trim();

    let password =
    document.getElementById("password").value;

    let message =
    document.getElementById("message");

    try {

        await setPersistence(
            auth,
            browserLocalPersistence
        );

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        location.href =
        "index.html";

    }

    catch(error){

        message.textContent =
        error.message;

    }

}



async function login() {

    let email =
    document.getElementById("email").value.trim();

    let password =
    document.getElementById("password").value;

    let message =
    document.getElementById("message");

    try {

        await setPersistence(
            auth,
            browserLocalPersistence
        );

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        location.href =
        "index.html";

    }

    catch(error){

        message.textContent =
        error.message;

    }

}


window.login =
login;

window.signup =
signup;