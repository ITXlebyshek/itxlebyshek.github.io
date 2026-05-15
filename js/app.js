/**
 * Генератор заявок — app.js
 * Загружает .docx шаблоны, подставляет данные через docxtemplater,
 * собирает ZIP и скачивает.
 */

// Шаблоны: файл → имя в ZIP
const TEMPLATES = [
    { file: 'templates/beeline.docx',    zipName: 'Заявка Билайн.docx' },
    { file: 'templates/megafon.docx',    zipName: 'Заявка Мегафон.docx' },
    { file: 'templates/rostelecom.docx', zipName: 'Заявка Ростелеком.docx' },
    { file: 'templates/tele2.docx',      zipName: 'Заявка Теле2.docx' },
    { file: 'templates/tmobile.docx',    zipName: 'Заявка Т мобайл.docx' },
    { file: 'templates/alfa.docx',       zipName: 'Заявка Альфа.docx' },
    { file: 'templates/mts.docx',        zipName: 'Заявка МТС.docx', isMts: true },
];

/**
 * Форматирование времени: "11:30" → "11 час 30 мин"
 */
function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    return `${parseInt(h)} час ${m} мин`;
}

/**
 * Форматирование даты: "2026-05-05" → "05.05.2026г."
 */
function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}г.`;
}

/**
 * Форматирование даты+времени: → "05.05.2026г. 11 час 00 мин"
 */
function formatDateTime(dateStr, timeStr) {
    return `${formatDate(dateStr)} ${formatTime(timeStr)}`;
}

/**
 * Прибавить N часов к времени, вернуть "HH час MM мин"
 */
function addHours(dateStr, timeStr, hours) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [h, min] = timeStr.split(':').map(Number);
    const dt = new Date(y, m - 1, d, h + hours, min);
    const rH = dt.getHours();
    const rM = String(dt.getMinutes()).padStart(2, '0');
    return `${rH} час ${rM} мин`;
}

/**
 * Собрать данные из формы
 */
function collectFormData() {
    const nomer = document.getElementById('nomer').value;
    const vremya = document.getElementById('vremya_napravleniya').value;
    const reshDate = document.getElementById('data_resheniya_date').value;
    const reshTime = document.getElementById('data_resheniya_time').value;
    const nachDate = document.getElementById('data_nachala_date').value;
    const nachTime = document.getElementById('data_nachala_time').value;
    const tekst = document.getElementById('tekst').value;

    return {
        nomer: nomer,
        vremya_napravleniya: formatTime(vremya),
        data_resheniya: formatDateTime(reshDate, reshTime),
        data_nachala: formatDateTime(nachDate, nachTime),
        tekst: tekst,
        // МТС: время окончания = время начала + 4 часа
        vremya_okonchaniya: addHours(nachDate, nachTime, 4),
    };
}

/**
 * Загрузить шаблон .docx как ArrayBuffer
 */
async function loadTemplate(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Не удалось загрузить ${url}: ${resp.status}`);
    return resp.arrayBuffer();
}

/**
 * Заполнить шаблон данными
 */
function fillTemplate(templateBuf, data) {
    const zip = new PizZip(templateBuf);
    const doc = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' },
    });
    doc.render(data);
    return doc.getZip().generate({ type: 'uint8array', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/**
 * Показать статус
 */
function showStatus(msg, type = 'success') {
    // Remove old
    const old = document.querySelector('.status');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = `status status--${type}`;
    el.textContent = msg;
    document.getElementById('submitBtn').insertAdjacentElement('afterend', el);

    if (type === 'success') {
        setTimeout(() => el.remove(), 5000);
    }
}

/**
 * Главная функция генерации
 */
async function generate() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.classList.add('form__submit--loading');

    try {
        const data = collectFormData();
        const zip = new JSZip();

        // Загружаем и заполняем все шаблоны
        const promises = TEMPLATES.map(async (tpl) => {
            const buf = await loadTemplate(tpl.file);
            const filled = fillTemplate(buf, data);
            zip.file(tpl.zipName, filled);
        });

        await Promise.all(promises);

        // Генерируем и скачиваем ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `Заявки_${data.nomer}.zip`);

        showStatus(`✓ Архив «Заявки_${data.nomer}.zip» скачан`);
    } catch (err) {
        console.error(err);
        showStatus(`Ошибка: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.classList.remove('form__submit--loading');
    }
}

// Обработка формы
document.getElementById('formZayavki').addEventListener('submit', (e) => {
    e.preventDefault();
    generate();
});

// Автозаполнение сегодняшней даты
const today = new Date().toISOString().split('T')[0];
document.getElementById('data_resheniya_date').value = today;
document.getElementById('data_nachala_date').value = today;

// Счётчик символов текста оповещения
const tekstInput = document.getElementById('tekst');
const tekstCount = document.getElementById('tekstCount');
function updateCounter() {
    const len = tekstInput.value.length;
    tekstCount.textContent = len;
    tekstCount.parentElement.classList.toggle('form__counter--warn', len >= 120);
    tekstCount.parentElement.classList.toggle('form__counter--over', len >= 134);
}
tekstInput.addEventListener('input', updateCounter);

// ========== Пароль при входе ==========
(function () {
    const PASS = '4321';
    const KEY = 'zayavki_auth';

    const app = document.querySelector('.app');

    // Прячем контент — без JS его не показать
    app.style.display = 'none';

    function unlock() {
        app.style.display = '';
    }

    // Если уже авторизован в этой сессии
    if (sessionStorage.getItem(KEY) === '1') {
        unlock();
        return;
    }

    // Создаём экран входа
    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
        <div class="auth-box">
            <h2 class="auth-box__title">Вход</h2>
            <input type="password" class="form__input auth-box__input" id="authPass" placeholder="Пароль" autofocus>
            <button class="form__submit auth-box__btn" id="authBtn">Войти</button>
            <div class="auth-box__error" id="authError"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('authPass');
    const btn = document.getElementById('authBtn');
    const error = document.getElementById('authError');

    function tryLogin() {
        if (input.value === PASS) {
            sessionStorage.setItem(KEY, '1');
            overlay.classList.add('auth-overlay--hide');
            setTimeout(() => {
                overlay.remove();
                unlock();
            }, 300);
        } else {
            error.textContent = 'Неверный пароль';
            input.value = '';
            input.focus();
        }
    }

    btn.addEventListener('click', tryLogin);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryLogin();
    });
})();
