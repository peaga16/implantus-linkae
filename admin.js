import { db, auth, storage, doc, getDoc, setDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginError = document.getElementById('login-error');
const linksContainer = document.getElementById('links-list-container'); 

const DOC_ID = "implantus_config"; 

// --- INICIALIZAR DRAG & DROP ---
new Sortable(linksContainer, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost'
});

// --- CONFIGURAR UPLOADS ESTÁTICOS ---
// Função auxiliar para ativar o upload nos campos fixos (Perfil, BG, Favicons)
function setupStaticUpload(btnId, fileId, inputId, statusId) {
    const btn = document.getElementById(btnId);
    const fileInput = document.getElementById(fileId);
    const textInput = document.getElementById(inputId);
    const status = document.getElementById(statusId);

    // Quando clicar no botão "Anexar", clica no input file escondido
    btn.addEventListener('click', () => fileInput.click());

    // Quando selecionar um arquivo...
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Visual de Carregando
        status.style.display = 'block';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ...';

        try {
            const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            
            textInput.value = url; // Preenche o campo

            status.style.display = 'none';
            btn.innerHTML = '<i class="fas fa-check"></i> OK';
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paperclip"></i> Anexar';
            }, 2000);
        } catch (error) {
            console.error(error);
            status.innerText = "Erro";
            status.style.color = "red";
            btn.disabled = false;
        }
    });
}

// Ativar upload para todos os campos estáticos
setupStaticUpload('btn-upload-profile', 'file-profile', 'inp-img-profile', 'status-profile');
setupStaticUpload('btn-upload-bg-mob', 'file-bg-mob', 'inp-bg-mob', 'status-bg-mob');
setupStaticUpload('btn-upload-bg-desk', 'file-bg-desk', 'inp-bg-desk', 'status-bg-desk');
setupStaticUpload('btn-upload-fav-light', 'file-fav-light', 'inp-fav-light', 'status-fav-light');
setupStaticUpload('btn-upload-fav-dark', 'file-fav-dark', 'inp-fav-dark', 'status-fav-dark');


// 1. VERIFICAR LOGIN
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        loadData(); 
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
});

// 2. LOGIN & LOGOUT
document.getElementById('btn-login').addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
    } catch (e) {
        loginError.innerText = "Login inválido";
        loginError.style.display = 'block';
    }
});
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

// 3. CARREGAR DADOS
async function loadData() {
    const docRef = doc(db, "sites", DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Preenche campos de texto e imagens
        document.getElementById('inp-name').value = data.content.name || "";
        document.getElementById('inp-bio').value = data.content.bio || "";
        document.getElementById('inp-location').value = data.content.location || "";
        document.getElementById('inp-phone').value = data.content.phone || "";
        document.getElementById('inp-img-profile').value = data.content.profileImg || "";
        
        document.getElementById('inp-bg-mob').value = data.design.bgMobile || "";
        document.getElementById('inp-bg-desk').value = data.design.bgDesktop || "";
        document.getElementById('inp-fav-light').value = data.design.favLight || "";
        document.getElementById('inp-fav-dark').value = data.design.favDark || "";
        
        document.getElementById('inp-pix-key').value = data.pix.key || "";
        document.getElementById('inp-pix-name').value = data.pix.name || "";
        document.getElementById('inp-pix-city').value = data.pix.city || "";

        // Gera os cards
        linksContainer.innerHTML = ""; 
        if (data.content.links) {
            data.content.links.forEach(link => createLinkCard(link.title, link.url, link.img));
        }
    } else {
        createLinkCard("Exemplo", "#", ""); 
    }
}

// 4. CRIAR CARD DE LINK (Com Upload Individual)
function createLinkCard(title = "", url = "", img = "") {
    const div = document.createElement('div');
    div.classList.add('link-item-editor');
    
    // ID único para o input de arquivo deste card
    const fileId = 'file-' + Math.random().toString(36).substr(2, 9);

    div.innerHTML = `
        <i class="fas fa-grip-lines drag-handle"></i>
        <button type="button" class="btn-remove-link">X</button>
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Título</label>
        <input type="text" class="inp-link-title" value="${title}">
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Link URL</label>
        <input type="text" class="inp-link-url" value="${url}">
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Imagem Banner</label>
        <div class="upload-area">
            <input type="file" id="${fileId}" class="inp-file-hidden" accept="image/*">
            <button type="button" class="btn-upload-trigger" onclick="document.getElementById('${fileId}').click()">
                <i class="fas fa-paperclip"></i> Anexar
            </button>
            <input type="text" class="inp-link-img" value="${img}" readonly>
            <span class="upload-status">Enviando...</span>
        </div>
    `;

    // Lógica Upload Card
    const fileInput = div.querySelector(`#${fileId}`);
    const imgInput = div.querySelector('.inp-link-img');
    const btn = div.querySelector('.btn-upload-trigger');
    const status = div.querySelector('.upload-status');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        status.style.display = 'block';
        btn.disabled = true;
        btn.innerHTML = '...';

        try {
            const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            imgInput.value = url;
            
            status.style.display = 'none';
            btn.innerHTML = 'OK';
            setTimeout(() => { btn.disabled = false; btn.innerHTML = 'Anexar'; }, 2000);
        } catch (error) {
            console.error(error);
            btn.disabled = false;
        }
    });

    div.querySelector('.btn-remove-link').addEventListener('click', () => {
        if(confirm("Remover?")) div.remove();
    });

    linksContainer.appendChild(div);
}

document.getElementById('btn-add-link').addEventListener('click', () => createLinkCard());

// 5. SALVAR TUDO
document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = e.target.querySelector('button[type="submit"]');
    saveBtn.innerText = "SALVANDO...";
    saveBtn.disabled = true;

    const linksArray = [];
    document.querySelectorAll('.link-item-editor').forEach(div => {
        linksArray.push({
            title: div.querySelector('.inp-link-title').value,
            url: div.querySelector('.inp-link-url').value,
            img: div.querySelector('.inp-link-img').value
        });
    });
    
    try {
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
                // Agora salvamos os favicons corretos
                favLight: document.getElementById('inp-fav-light').value || "assets/linkaê-favicon-light.jpg",
                favDark: document.getElementById('inp-fav-dark').value || "assets/linkaê-favicon-dark.jpg",
                bgMobile: document.getElementById('inp-bg-mob').value,
                bgDesktop: document.getElementById('inp-bg-desk').value
            },
            pix: {
                key: document.getElementById('inp-pix-key').value,
                name: document.getElementById('inp-pix-name').value,
                city: document.getElementById('inp-pix-city').value,
                value: 0.00
            }
        };

        await setDoc(doc(db, "sites", DOC_ID), newData);
        alert("Salvo com sucesso!");
    } catch (error) {
        alert("Erro: " + error.message);
    } finally {
        saveBtn.innerText = "SALVAR TUDO";
        saveBtn.disabled = false;
    }
});