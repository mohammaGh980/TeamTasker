// Firebase-konfigurasjon
const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyDKlCH_ZS3sUL-znKGxmc1_qEabI7vSwMs",
    authDomain: "tracktime-app-4b4ce.firebaseapp.com",
    projectId: "tracktime-app-4b4ce",
    storageBucket: "tracktime-app-4b4ce.appspot.com",
    messagingSenderId: "67097844721",
    appId: "1:67097844721:web:4285b2b5fe813a2efdc250",
    measurementId: "G-TRPRFNXRQP"
});

const db = firebaseApp.firestore();
const auth = firebase.auth();

// Sjekk om brukeren er logget inn
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Brukeren er logget inn:", user.email);

        // Vis velkomstmelding med brukerens navn (eller e-post hvis displayName ikke er satt)
        const welcomeMessage = document.getElementById("welcome-message");
        const userName = user.displayName || user.email; // Brukerens navn hvis tilgjengelig, ellers e-post
        welcomeMessage.textContent = `Velkommen, ${userName}`;

        // Lagre brukerens ID i sessionStorage for enkel tilgang
        sessionStorage.setItem("uid", user.uid);

        // Last oppgaver etter at brukeren er logget inn
        loadTasks();
    } else {
        // Hvis brukeren ikke er logget inn, omdiriger til innloggingssiden
        window.location.href = "login.html";
    }
});

// Funksjon for å opprette et oppgaveelement
function createTaskElement(taskId, taskData) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task');
    taskElement.id = taskId;
    taskElement.draggable = true;

    // Redigerbar tekst
    const editableText = document.createElement('input');
    editableText.type = 'text';
    editableText.value = taskData.title;
    editableText.classList.add('editable-text');
    editableText.disabled = true;
    taskElement.appendChild(editableText);

    // Rediger-knapp med ikon
    const editButton = document.createElement('button');
    editButton.classList.add('edit-btn');
    const editIcon = document.createElement('i');
    editIcon.classList.add('fas', 'fa-edit'); // Bruk Font Awesome for ikon
    editButton.appendChild(editIcon);
    editButton.onclick = () => {
        editableText.disabled = false;
        editableText.focus();
        editButton.classList.add('hidden');
        saveButton.classList.remove('hidden');
    };
    taskElement.appendChild(editButton);

    // Lagre-knapp med ikon
    const saveButton = document.createElement('button');
    saveButton.classList.add('save-btn', 'hidden');
    const saveIcon = document.createElement('i');
    saveIcon.classList.add('fas', 'fa-save'); // Bruk Font Awesome for ikon
    saveButton.appendChild(saveIcon);
    saveButton.onclick = () => {
        const updatedText = editableText.value.trim();
        if (updatedText) {
            db.collection('tasks').doc(taskId).update({ title: updatedText });
        }
        editableText.disabled = true;
        editButton.classList.remove('hidden');
        saveButton.classList.add('hidden');
    };
    taskElement.appendChild(saveButton);

    // Slett-knapp med ikon
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fas', 'fa-trash-alt'); // Bruk Font Awesome for ikon
    deleteButton.appendChild(deleteIcon);
    deleteButton.onclick = () => {
        if (confirm('Er du sikker på at du vil slette denne oppgaven?')) {
            db.collection('tasks').doc(taskId).delete();
        }
    };
    taskElement.appendChild(deleteButton);

    // Dra-og-slipp
    taskElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', taskId);
    });

    return taskElement;
}

// Last inn oppgaver fra Firebase
function loadTasks() {
    const userId = sessionStorage.getItem("uid"); // Henter ut userid som er lagra i sessionStorage
    db.collection("tasks").onSnapshot((snapshot) => {
        document.getElementById("not-started-list").innerHTML = "";
        document.getElementById("in-progress-list").innerHTML = "";
        document.getElementById("blocked-list").innerHTML = "";
        document.getElementById("done-list").innerHTML = "";

        snapshot.forEach((doc) => {
            if (doc.data().userid == userId) {
                const taskData = doc.data();
                const taskElement = createTaskElement(doc.id, taskData);
                document.getElementById(`${taskData.status}-list`).appendChild(taskElement);
            }
        });
    });
}

// Oppdater oppgavestatus i Firebase
function updateTaskStatus(taskId, newStatus) {
    db.collection("tasks").doc(taskId).update({
        status: newStatus
    });
}

// Legg til ny oppgave i Firebase
function addTask(title) {
    const userId = sessionStorage.getItem("uid");
    db.collection("tasks").add({
        title: title,
        status: "not-started",
        userid: userId
    });
}

// Generer en unik ID for prosjektet (hvis nødvendig)
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

// Vis og skjul skjema for ny oppgave
document.getElementById("add-task-btn").addEventListener("click", () => {
    document.getElementById("task-form-container").classList.remove("hidden");
});

