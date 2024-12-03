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
let projectId = null; // Prosjekt-ID
let currentUserId = null; // ID for innlogget bruker

// Sjekk om brukeren er logget inn
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Brukeren er logget inn:", user.email);
        currentUserId = user.uid; // Lagre bruker-ID
        sessionStorage.setItem("uid", currentUserId); // Lagre i sessionStorage
        loadProjectId(); // Sjekk eller generer prosjekt-ID
    } else {
        console.log("Ingen bruker er logget inn.");
        window.location.href = "login.html"; // Gå til innloggingsside
    }
});

// Funksjon for å laste eller opprette prosjekt-ID
function loadProjectId() {
    const savedProjectId = sessionStorage.getItem("projectId");
    if (savedProjectId) {
        projectId = savedProjectId; // Bruk lagret prosjekt-ID
        loadTasks();
    } else {
        db.collection("projects").doc(currentUserId).get().then((doc) => {
            if (doc.exists) {
                projectId = doc.data().projectId;
                sessionStorage.setItem("projectId", projectId); // Lagre i sessionStorage
                loadTasks();
            } else {
                projectId = generateId(); // Opprett ny prosjekt-ID
                db.collection("projects").doc(currentUserId).set({ projectId })
                    .then(() => {
                        sessionStorage.setItem("projectId", projectId); // Lagre i sessionStorage
                        loadTasks();
                    }).catch((error) => console.error("Feil ved lagring av prosjekt-ID:", error));
            }
        }).catch((error) => console.error("Feil ved henting av prosjekt-ID:", error));
    }
}

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
     editIcon.classList.add('fas', 'fa-edit'); // FontAwesome edit-ikon
     editButton.appendChild(editIcon);
     editButton.onclick = () => {
         editableText.disabled = false;
         editableText.focus();
         editButton.classList.add('hidden');
         saveButton.classList.remove('hidden');
     };
     taskElement.appendChild(editButton);

    // Lagre-knapp
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Lagre';
    saveButton.classList.add('save-btn', 'hidden');
    saveButton.onclick = () => {
        const updatedText = editableText.value.trim();
        if (updatedText) {
            db.collection('tasks').doc(taskId).update({ title: updatedText })
                .then(() => console.log("Oppgave oppdatert."))
                .catch((error) => console.error("Feil ved oppdatering av oppgave:", error));
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
     deleteIcon.classList.add('fas', 'fa-trash'); // FontAwesome trash-ikon
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
    db.collection("tasks").where("userid", "==", currentUserId).where("projectId", "==", projectId)
        .onSnapshot((snapshot) => {
            // Tøm kolonnene
            ["not-started", "in-progress", "blocked", "done"].forEach(status => {
                document.getElementById(`${status}-list`).innerHTML = "";
            });

            snapshot.forEach((doc) => {
                const taskData = doc.data();
                const taskElement = createTaskElement(doc.id, taskData);
                document.getElementById(`${taskData.status}-list`).appendChild(taskElement);
            });
        });
}

// Oppdater oppgavestatus i Firebase
function updateTaskStatus(taskId, newStatus) {
    db.collection("tasks").doc(taskId).update({ status: newStatus })
        .then(() => console.log(`Status oppdatert til ${newStatus}.`))
        .catch((error) => console.error("Feil ved oppdatering av status:", error));
}

// Legg til ny oppgave i Firebase
function addTask(title) {
    db.collection("tasks").add({
        title: title,
        status: "not-started",
        userid: currentUserId,
        projectId: projectId
    }).then(() => {
        console.log("Oppgave lagt til.");
    }).catch((error) => {
        console.error("Feil ved lagring av oppgave:", error);
    });
}

// Generer en unik ID for prosjektet
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
        sessionStorage.clear();
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Feil ved utlogging:", error);
    });
}
