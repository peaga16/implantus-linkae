import { db, doc, getDoc } from './firebase-config.js';

const DOC_ID = "implantus_config";

/* --- DADOS DE BACKUP (ONLINE) --- */
const DEFAULT_CONFIG = {
    content: {
        name: "Carregando...",
        bio: "Aguarde um instante...",
        location: "...",
        phone: "",
        profileImg: "https://placehold.co/400x400?text=Aguardando", 
        links: []
    },
    design: {
        bgMobile: "", 
        bgDesktop: "",
        font: "Outfit",
        favLight: "",
        favDark: ""
    },
    pix: { key: "", name: "", city: "", value: 0.00 }
};

let appConfig = DEFAULT_CONFIG; 
let isDarkMode = localStorage.getItem('theme') !== 'light'; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Renderiza o básico imediatamente (Skeleton)
    renderSite();

    // 2. Configura botão de tema
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        // Atualiza ícone inicial
        updateThemeIcon();
        
        themeBtn.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            renderSite(); // Re-renderiza para aplicar favicon e cores
        });
    }

    // 3. Busca os dados reais no Firebase
    await fetchFromFirebase();

    // 4. Configura eventos de Modal
    setupGeneralEvents();
});

async function fetchFromFirebase() {
    try {
        const docRef = doc(db, "sites", DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Dados carregados!");
            appConfig = docSnap.data(); 
            renderSite(); 
        } else {
            console.log("Site novo. Configure no Admin.");
        }
    } catch (e) {
        console.error("Erro na conexão:", e);
    }
}

function renderSite() {
    const c = appConfig.content || DEFAULT_CONFIG.content;
    const d = appConfig.design || DEFAULT_CONFIG.design;

    // --- TEXTOS ---
    const elName = document.getElementById('ui-name');
    if (elName) {
        elName.innerText = c.name || "";
        document.title = c.name || "Linkaê";
    }
    
    const elBio = document.getElementById('ui-bio');
    if (elBio) elBio.innerText = c.bio || "";
    
    const elLoc = document.getElementById('ui-location');
    if (elLoc) elLoc.innerText = c.location || "";
    
    // --- FOTO DE PERFIL ---
    const imgEl = document.getElementById('ui-profile-img');
    if (imgEl) {
        imgEl.src = c.profileImg || 'https://placehold.co/400x400?text=Foto';
        imgEl.onerror = function() { 
            this.onerror = null; 
            this.src = 'https://placehold.co/400x400?text=Erro'; 
        };
        // Atualiza o compartilhamento do WhatsApp
        updateMetaTags(c.name, c.bio, c.profileImg);
    }
    
    const btnCall = document.getElementById('ui-btn-call');
    if (btnCall) btnCall.href = c.phone ? `tel:${c.phone}` : "#";

    // --- LISTA DE LINKS (CARDS) ---
    const linksList = document.getElementById('links-list');
    
    if (linksList && c.links && Array.isArray(c.links)) {
        linksList.innerHTML = ''; 
        
        c.links.forEach(link => {
            // Lógica: Se a imagem falhar, esconde a imagem e mostra o texto
            const linkHtml = `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-banner-16x9" title="${link.title}">
                    
                    <img src="${link.img}" alt="${link.title}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                    
                    <div class="link-fallback-text">${link.title}</div>
                </a>
            `;
            linksList.innerHTML += linkHtml;
        });
    }

    // --- BACKGROUNDS & FONTE ---
    const root = document.documentElement;
    if (d.bgMobile) root.style.setProperty('--bg-image-mob', `url('${d.bgMobile}')`);
    if (d.bgDesktop) root.style.setProperty('--bg-image-desk', `url('${d.bgDesktop}')`);
    
    if(d.font) {
        const fontLink = document.getElementById('google-font-link');
        if (fontLink) {
            fontLink.href = `https://fonts.googleapis.com/css2?family=${d.font.replace(/\s+/g, '+')}:wght@300;400;700&display=swap`;
            root.style.setProperty('--font-family', `'${d.font}', sans-serif`);
        }
    }

    // --- FAVICON ---
    const favLink = document.getElementById('favicon-link');
    if(favLink) {
        // Se tiver favicon configurado, usa. Se não, mantém vazio.
        const iconUrl = isDarkMode ? (d.favDark || d.favLight) : d.favLight;
        if (iconUrl) favLink.href = iconUrl;
    }

    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if(btn) btn.innerHTML = isDarkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}

