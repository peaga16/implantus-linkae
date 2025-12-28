import { db, auth, storage, doc, getDoc, setDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginError = document.getElementById('login-error');
const linksContainer = document.getElementById('links-list-container'); 
const btnLogin = document.getElementById('btn-login');

const DOC_ID = "implantus_config"; 

// --- INICIALIZAR O SORTABLE (Drag & Drop) ---
if (typeof Sortable !== 'undefined' && linksContainer) {
    new Sortable(linksContainer, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost'
    });
}

// 1. VERIFICAR SE JÁ ESTÁ LOGADO
onAuthStateChanged(auth, (user) => {
    if (user) {
        showDashboard();
    } else {
        showLogin();
    }
});

function showLogin() {
    if(loginScreen) loginScreen.classList.remove('hidden');
    if(dashboardScreen) dashboardScreen.classList.add('hidden');
}

function showDashboard() {
    if(loginScreen) loginScreen.classList.add('hidden');
    if(dashboardScreen) dashboardScreen.classList.remove('hidden');
    loadData(); 
}

// 2. LÓGICA DE LOGIN (Blindada)
if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
        e.preventDefault(); // Impede recarregamento da página
        
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;

        // Feedback visual
        const originalText = btnLogin.innerText;
        btnLogin.innerText = "Entrando...";
        btnLogin.disabled = true;
        if(loginError) loginError.style.display = 'none';

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // O onAuthStateChanged vai cuidar de mudar a tela
        } catch (error) {
            console.error("Erro Login:", error);
            if(loginError) {
                loginError.innerText = "Erro: " + traduzirErro(error.code);
                loginError.style.display = 'block';
            }
            // Restaura botão só se der erro
            btnLogin.innerText = originalText;
            btnLogin.disabled = false;
        }
    });
}

function traduzirErro(code) {
    switch(code) {
        case 'auth/invalid-email': return 'E-mail inválido.';
        case 'auth/user-not-found': return 'Usuário não encontrado.';
        case 'auth/wrong-password': return 'Senha incorreta.';
        default: return code;
    }
}

// LOGOUT
const btnLogout = document.getElementById('btn-logout');
if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth);
        window.location.reload();
    });
}

// 3. CARREGAR DADOS
async function loadData() {
    try {
        const docRef = doc(db, "sites", DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if(el) el.value = val || "";
            };

            setVal('inp-name', data.content?.name);
            setVal('inp-bio', data.content?.bio);
            setVal('inp-location', data.content?.location);
            setVal('inp-phone', data.content?.phone);
            setVal('inp-img-profile', data.content?.profileImg);
            
            setVal('inp-bg-mob', data.design?.bgMobile);
            setVal('inp-bg-desk', data.design?.bgDesktop);
            setVal('inp-fav-light', data.design?.favLight);
            setVal('inp-fav-dark', data.design?.favDark);
            
            setVal('inp-pix-key', data.pix?.key);
            setVal('inp-pix-name', data.pix?.name);
            setVal('inp-pix-city', data.pix?.city);

            if(linksContainer) {
                linksContainer.innerHTML = ""; 
                if (data.content?.links) {
                    data.content.links.forEach(link => createLinkCard(link.title, link.url, link.img));
                }
            }
        } else {
            createLinkCard("Exemplo", "#", ""); 
        }
    } catch (e) {
        console.error("Erro ao carregar:", e);
    }
}

// --- FUNÇÃO DE UPLOAD PROTEGIDA (A CORREÇÃO ESTÁ AQUI) ---
function setupStaticUpload(btnId, fileId, inputId, statusId) {
    const btn = document.getElementById(btnId);
    const fileInput = document.getElementById(fileId);
    const textInput = document.getElementById(inputId);
    const status = document.getElementById(statusId);

    // SE O BOTÃO NÃO EXISTIR NO HTML, A FUNÇÃO PARA AQUI E NÃO TRAVA O RESTO
    if(!btn || !fileInput || !textInput) return;

    btn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if(status) status.style.display = 'block';
        btn.disabled = true;
        const oldText = btn.innerHTML;
        btn.innerHTML = '...';

        try {
            const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            
            textInput.value = url; 

            if(status) status.style.display = 'none';
            btn.innerHTML = 'OK';
            setTimeout(() => { btn.disabled = false; btn.innerHTML = oldText; }, 2000);
        } catch (error) {
            console.error(error);
            btn.disabled = false;
            btn.innerHTML = oldText;
        }
    });
}

// Ativa uploads (se os botões existirem)
setupStaticUpload('btn-upload-profile', 'file-profile', 'inp-img-profile', 'status-profile');
setupStaticUpload('btn-upload-bg-mob', 'file-bg-mob', 'inp-bg-mob', 'status-bg-mob');
setupStaticUpload('btn-upload-bg-desk', 'file-bg-desk', 'inp-bg-desk', 'status-bg-desk');
setupStaticUpload('btn-upload-fav-light', 'file-fav-light', 'inp-fav-light', 'status-fav-light');
setupStaticUpload('btn-upload-fav-dark', 'file-fav-dark', 'inp-fav-dark', 'status-fav-dark');


// 4. CRIAR CARD
function createLinkCard(title = "", url = "", img = "") {
    if(!linksContainer) return;
    const div = document.createElement('div');
    div.classList.add('link-item-editor');
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
            <span class="upload-status">Env...</span>
        </div>
    `;

    // Lógica Upload Card
    const fileInput = div.querySelector(`#${fileId}`);
    const imgInput = div.querySelector('.inp-link-img');
    const btn = div.querySelector('.btn-upload-trigger');
    const status = div.querySelector('.upload-status');

    if(fileInput && btn) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            status.style.display = 'block';
            btn.disabled = true;
            try {
                const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                imgInput.value = url;
                status.style.display = 'none';
                btn.innerHTML = 'OK';
                setTimeout(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paperclip"></i> Anexar'; }, 2000);
            } catch (error) { console.error(error); btn.disabled = false; }
        });
    }

    div.querySelector('.btn-remove-link').addEventListener('click', () => {
        if(confirm("Remover?")) div.remove();
    });
    linksContainer.appendChild(div);
}

const btnAdd = document.getElementById('btn-add-link');
if(btnAdd) btnAdd.addEventListener('click', () => createLinkCard());

// 5. SALVAR TUDO
const formAdmin = document.getElementById('admin-form');
if(formAdmin) {
    formAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('button[type="submit"]');
        const oldText = saveBtn.innerText;
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
                    favLight: document.getElementById('inp-fav-light')?.value || "",
                    favDark: document.getElementById('inp-fav-dark')?.value || "",
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
            saveBtn.innerText = oldText;
            saveBtn.disabled = false;
        }
    });
}