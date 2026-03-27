// ✅ CORREÇÃO 1: Import único no topo do arquivo
import { supabase } from './supabase-config.js';

const DOC_ID = "implantus_config";

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

// ✅ CORREÇÃO 2: Apenas UM DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Renderiza skeleton imediatamente
    renderSite();

    // 2. ✅ CORREÇÃO 3: Botão de tema configurado AQUI (antes era duplicado e incompleto)
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        updateThemeIcon();
        themeBtn.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            renderSite();
        });
    }

    // 3. ✅ CORREÇÃO 4: Chama fetchFromSupabase (não fetchFromFirebase, que não existe)
    await fetchFromSupabase();

    // 4. Configura eventos dos modais e botões
    setupGeneralEvents();
});

// ✅ CORREÇÃO 5: Apenas UMA declaração de fetchFromSupabase
async function fetchFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('data')
            .eq('id', DOC_ID)
            .single();

        if (error) throw error;

        if (data) {
            appConfig = data.data;
            renderSite();
            // ✅ CORREÇÃO 6: setupGeneralEvents chamado após renderSite para garantir
            // que os botões (Pix, Share) existam no DOM antes de vincular eventos
            setupGeneralEvents();
        }
    } catch (e) {
        console.error("Erro ao carregar dados do Supabase:", e);
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
        imgEl.onerror = function () {
            this.onerror = null;
            this.src = 'https://placehold.co/400x400?text=Erro';
        };
        updateMetaTags(c.name, c.bio, c.profileImg);
    }

    const btnCall = document.getElementById('ui-btn-call');
    if (btnCall) btnCall.href = c.phone ? `tel:${c.phone}` : "#";

    // --- LISTA DE LINKS ---
    const linksList = document.getElementById('links-list');
    if (linksList && c.links && Array.isArray(c.links)) {
        linksList.innerHTML = '';
        c.links.forEach(link => {
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

    if (d.font) {
        const fontLink = document.getElementById('google-font-link');
        if (fontLink) {
            fontLink.href = `https://fonts.googleapis.com/css2?family=${d.font.replace(/\s+/g, '+')}:wght@300;400;700&display=swap`;
            root.style.setProperty('--font-family', `'${d.font}', sans-serif`);
        }
    }

    // --- FAVICON ---
    const favLink = document.getElementById('favicon-link');
    if (favLink) {
        const iconUrl = isDarkMode ? (d.favDark || d.favLight) : (d.favLight || d.favDark);
        if (iconUrl) favLink.href = iconUrl;
    }

    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = isDarkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}

function updateMetaTags(title, desc, img) {
    const setMeta = (prop, val) => {
        if (!val) return;
        const tag = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
        if (tag) tag.content = val;
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

    // ✅ CORREÇÃO 7: Evita duplicar listeners — remove antes de adicionar
    const btnShare = document.getElementById('btn-share-page');
    const btnPix = document.getElementById('btn-pix');
    const closeBtn = document.querySelector('.close-modal');

    window.openModal = function (title, isPix = false) {
        if (!modalQR) return;
        modalQR.style.display = 'flex';
        document.getElementById('modal-title').innerText = title;
        qrContainer.innerHTML = '';

        if (isPix) {
            if (pixArea) pixArea.style.display = 'block';
            gerarPix(qrContainer);
        } else {
            if (pixArea) pixArea.style.display = 'none';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: window.location.href,
                    width: 220, height: 220,
                    colorDark: "#000000", colorLight: "#ffffff"
                });
            }
        }
    };

    if (closeBtn) closeBtn.onclick = () => modalQR.style.display = 'none';

    if (modalQR) {
        modalQR.onclick = (e) => {
            if (e.target === modalQR) modalQR.style.display = 'none';
        };
    }

    if (btnShare) btnShare.onclick = () => window.openModal("Compartilhar", false);
    if (btnPix) btnPix.onclick = () => window.openModal("Pagamento Pix", true);
}

function gerarPix(container) {
    if (!appConfig || !appConfig.pix) return;

    const p = appConfig.pix;
    const payload = new PixPayload(p.key, p.name || "", p.city || "", p.value, "***").getPayload();

    if (typeof QRCode !== 'undefined') {
        new QRCode(container, { text: payload, width: 220, height: 220 });
    }

    const txtArea = document.getElementById('pix-code-text');
    if (txtArea) txtArea.value = payload;

    const copyBtn = document.getElementById('btn-copy-pix');
    if (copyBtn) {
        copyBtn.onclick = () => {
            if (txtArea) {
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
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 25);
    }
    formatData(id, value) {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    }
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