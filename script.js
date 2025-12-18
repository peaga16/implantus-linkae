/* --- ARQUIVO DE CONFIGURAÇÃO --- 
    Para alterar qualquer dado, edite os campos abaixo.
*/
const defaultConfig = {
    content: {
        name: "Implantus - Pesqueira",
        bio: "Odontologia moderna e humanizada",
        location: "Pesqueira - PE",
        phone: "+558799102586", 
        profileImg: "assets/linkaê-perfil.jpg", 
        links: [
            { title: "Falar no WhatsApp", url: "https://wa.me/558799102586", img: "assets/3.jpg" },
            { title: "Siga nosso Instagram", url: "https://instagram.com/implantus/pesqueira", img: "assets/1.jpg" },
            { title: "Localização", url: "https://maps.app.goo.gl/43T61YoqPntx9bFL8", img: "assets/2.jpg" }
        ]
    },
    design: {
        font: "Outfit",
        favLight: "assets/linkaê-favicon-light.jpg", 
        favDark: "assets/linkaê-favicon-dark.jpg",
        bgMobile: "assets/linkaê-mobile-background.jpg", 
        bgDesktop: "assets/linkaê-desktop-background.jpg" 
    },
    pix: {
        key: "71288441479",
        name: "Pedro Henrique Alves Andrade",
        city: "Pesqueira - PE",
        value: 0.00
    }
};

// Agora usamos DIRETAMENTE a configuração do código (Back-End style)
// Isso garante que qualquer alteração no código acima reflita imediatamente na página
const appConfig = defaultConfig;

// Apenas o tema (escuro/claro) continua salvo no navegador do usuário
let isDarkMode = localStorage.getItem('theme') !== 'light'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Renderiza o site com os dados do código
    renderSite();

    // 2. Configura o botão de tema
    const themeBtn = document.getElementById('theme-toggle');
    updateThemeIcon();
    
    themeBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        renderSite(); 
    });

    // 3. Inicia eventos do Modal (Pix e Share)
    setupGeneralEvents();
});

function renderSite() {
    const c = appConfig.content;
    const d = appConfig.design;

    // Textos
    document.getElementById('ui-name').innerText = c.name;
    document.getElementById('ui-bio').innerText = c.bio;
    document.getElementById('ui-location').innerText = c.location;
    
    // Imagens e Links
    document.getElementById('ui-profile-img').src = c.profileImg;
    document.getElementById('ui-btn-call').href = `tel:${c.phone}`;
    document.title = c.name + " - Links";

    // Renderizar Lista de Links
    const linksList = document.getElementById('links-list');
    linksList.innerHTML = ''; 
    
    c.links.forEach(link => {
        const linkHtml = `
            <a href="${link.url}" target="_blank" class="link-banner-16x9" title="${link.title}">
                <img src="${link.img}" alt="Banner para ${link.title}" onerror="this.src='assets/3.jpg'">
            </a>
        `;
        linksList.innerHTML += linkHtml;
    });

    // CSS Variables (Fundo e Fonte)
    const root = document.documentElement;
    root.style.setProperty('--bg-image-mob', `url('${d.bgMobile}')`);
    root.style.setProperty('--bg-image-desk', `url('${d.bgDesktop}')`);
    
    if(d.font) {
        const fontLink = document.getElementById('google-font-link');
        fontLink.href = `https://fonts.googleapis.com/css2?family=${d.font.replace(/\s+/g, '+')}:wght@300;400;700&display=swap`;
        root.style.setProperty('--font-family', `'${d.font}', sans-serif`);
    }

    // Favicon
    const favLink = document.getElementById('favicon-link');
    if(favLink) {
        favLink.href = isDarkMode ? d.favDark : d.favLight;
    }

    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if(btn) btn.innerHTML = isDarkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}

function setupGeneralEvents() {
    const modalQR = document.getElementById('qr-modal');
    const qrContainer = document.getElementById('qrcode-container');
    const pixArea = document.getElementById('pix-copy-area');
    
    window.openModal = function(title, isPix = false) {
        modalQR.style.display = 'flex';
        document.getElementById('modal-title').innerText = title;
        qrContainer.innerHTML = ''; 
        
        if (isPix) {
            pixArea.style.display = 'block';
            gerarPix(qrContainer);
        } else {
            pixArea.style.display = 'none';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: window.location.href,
                    width: 220, height: 220,
                    colorDark : "#000000", colorLight : "#ffffff"
                });
            }
        }
    }

    document.querySelector('.close-modal').onclick = () => modalQR.style.display = 'none';
    
    modalQR.addEventListener('click', (e) => {
        if(e.target === modalQR) modalQR.style.display = 'none';
    });

    document.getElementById('btn-share-page').onclick = () => window.openModal("Compartilhar", false);
    document.getElementById('btn-pix').onclick = () => window.openModal("Pagamento Pix", true);
}

function gerarPix(container) {
    const p = appConfig.pix; 
    const payload = new PixPayload(p.key, p.name, p.city, p.value, "***").getPayload();

    if (typeof QRCode !== 'undefined') {
        new QRCode(container, { text: payload, width: 220, height: 220 });
    }

    const txtArea = document.getElementById('pix-code-text');
    txtArea.value = payload;

    document.getElementById('btn-copy-pix').onclick = () => {
        txtArea.select();
        document.execCommand('copy');
        
        const btn = document.getElementById('btn-copy-pix');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    };
}

class PixPayload {
    constructor(key, name, city, amount, txId) {
        this.key = key;
        this.name = this.normalize(name);
        this.city = this.normalize(city);
        this.amount = amount ? amount.toFixed(2) : null;
        this.txId = txId || '***';
    }
    normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 25); }
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