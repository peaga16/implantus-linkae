import { supabase } from './supabase-config.js';

// Elementos da Interface
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginError = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const linksContainer = document.getElementById('links-list-container'); 
const btnAdd = document.getElementById('btn-add-link');
const formAdmin = document.getElementById('admin-form');

const DOC_ID = "implantus_config"; 

// --- CONTROLE DE TELAS (LOGIN / DASHBOARD) ---
function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    loadData(); // Carrega os dados do banco ao entrar
}

// Verifica o estado da sessão ao carregar a página
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
});

// --- LÓGICA DE LOGIN ---
if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass,
        });

        if (error) {
            loginError.innerText = "Erro: " + error.message;
            loginError.style.display = 'block';
        }
        // O onAuthStateChange cuidará de chamar showDashboard()
    });
}

// LOGOUT
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });
}

// --- INICIALIZAR O SORTABLE (Drag & Drop) ---
if (typeof Sortable !== 'undefined' && linksContainer) {
    new Sortable(linksContainer, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost'
    });
}

// --- FUNÇÃO DE UPLOAD PARA SUPABASE STORAGE ---
// admin.js

async function uploadFile(file, statusEl, btnEl) {
    const fileName = `${Date.now()}_${file.name}`;
    statusEl.style.display = 'block';
    btnEl.disabled = true;

    try {
        const { data, error } = await supabase.storage
            .from('img') // <--- Alterado de 'uploads' para 'img'
            .upload(fileName, file);

        if (error) throw error;

        const { data: publicData } = supabase.storage
            .from('img') // <--- Alterado de 'uploads' para 'img'
            .getPublicUrl(fileName);

        statusEl.innerText = "Pronto!";
        setTimeout(() => { 
            statusEl.style.display = 'none'; 
            btnEl.disabled = false; 
            statusEl.innerText = "Enviando..."; 
        }, 2000);
        
        return publicData.publicUrl;
    } catch (err) {
        alert("Erro no upload: " + err.message);
        btnEl.disabled = false;
        return null;
    }
}

// Configuração de botões de upload estáticos (Perfil e Backgrounds)
function setupStaticUpload(btnId, fileId, inputId, statusId) {
    const btn = document.getElementById(btnId);
    const fileInput = document.getElementById(fileId);
    const textInput = document.getElementById(inputId);
    const status = document.getElementById(statusId);

    if(!btn || !fileInput) return;

    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = await uploadFile(file, status, btn);
            if (url) textInput.value = url;
        }
    });
}

setupStaticUpload('btn-upload-profile', 'file-profile', 'inp-img-profile', 'status-profile');
setupStaticUpload('btn-upload-bg-mob', 'file-bg-mob', 'inp-bg-mob', 'status-bg-mob');
setupStaticUpload('btn-upload-bg-desk', 'file-bg-desk', 'inp-bg-desk', 'status-bg-desk');
setupStaticUpload('btn-upload-fav-light', 'file-fav-light', 'inp-fav-light', 'status-fav-light');
setupStaticUpload('btn-upload-fav-dark', 'file-fav-dark', 'inp-fav-dark', 'status-fav-dark');

// --- CARREGAR DADOS DO BANCO (MySQL/Postgres) ---
async function loadData() {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('data')
            .eq('id', DOC_ID)
            .single();

        if (data) {
            const content = data.data.content;
            const design = data.data.design;
            const pix = data.data.pix;

            // Preenche os campos de texto
            document.getElementById('inp-name').value = content.name || "";
            document.getElementById('inp-bio').value = content.bio || "";
            document.getElementById('inp-location').value = content.location || "";
            document.getElementById('inp-phone').value = content.phone || "";
            document.getElementById('inp-img-profile').value = content.profileImg || "";
            document.getElementById('inp-bg-mob').value = design.bgMobile || "";
            document.getElementById('inp-bg-desk').value = design.bgDesktop || "";
            document.getElementById('inp-fav-light').value = design.favLight || "";
            document.getElementById('inp-fav-dark').value = design.favDark || "";
            document.getElementById('inp-pix-key').value = pix.key || "";
            document.getElementById('inp-pix-name').value = pix.name || "";
            document.getElementById('inp-pix-city').value = pix.city || "";

            // Limpa e recria a lista de links
            linksContainer.innerHTML = "";
            if (content.links) {
                content.links.forEach(l => createLinkCard(l.title, l.url, l.img));
            }
        }
    } catch (e) { 
        console.error("Erro ao carregar dados:", e); 
    }
}

// --- CRIAR CARD DE LINK ---
function createLinkCard(title = "", url = "", img = "") {
    const div = document.createElement('div');
    div.classList.add('link-item-editor');
    const fileId = 'file-' + Math.random().toString(36).substr(2, 9);

    div.innerHTML = `
        <i class="fas fa-grip-lines drag-handle"></i>
        <button type="button" class="btn-remove-link">X</button>
        <label>Título</label><input type="text" class="inp-link-title" value="${title}">
        <label>URL</label><input type="text" class="inp-link-url" value="${url}">
        <div class="upload-area">
            <input type="file" id="${fileId}" class="inp-file-hidden" accept="image/*">
            <button type="button" class="btn-upload-trigger" onclick="document.getElementById('${fileId}').click()">
                <i class="fas fa-paperclip"></i> Anexar
            </button>
            <input type="text" class="inp-link-img" value="${img}" readonly>
            <span class="upload-status">Env...</span>
        </div>
    `;

    const fileInput = div.querySelector(`#${fileId}`);
    fileInput.addEventListener('change', async (e) => {
        const url = await uploadFile(
            e.target.files[0], 
            div.querySelector('.upload-status'), 
            div.querySelector('.btn-upload-trigger')
        );
        if (url) div.querySelector('.inp-link-img').value = url;
    });

    div.querySelector('.btn-remove-link').addEventListener('click', () => {
        if(confirm("Deseja remover este link?")) div.remove();
    });
    
    linksContainer.appendChild(div);
}

if(btnAdd) btnAdd.onclick = () => createLinkCard();

// --- SALVAR TUDO ---
if(formAdmin) {
    formAdmin.onsubmit = async (e) => {
        e.preventDefault();
        
        // Coleta todos os links criados
        const links = Array.from(document.querySelectorAll('.link-item-editor')).map(div => ({
            title: div.querySelector('.inp-link-title').value,
            url: div.querySelector('.inp-link-url').value,
            img: div.querySelector('.inp-link-img').value
        }));

        const finalData = {
            content: {
                name: document.getElementById('inp-name').value,
                bio: document.getElementById('inp-bio').value,
                location: document.getElementById('inp-location').value,
                phone: document.getElementById('inp-phone').value,
                profileImg: document.getElementById('inp-img-profile').value,
                links: links
            },
            design: {
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

        const { error } = await supabase
            .from('sites')
            .upsert({ id: DOC_ID, data: finalData });

        if (error) {
            alert("Erro ao salvar: " + error.message);
        } else {
            alert("Configurações salvas com sucesso!");
        }
    };
}