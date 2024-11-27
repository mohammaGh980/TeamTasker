const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyDKlCH_ZS3sUL-znKGxmc1_qEabI7vSwMs",
    authDomain: "tracktime-app-4b4ce.firebaseapp.com",
    projectId: "tracktime-app-4b4ce",
    storageBucket: "tracktime-app-4b4ce.appspot.com",
    messagingSenderId: "67097844721",
    appId: "1:67097844721:web:4285b2b5fe813a2efdc250",
    measurementId: "G-TRPRFNXRQP"
});

let signup = document.querySelector(".signup");
let login = document.querySelector(".login");
let slider = document.querySelector(".slider");
let formSection = document.querySelector(".form-section");

signup.addEventListener("click", () => {
    slider.classList.add("moveslider");
    formSection.classList.add("form-section-move");
});

login.addEventListener("click", () => {
    slider.classList.remove("moveslider");
    formSection.classList.remove("form-section-move");
});


// Initialize Firebase services
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();

// Function to log in a user with email and password
function login2() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredentials) => {
            // Store user ID in sessionStorage
            sessionStorage.setItem("uid", userCredentials.user.uid);
            // Redirect to index.html
            window.location.href = "./index.html";
        })
        .catch((error) => {
            console.error("Login failed: " + error.message);
        });
}

// Function to sign up a new user with additional fields
function signUp() {
    const SingupEmail = document.getElementById("SingupEmail").value;
    const conformPassword = document.getElementById("conformPassword").value;
    const fname = document.getElementById("SignupName").value;

    // Create a new user in Firebase Authentication
    auth.createUserWithEmailAndPassword(SingupEmail, conformPassword)
        .then((userCredentials) => {
            // Store user ID in sessionStorage
            sessionStorage.setItem("uid", userCredentials.user.uid);
            // Save user info in Firestore collection 'users'
            db.collection("users").doc(userCredentials.user.uid).set({
                name: fname,
                email: SingupEmail,
                userId: userCredentials.user.uid
            })
            .then(() => {
                // Redirect to index.html
                window.location.href = "./index.html";
            })
            .catch((err) => {
                alert("Error saving user data: " + err.message);
            });
        })
        .catch((err) => {
            alert("Sign-up failed: " + err.message);
        });
}