document.getElementById("cancel-task-btn").addEventListener("click", () => {
    document.getElementById("task-form-container").classList.add("hidden");
    document.getElementById("task-title").value = ""; // Tømmer input-feltet
});

document.getElementById("save-task-btn").addEventListener("click", () => {
    const title = document.getElementById("task-title").value.trim();
    if (title) {
        addTask(title);
        document.getElementById("task-form-container").classList.add("hidden");
        document.getElementById("task-title").value = ""; // Tømmer input-feltet
    }
});

// Dra-og-slipp-hendelser for kolonner
['not-started', 'in-progress', 'blocked', 'done'].forEach((status) => {
    const column = document.getElementById(`${status}-list`);

    column.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    column.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        updateTaskStatus(taskId, status);
    });
});

// Logg ut
function logout() {
    auth.signOut().then(() => {
        sessionStorage.removeItem("uid");
        window.location.href = "login.html";
    });
}
// Hent referanser til DOM-elementer
const profileModal = document.getElementById("profile-modal");
const profileName = document.getElementById("profile-name");
const profilePic = document.getElementById("profile-pic");
const profilePicInput = document.getElementById("profile-pic-input");

// Funksjon for å vise profil
function viewProfile() {
    const user = auth.currentUser; // Henter innlogget bruker fra Firebase Auth
    if (user) {
        profileName.textContent = user.displayName || "Anonymous User"; // Vis brukerens navn eller 'Anonymous User'
        profileModal.classList.remove("hidden");
    } else {
        alert("Ingen bruker er logget inn!");
    }
}

// Funksjon for å lukke modal
function closeProfileModal() {
    profileModal.classList.add("hidden");
}

// Funksjon for å oppdatere profilbilde
profilePicInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePic.src = e.target.result; // Oppdater forhåndsvisning av bilde
            // Last opp bildet til Firebase Storage
            const storageRef = firebase.storage().ref();
            const userProfilePicRef = storageRef.child(`profilePics/${auth.currentUser.uid}`);
            userProfilePicRef.put(file).then(() => {
                userProfilePicRef.getDownloadURL().then((url) => {
                    auth.currentUser.updateProfile({
                        photoURL: url
                    }).then(() => {
                        alert("Profilbilde oppdatert!");
                    }).catch((error) => {
                        console.error("Feil ved oppdatering av profilbilde:", error);
                    });
                });
            });
        };
        reader.readAsDataURL(file);
    }
});



// Vis profilmodal
function viewProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const profileModal = document.getElementById('profile-modal');
    const overlay = document.getElementById('profile-overlay');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profilePic = document.getElementById('profile-pic');
    const profileInitials = document.getElementById('profile-initials');

    // Sett brukerinformasjon
    profileName.textContent = user.displayName || user.email.split('@')[0];
    profileEmail.textContent = user.email;

    // Håndter profilbilde eller initialer
    if (user.photoURL) {
        profilePic.src = user.photoURL;
        profilePic.style.display = 'block';
        profileInitials.style.display = 'none';
    } else {
        const initials = getInitials(user.displayName || user.email);
        profileInitials.textContent = initials;
        profilePic.style.display = 'none';
        profileInitials.style.display = 'flex';
    }

    profileModal.classList.add('visible');
    overlay.classList.add('visible');
}

// Lukk profilmodal
function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('visible');
    document.getElementById('profile-overlay').classList.remove('visible');
}

// Hjelpefunksjon for initialer
function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
}

// Oppdater brukerikon i navigasjonen
function updateUserIcon(user) {
    const userIcon = document.querySelector('.user-icon');
    if (user.photoURL) {
        userIcon.innerHTML = `<img src="${user.photoURL}" alt="User Icon">`;
    } else {
        const initials = getInitials(user.displayName || user.email);
        userIcon.classList.add('initials');
        userIcon.textContent = initials;
    }
}

// Oppdater profilbilde
document.getElementById('profile-pic-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const storageRef = firebase.storage().ref();
        const user = auth.currentUser;
        const fileRef = storageRef.child(`profilePics/${user.uid}`);
        
        // Last opp bildet
        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();

        // Oppdater brukerprofil
        await user.updateProfile({
            photoURL: downloadURL
        });

        // Oppdater UI
        updateUserIcon(user);
        viewProfile(); // Oppdater modalen
    } catch (error) {
        console.error('Feil ved opplasting av bilde:', error);
        alert('Kunne ikke laste opp bildet');
    }
});

// Oppdater authStateChanged for å inkludere brukerikon
auth.onAuthStateChanged((user) => {
    if (user) {
        // ... eksisterende kode ...
        updateUserIcon(user); // Legg til denne linjen
    } else {
        // ... eksisterende kode ...
    }
});

// Knytt viewProfile-funksjonen til menyen
document.querySelector('#profile-menu a[href="#profile"]').addEventListener('click', (e) => {
    e.preventDefault();
    viewProfile();
});