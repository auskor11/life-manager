import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
updateDoc,
doc,
onSnapshot
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,

setPersistence,
browserLocalPersistence

}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig={

apiKey:"AIzaSyBCjNX2HK9uVceNo45Rlz8BEdopEdfGywc",
authDomain:"life-manager-bc946.firebaseapp.com",
projectId:"life-manager-bc946",
storageBucket:"life-manager-bc946.firebasestorage.app",
messagingSenderId:"34003745825",
appId:"1:34003745825:web:3cd47fe81401946f907760"

};

const app=initializeApp(firebaseConfig);

const db=getFirestore(app);

const auth=getAuth(app);

export{

db,
auth,

collection,
addDoc,
getDocs,
deleteDoc,
updateDoc,
doc,
onSnapshot,

createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,
setPersistence,
browserLocalPersistence

};