// Atualiza título e imagem para quando compartilhar o link
function updateMetaTags(title, desc, img) {
    const setMeta = (prop, val) => {
        if(!val) return;
        const tag = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
        if(tag) tag.content = val;
    };
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:image', img);
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', img);
}

/* --- MODAIS E PIX --- */
function setupGeneralEvents() {
    const modalQR = document.getElementById('qr-modal');
    const qrContainer = document.getElementById('qrcode-container');
    const pixArea = document.getElementById('pix-copy-area');
    
    window.openModal = function(title, isPix = false) {
        if(!modalQR) return;
        modalQR.style.display = 'flex';
        document.getElementById('modal-title').innerText = title;
        qrContainer.innerHTML = ''; 
        
        if (isPix) {
            if(pixArea) pixArea.style.display = 'block';
            gerarPix(qrContainer);
        } else {
            if(pixArea) pixArea.style.display = 'none';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: window.location.href,
                    width: 220, height: 220,
                    colorDark : "#000000", colorLight : "#ffffff"
                });
            }
        }
    }

    const closeBtn = document.querySelector('.close-modal');
    if(closeBtn) closeBtn.onclick = () => modalQR.style.display = 'none';
    
    if(modalQR) {
        modalQR.addEventListener('click', (e) => {
            if(e.target === modalQR) modalQR.style.display = 'none';
        });
    }

    const btnShare = document.getElementById('btn-share-page');
    if(btnShare) btnShare.onclick = () => window.openModal("Compartilhar", false);
    
    const btnPix = document.getElementById('btn-pix');
    if(btnPix) btnPix.onclick = () => window.openModal("Pagamento Pix", true);
}

function gerarPix(container) {
    if (!appConfig || !appConfig.pix) return;

    const p = appConfig.pix; 
    const payload = new PixPayload(p.key, p.name || "", p.city || "", p.value, "***").getPayload();

    if (typeof QRCode !== 'undefined') {
        new QRCode(container, { text: payload, width: 220, height: 220 });
    }

    const txtArea = document.getElementById('pix-code-text');
    if(txtArea) txtArea.value = payload;

    const copyBtn = document.getElementById('btn-copy-pix');
    if(copyBtn) {
        copyBtn.onclick = () => {
            if(txtArea) {
                txtArea.select();
                document.execCommand('copy');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                setTimeout(() => copyBtn.innerHTML = originalText, 2000);
            }
        };
    }
}

class PixPayload {
    constructor(key, name, city, amount, txId) {
        this.key = key;
        this.name = this.normalize(name);
        this.city = this.normalize(city);
        this.amount = amount ? Number(amount).toFixed(2) : null;
        this.txId = txId || '***';
    }
    normalize(str) { 
        if(!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 25); 
    }
    formatData(id, value) { const len = value.length.toString().padStart(2, '0'); return `${id}${len}${value}`; }
    getPayload() {
        let payload = this.formatData('00', '01');
        const merchantInfo = this.formatData('00', 'br.gov.bcb.pix') + this.formatData('01', this.key);
        payload += this.formatData('26', merchantInfo);
        payload += this.formatData('52', '0000');
        payload += this.formatData('53', '986');
        if (this.amount) payload += this.formatData('54', this.amount);
        payload += this.formatData('58', 'BR');
        payload += this.formatData('59', this.name);
        payload += this.formatData('60', this.city);
        const additionalData = this.formatData('05', this.txId);
        payload += this.formatData('62', additionalData);
        payload += '6304';
        payload += this.crc16(payload);
        return payload;
    }
    crc16(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            crc ^= (c << 8);
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
                else crc = crc << 1;
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }
}