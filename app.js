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
let docid = "";
let projectId = null; // Prosjekt-ID for deling

// Sjekk om brukeren er logget inn
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Brukeren er logget inn:", user.email);
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

    // Rediger-knapp
    const editButton = document.createElement('button');
    editButton.textContent = 'Rediger';
    editButton.classList.add('edit-btn');
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
            db.collection('tasks').doc(taskId).update({ title: updatedText });
        }
        editableText.disabled = true;
        editButton.classList.remove('hidden');
        saveButton.classList.add('hidden');
    };
    taskElement.appendChild(saveButton);

    // Slett-knapp
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Slett';
    deleteButton.classList.add('delete-btn');
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
            if (doc.data().userid == userId && doc.data().projectId === projectId) {
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
    projectId = projectId || generateId(); // Opprett prosjekt-ID hvis ikke finnes
    db.collection("tasks").add({
        title: title,
        status: "not-started",
        userid: userId,
        projectId: projectId
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

// Funksjonalitet for del-knapp
document.getElementById("share-btn").addEventListener("click", () => {
    projectId = projectId || generateId(); // Opprett prosjekt-ID hvis ikke finnes
    const shareLink = `${window.location.origin}?projectId=${projectId}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert("Prosjektlenke kopiert til utklippstavlen!");
    });
});

// Last inn oppgaver ved start
loadTasks();

// Logg ut
function logout() {
    auth.signOut().then(() => {
        sessionStorage.removeItem("uid");
        window.location.href = "login.html";
    });
}
