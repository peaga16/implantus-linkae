import { db, auth, storage, doc, getDoc, setDoc, ref, uploadBytes, getDownloadURL, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from './firebase-config.js';

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const linksContainer = document.getElementById('links-list-container');
const DOC_ID = "implantus_config"; 

const DEFAULT_DATA = { content: { links: [] }, design: {}, pix: {} };

// 1. VERIFICAR SE ESTÁ LOGADO (TROCA AS TELAS)
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        loadData();
        setupFileUploads(); 
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
});

// 2. FUNÇÃO GENÉRICA DE UPLOAD
async function uploadFileToFirebase(file, path) {
    if (!file) return null;
    const storageRef = ref(storage, path + '/' + Date.now() + '-' + file.name);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao enviar imagem. Verifique sua conexão.");
        return null;
    }
}

// 3. CONFIGURAR UPLOADS (PERFIL, FUNDOS E FAVICONS)
function setupFileUploads() {
    setupSingleUpload('file-profile', 'inp-img-profile', 'status-profile', 'profiles');
    setupSingleUpload('file-bg-mob', 'inp-bg-mob', 'status-bg-mob', 'backgrounds');
    setupSingleUpload('file-bg-desk', 'inp-bg-desk', 'status-bg-desk', 'backgrounds');
    setupSingleUpload('file-fav-light', 'inp-fav-light', 'status-fav-light', 'favicons');
    setupSingleUpload('file-fav-dark', 'inp-fav-dark', 'status-fav-dark', 'favicons');
}

function setupSingleUpload(inputId, hiddenInputId, statusId, folder) {
    const fileInput = document.getElementById(inputId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const statusMsg = document.getElementById(statusId);

    if(!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            statusMsg.style.display = 'block'; statusMsg.innerText = "Enviando..."; statusMsg.style.color = "yellow";
            const url = await uploadFileToFirebase(file, folder);
            if (url) { hiddenInput.value = url; statusMsg.innerText = "Pronto!"; statusMsg.style.color = "#22c55e"; }
        }
    });
}

// 4. LOGIN COM SEGURANÇA (FECHOU A ABA = DESLOGOU)
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    
    try {
        // Define que a sessão só dura enquanto a aba estiver aberta
        await setPersistence(auth, browserSessionPersistence);
        
        // Faz o login
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('login-error').innerText = "Erro: Email ou senha inválidos.";
    }
});

// LOGOUT MANUAL
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

// 5. CARREGAR DADOS DO BANCO
async function loadData() {
    const docRef = doc(db, "sites", DOC_ID);
    const docSnap = await getDoc(docRef);
    let data = docSnap.exists() ? docSnap.data() : DEFAULT_DATA;

    // Campos de Texto
    document.getElementById('inp-name').value = data.content.name || "";
    document.getElementById('inp-bio').value = data.content.bio || "";
    document.getElementById('inp-location').value = data.content.location || "";
    document.getElementById('inp-phone').value = data.content.phone || "";
    document.getElementById('inp-pix-key').value = data.pix.key || "";
    document.getElementById('inp-pix-name').value = data.pix.name || "";
    document.getElementById('inp-pix-city').value = data.pix.city || "";

    // Campos Ocultos (URLs das imagens)
    document.getElementById('inp-img-profile').value = data.content.profileImg || "";
    document.getElementById('inp-bg-mob').value = data.design.bgMobile || "";
    document.getElementById('inp-bg-desk').value = data.design.bgDesktop || "";
    document.getElementById('inp-fav-light').value = data.design.favLight || "";
    document.getElementById('inp-fav-dark').value = data.design.favDark || "";

    // Gerar Lista de Cards
    linksContainer.innerHTML = "";
    const linksToLoad = (data.content.links && data.content.links.length > 0) ? data.content.links : [];
    linksToLoad.forEach(link => createLinkCard(link.title, link.url, link.img));
}

// 6. CRIAR CARD VISUAL
function createLinkCard(title = "", url = "", img = "") {
    const div = document.createElement('div');
    div.classList.add('link-item-editor');
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000); 

    div.innerHTML = `
        <button type="button" class="btn-remove-link">X</button>
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Título</label>
        <input type="text" class="inp-link-title" value="${title}">
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Link</label>
        <input type="text" class="inp-link-url" value="${url}">
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Imagem</label>
        <input type="file" id="file-link-${uniqueId}" accept="image/*">
        <input type="hidden" class="inp-link-img" value="${img}">
        <small id="status-link-${uniqueId}" class="upload-status" style="${img ? 'display:block;color:#22c55e' : ''}">${img ? 'Imagem salva' : ''}</small>
    `;

    const fileInput = div.querySelector(`#file-link-${uniqueId}`);
    const hiddenInput = div.querySelector('.inp-link-img');
    const statusMsg = div.querySelector(`#status-link-${uniqueId}`);

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            statusMsg.style.display = 'block'; statusMsg.innerText = "Enviando..."; statusMsg.style.color = "yellow";
            const newUrl = await uploadFileToFirebase(file, 'cards');
            if (newUrl) { hiddenInput.value = newUrl; statusMsg.innerText = "Pronto!"; statusMsg.style.color = "#22c55e"; }
        }
    });

    div.querySelector('.btn-remove-link').addEventListener('click', () => { 
        if(confirm("Remover este card?")) div.remove(); 
    });
    
    linksContainer.appendChild(div);
}

document.getElementById('btn-add-link').addEventListener('click', () => createLinkCard());

// 7. SALVAR TUDO
document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Coleta os Cards
    const linksArray = [];
    document.querySelectorAll('.link-item-editor').forEach(div => {
        linksArray.push({
            title: div.querySelector('.inp-link-title').value,
            url: div.querySelector('.inp-link-url').value,
            img: div.querySelector('.inp-link-img').value
        });
    });
    
    // Monta o objeto final
    const newData = {
        content: {
            name: document.getElementById('inp-name').value,
            bio: document.getElementById('inp-bio').value,
            location: document.getElementById('inp-location').value,
            phone: document.getElementById('inp-phone').value,
            profileImg: document.getElementById('inp-img-profile').value,
            links: linksArray
        },
        design: {
            font: "Outfit",
            bgMobile: document.getElementById('inp-bg-mob').value,
            bgDesktop: document.getElementById('inp-bg-desk').value,
            favLight: document.getElementById('inp-fav-light').value,
            favDark: document.getElementById('inp-fav-dark').value
        },
        pix: {
            key: document.getElementById('inp-pix-key').value,
            name: document.getElementById('inp-pix-name').value,
            city: document.getElementById('inp-pix-city').value
        }
    };

    try { 
        await setDoc(doc(db, "sites", DOC_ID), newData); 
        alert("Site salvo e atualizado com sucesso!"); 
    } 
    catch (error) { 
        alert("Erro ao salvar: " + error.message); 
        console.error(error);
    }
});