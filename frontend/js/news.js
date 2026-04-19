import { API } from './api.js';
import { I18n } from './i18n.js';

let currentLang = I18n.getLang();

document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    setupLanguageToggle();
    initHamburgerMenu();
    setupFilters();
    loadNews(currentLang);
});

function setupLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    if (!langToggle) return;
    langToggle.textContent = I18n.getLang().toUpperCase();
    langToggle.addEventListener('click', async () => {
        const newLang = I18n.getLang() === 'it' ? 'en' : 'it';
        await I18n.setLang(newLang);
        langToggle.textContent = newLang.toUpperCase();
        currentLang = newLang;
        updateFilterActive();
        loadNews(newLang);
    });
}

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    if (hamburger && mainNav) {
        hamburger.addEventListener('click', () => mainNav.classList.toggle('mobile-open'));
    }
}

function setupFilters() {
    document.querySelectorAll('[data-lang-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.langFilter;
            updateFilterActive();
            loadNews(currentLang);
        });
    });
    updateFilterActive();
}

function updateFilterActive() {
    document.querySelectorAll('[data-lang-filter]').forEach(b => {
        b.classList.toggle('active', b.dataset.langFilter === currentLang);
    });
}

async function loadNews(lang) {
    const grid = document.getElementById('news-grid');
    const noMsg = document.getElementById('no-news-message');
    if (!grid) return;
    grid.innerHTML = `<p>${I18n.t('general.loading')}</p>`;
    if (noMsg) noMsg.style.display = 'none';

    try {
        const news = await API.news(lang);
        grid.innerHTML = '';
        const list = Array.isArray(news) ? news : [];
        if (!list.length) {
            if (noMsg) {
                noMsg.textContent = I18n.t('news.no_news');
                noMsg.style.display = 'block';
            }
            updateLastUpdate();
            return;
        }
        list.forEach(n => grid.appendChild(renderCard(n)));
        updateLastUpdate();
    } catch (err) {
        console.error('Errore news:', err);
        grid.innerHTML = `<p>${I18n.t('general.error')}</p>`;
    }
}

function renderCard(n) {
    const card = document.createElement('article');
    card.classList.add('news-card');
    const titolo = n.titolo || n.title || '';
    const testo = n.testo || n.description || '';
    const data = n.data ? new Date(n.data) : null;
    const link = n.url || n.link || '';

    card.innerHTML = `
        <h3>${escapeHtml(titolo)}</h3>
        ${data && !isNaN(data) ? `<time>${data.toLocaleString()}</time>` : ''}
        <p>${escapeHtml(testo)}</p>
        ${link ? `<a href="${escapeAttr(link)}" target="_blank" rel="noopener">${I18n.t('general.link')}</a>` : ''}
    `;
    return card;
}

function updateLastUpdate() {
    const el = document.getElementById('last-update-time');
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    el.textContent = `${I18n.t('station.last_update')} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
function escapeAttr(s) {
    return escapeHtml(s);
}
