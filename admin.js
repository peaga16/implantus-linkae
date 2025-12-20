import { db, auth, doc, getDoc, setDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase-config.js';

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginError = document.getElementById('login-error');
const linksContainer = document.getElementById('links-list-container'); 

const DOC_ID = "implantus_config"; 

// --- INICIALIZAR O ARRASTAR E SOLTAR (SORTABLE) ---
// Isso ativa a mágica no container de links
new Sortable(linksContainer, {
    animation: 150, // Animação suave em ms
    handle: '.drag-handle', // Só arrasta se clicar no ícone de "grip"
    ghostClass: 'sortable-ghost' // Classe CSS enquanto arrasta
});
// --------------------------------------------------

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
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        loginError.innerText = "Erro: Email ou senha incorretos.";
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
        
        document.getElementById('inp-name').value = data.content.name || "";
        document.getElementById('inp-bio').value = data.content.bio || "";
        document.getElementById('inp-location').value = data.content.location || "";
        document.getElementById('inp-phone').value = data.content.phone || "";
        document.getElementById('inp-img-profile').value = data.content.profileImg || "";
        document.getElementById('inp-bg-mob').value = data.design.bgMobile || "";
        document.getElementById('inp-bg-desk').value = data.design.bgDesktop || "";
        document.getElementById('inp-pix-key').value = data.pix.key || "";
        document.getElementById('inp-pix-name').value = data.pix.name || "";
        document.getElementById('inp-pix-city').value = data.pix.city || "";

        // GERAR A LISTA VISUAL
        linksContainer.innerHTML = ""; 
        if (data.content.links && Array.isArray(data.content.links)) {
            data.content.links.forEach(link => {
                createLinkCard(link.title, link.url, link.img);
            });
        }
    } else {
        createLinkCard("Exemplo", "#", ""); 
    }
}

// 4. FUNÇÃO PARA CRIAR O CARD VISUAL (Com Handle de Arrastar)
function createLinkCard(title = "", url = "", img = "") {
    const div = document.createElement('div');
    div.classList.add('link-item-editor');
    
    // Adicionei o ícone <i class="fas fa-grip-lines drag-handle"></i>
    div.innerHTML = `
        <i class="fas fa-grip-lines drag-handle" title="Arrastar para ordenar"></i>
        
        <button type="button" class="btn-remove-link" title="Remover">X</button>
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Título do Botão</label>
        <input type="text" class="inp-link-title" value="${title}" placeholder="Ex: Falar no WhatsApp">
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Link de Destino</label>
        <input type="text" class="inp-link-url" value="${url}" placeholder="Ex: https://wa.me/...">
        
        <label style="margin-top:0; font-size:0.8rem; color:#ccc;">Imagem do Banner (URL)</label>
        <input type="text" class="inp-link-img" value="${img}" placeholder="Cole o link da imagem aqui">
    `;

    div.querySelector('.btn-remove-link').addEventListener('click', () => {
        if(confirm("Tem certeza que deseja remover este card?")) {
            div.remove();
        }
    });

    linksContainer.appendChild(div);
}

document.getElementById('btn-add-link').addEventListener('click', () => {
    createLinkCard(); 
});

// 5. SALVAR TUDO (Lê a ordem que está na tela)
document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // A mágica acontece aqui: querySelectorAll pega os elementos na ORDEM VISUAL
    // Como o Sortable mudou a ordem no HTML, esse loop já pega a nova ordem correta.
    const linksArray = [];
    const linkDivs = document.querySelectorAll('.link-item-editor');
    
    linkDivs.forEach(div => {
        const t = div.querySelector('.inp-link-title').value;
        const u = div.querySelector('.inp-link-url').value;
        const i = div.querySelector('.inp-link-img').value;
        
        if(t || u) {
            linksArray.push({ title: t, url: u, img: i });
        }
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
                favLight: "assets/linkaê-favicon-light.jpg",
                favDark: "assets/linkaê-favicon-dark.jpg",
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
        alert("Site atualizado com sucesso!");
        
    } catch (error) {
        alert("Erro ao salvar: " + error.message);
        console.error(error);
    }
});