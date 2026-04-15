/**
 * Salbero — Modal System
 * ======================
 * Единая система модалок:
 *   - Оформление заказа (order)
 *   - Оформление заявки (request) — индивидуальный размер
 *   - Получить 3D модель (model3d)
 *   - Модалки успеха (orderSuccess, requestSuccess, modelSuccess)
 *
 * API:
 *   SalberoModal.open(type, data)   — открыть модалку
 *   SalberoModal.close()            — закрыть текущую модалку
 */

(function () {
    'use strict';

    /* ═══════════════════════════════════════
       SVG Templates
       ═══════════════════════════════════════ */

    var CLOSE_SVG = '<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M0.605957 0.605469L17.606 17.6055" stroke="#E8D6AC" stroke-width="1.2119" stroke-linecap="round"/>' +
        '<path d="M17.6104 0.605469L0.610351 17.6055" stroke="#E8D6AC" stroke-width="1.2119" stroke-linecap="round"/>' +
        '</svg>';

    var CHECKBOX_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="10" cy="10" r="10" fill="#E8D6AC"/>' +
        '<circle cx="10" cy="10" r="7" fill="#16120E"/>' +
        '</svg>';

    var SUCCESS_ICON_SVG = '<svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M27.0835 52.084C32.8674 52.084 38.4723 50.0785 42.9433 46.4092C47.4143 42.74 50.4747 37.634 51.6031 31.9612C52.7315 26.2885 51.858 20.4 49.1315 15.2991C46.405 10.1981 41.9942 6.20039 36.6506 3.987C31.307 1.7736 25.3612 1.4815 19.8264 3.16047C14.2916 4.83945 9.51011 8.3856 6.29676 13.1947C3.08341 18.0038 1.63696 23.7784 2.20388 29.5344C2.7708 35.2904 5.316 40.6718 9.40582 44.7616" stroke="#A98058" stroke-width="4.16667" stroke-linecap="round"/>' +
        '<path d="M38.1929 21.5293L26.2513 35.8592C25.3408 36.9518 24.8855 37.4982 24.2736 37.5259C23.6617 37.5537 23.1588 37.0508 22.1531 36.0451L15.9706 29.8626" stroke="#A98058" stroke-width="4.16667" stroke-linecap="round"/>' +
        '</svg>';

    /* ═══════════════════════════════════════
       Overlay Singleton
       ═══════════════════════════════════════ */

    var overlay = null;
    var currentModal = null;

    function getOverlay() {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.id = 'modal-overlay';
            document.body.appendChild(overlay);

            // Клик по оверлею (вне модалки) — закрытие
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    closeModal();
                }
            });

            // Escape
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    closeModal();
                }
            });
        }
        return overlay;
    }

    /* ═══════════════════════════════════════
       Open / Close
       ═══════════════════════════════════════ */

    function openModal(type, data) {
        var ov = getOverlay();
        data = data || {};

        // Построить контент модалки
        var modalEl = buildModal(type, data);
        if (!modalEl) return;

        // Заменить содержимое оверлея
        ov.innerHTML = '';
        ov.appendChild(modalEl);
        currentModal = modalEl;

        // Показать с небольшой задержкой для анимации
        requestAnimationFrame(function () {
            ov.classList.add('active');
            document.body.classList.add('modal-open');
        });
    }

    function closeModal() {
        if (!overlay) return;

        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');

        // Дождаться окончания анимации и очистить
        setTimeout(function () {
            if (overlay && !overlay.classList.contains('active')) {
                overlay.innerHTML = '';
                currentModal = null;
            }
        }, 400);
    }

    /* ═══════════════════════════════════════
       Build Modal Content
       ═══════════════════════════════════════ */

    function buildModal(type, data) {
        switch (type) {
            case 'order':
                return buildOrderModal(data);
            case 'request':
                return buildRequestModal(data);
            case 'model3d':
                return buildModel3dModal(data);
            case 'orderSuccess':
                return buildSuccessModal('ВАШ ЗАКАЗ<br>УСПЕШНО ОФОРМЛЕН', 'В ближайшее время менеджер<br>с вами свяжется');
            case 'requestSuccess':
                return buildSuccessModal('ВАША ЗАЯВКА<br>УСПЕШНО ОТПРАВЛЕНА', 'В ближайшее время менеджер<br>с вами свяжется');
            case 'modelSuccess':
                return buildSuccessModal('СПАСИБО<br>ЗА ИНТЕРЕС', 'Отправим файлы<br>на указанную вами почту');
            default:
                return null;
        }
    }

    /* ═══════════════════════════════════════
       Close Button Helper
       ═══════════════════════════════════════ */

    function createCloseBtn() {
        var btn = document.createElement('button');
        btn.className = 'modal__close';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Закрыть');
        btn.innerHTML = CLOSE_SVG;
        btn.addEventListener('click', closeModal);
        return btn;
    }

    /* ═══════════════════════════════════════
       Form Fields Helper
       ═══════════════════════════════════════ */

    function createFormFields() {
        var wrapper = document.createElement('div');
        wrapper.className = 'modal__fields';

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'modal__input';
        nameInput.name = 'name';
        nameInput.placeholder = 'Ваше имя*';
        nameInput.required = true;
        nameInput.autocomplete = 'name';

        var emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.className = 'modal__input';
        emailInput.name = 'email';
        emailInput.placeholder = 'Электронная почта*';
        emailInput.required = true;
        emailInput.autocomplete = 'email';

        var phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.className = 'modal__input';
        phoneInput.name = 'phone';
        phoneInput.placeholder = 'Телефон*';
        phoneInput.required = true;
        phoneInput.autocomplete = 'tel';

        // Маска телефона
        phoneInput.addEventListener('input', function () {
            formatPhoneInput(phoneInput);
        });
        phoneInput.addEventListener('focus', function () {
            if (!phoneInput.value) {
                phoneInput.value = '+7 ';
            }
        });

        // Fix paste background on all inputs
        [nameInput, emailInput, phoneInput].forEach(function (inp) {
            inp.addEventListener('paste', function () {
                var el = this;
                setTimeout(function () {
                    el.style.backgroundColor = '#16120e';
                    el.style.color = '#fff';
                }, 0);
            });
        });

        wrapper.appendChild(nameInput);
        wrapper.appendChild(emailInput);
        wrapper.appendChild(phoneInput);

        return wrapper;
    }

    /* ═══════════════════════════════════════
       Consent Checkbox Helper
       ═══════════════════════════════════════ */

    function createConsent() {
        var label = document.createElement('label');
        label.className = 'modal__consent';

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'consent';
        checkbox.required = true;

        var checkVisual = document.createElement('span');
        checkVisual.className = 'modal__consent-check';

        var text = document.createElement('span');
        text.className = 'modal__consent-text';
        text.innerHTML = 'даю согласие на обработку <a href="#">персональных данных</a>';

        label.appendChild(checkbox);
        label.appendChild(checkVisual);
        label.appendChild(text);

        return label;
    }

    /* ═══════════════════════════════════════
       Form Validation — Enable/Disable Submit
       ═══════════════════════════════════════ */

    function setupFormValidation(modalEl) {
        var submitBtn = modalEl.querySelector('.modal__submit');
        var inputs = modalEl.querySelectorAll('.modal__input');
        var consentInput = modalEl.querySelector('input[name="consent"]');
        if (!submitBtn) return;

        // Start disabled
        submitBtn.disabled = true;

        function checkFormState() {
            var allFilled = true;
            inputs.forEach(function (inp) {
                var val = inp.value.trim();
                // For phone, check actual digits >= 11
                if (inp.name === 'phone') {
                    var digits = val.replace(/\D/g, '');
                    if (digits.length < 11) allFilled = false;
                } else {
                    if (!val) allFilled = false;
                }
            });

            var consentChecked = consentInput ? consentInput.checked : true;

            submitBtn.disabled = !(allFilled && consentChecked);
        }

        // Listen on all inputs
        inputs.forEach(function (inp) {
            inp.addEventListener('input', checkFormState);
            inp.addEventListener('paste', function () {
                setTimeout(checkFormState, 10);
            });
            inp.addEventListener('change', checkFormState);
        });

        if (consentInput) {
            consentInput.addEventListener('change', checkFormState);
        }

        // Initial check
        checkFormState();
    }

    /* ═══════════════════════════════════════
       MODAL: Оформление заказа
       ═══════════════════════════════════════ */

    function buildOrderModal(data) {
        var modal = document.createElement('div');
        modal.className = 'modal';

        // Close button
        modal.appendChild(createCloseBtn());

        // Title
        var title = document.createElement('h3');
        title.className = 'modal__title';
        title.textContent = 'ОФОРМЛЕНИЕ ЗАКАЗА';
        modal.appendChild(title);

        // Divider
        var div1 = document.createElement('div');
        div1.className = 'modal__divider';
        modal.appendChild(div1);

        // Product block
        var productBlock = document.createElement('div');
        productBlock.className = 'modal__product';

        var productInfo = document.createElement('div');
        productInfo.className = '';

        // Получаем читаемые названия
        var colorLabel = data.colorLabel || 'Оазис';
        var sizeLabel = data.sizeLabel || '1750x1500';
        var typeLabel = data.typeLabel || '3D с подсветкой';
        var priceValue = data.price || 114990;
        var quantity = data.quantity || 1;

        productInfo.innerHTML = 'Панно «TRIO» ' + colorLabel + '<br>' +
            'Размер: ' + sizeLabel + ' мм<br>' +
            'Вид: ' + typeLabel;

        var productRight = document.createElement('div');
        productRight.className = 'modal__product-right';

        // Quantity counter
        var qtyWrap = document.createElement('div');
        qtyWrap.className = 'modal__quantity';

        var qtyMinus = document.createElement('button');
        qtyMinus.type = 'button';
        qtyMinus.className = 'modal__quantity-btn';
        qtyMinus.textContent = '−';

        var qtyVal = document.createElement('span');
        qtyVal.className = 'modal__quantity-value';
        qtyVal.textContent = quantity;

        var qtyPlus = document.createElement('button');
        qtyPlus.type = 'button';
        qtyPlus.className = 'modal__quantity-btn';
        qtyPlus.textContent = '+';

        var priceEl = document.createElement('div');
        priceEl.className = 'modal__price';
        priceEl.textContent = formatPriceDisplay(priceValue * quantity);

        qtyMinus.addEventListener('click', function () {
            var val = parseInt(qtyVal.textContent, 10);
            if (val > 1) {
                val--;
                qtyVal.textContent = val;
                priceEl.textContent = formatPriceDisplay(priceValue * val);
            }
        });

        qtyPlus.addEventListener('click', function () {
            var val = parseInt(qtyVal.textContent, 10);
            val++;
            qtyVal.textContent = val;
            priceEl.textContent = formatPriceDisplay(priceValue * val);
        });

        qtyWrap.appendChild(qtyMinus);
        qtyWrap.appendChild(qtyVal);
        qtyWrap.appendChild(qtyPlus);

        productRight.appendChild(qtyWrap);
        productRight.appendChild(priceEl);

        productBlock.appendChild(productInfo);
        productBlock.appendChild(productRight);
        modal.appendChild(productBlock);

        // Divider
        var div2 = document.createElement('div');
        div2.className = 'modal__divider';
        modal.appendChild(div2);

        // Form fields
        var fields = createFormFields();
        modal.appendChild(fields);

        // Consent
        var consent = createConsent();
        modal.appendChild(consent);

        // Submit
        var submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'modal__submit';
        submitBtn.textContent = 'Оформить заказ';
        submitBtn.addEventListener('click', function () {
            var formData = collectFormData(modal);
            if (!formData) return;

            formData.type = 'order';
            formData.product = 'Панно «TRIO» ' + colorLabel;
            formData.size = sizeLabel;
            formData.panelType = typeLabel;
            formData.price = priceValue;
            formData.quantity = parseInt(qtyVal.textContent, 10);
            formData.totalPrice = priceValue * formData.quantity;

            submitToBitrix(formData, function () {
                openModal('orderSuccess');
            });
        });
        modal.appendChild(submitBtn);

        // Enable/disable submit based on form state
        setupFormValidation(modal);

        return modal;
    }

    /* ═══════════════════════════════════════
       MODAL: Оформление заявки (инд. размер)
       ═══════════════════════════════════════ */

    function buildRequestModal(data) {
        var modal = document.createElement('div');
        modal.className = 'modal';

        modal.appendChild(createCloseBtn());

        var title = document.createElement('h3');
        title.className = 'modal__title';
        title.textContent = 'ОФОРМЛЕНИЕ ЗАЯВКИ';
        modal.appendChild(title);

        var div1 = document.createElement('div');
        div1.className = 'modal__divider';
        modal.appendChild(div1);

        var productInfo = document.createElement('div');
        productInfo.className = 'modal__product-info';

        var colorLabel = data.colorLabel || 'Оазис';
        productInfo.innerHTML = 'Панно «TRIO» ' + colorLabel + '<br>Индивидуальный размер';
        modal.appendChild(productInfo);

        var div2 = document.createElement('div');
        div2.className = 'modal__divider';
        modal.appendChild(div2);

        var fields = createFormFields();
        modal.appendChild(fields);

        var consent = createConsent();
        modal.appendChild(consent);

        var submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'modal__submit';
        submitBtn.textContent = 'Получить';
        submitBtn.addEventListener('click', function () {
            var formData = collectFormData(modal);
            if (!formData) return;

            formData.type = 'request';
            formData.product = 'Панно «TRIO» ' + colorLabel;
            formData.size = 'Индивидуальный размер';
            formData.panelType = data.typeLabel || '';

            submitToBitrix(formData, function () {
                openModal('requestSuccess');
            });
        });
        modal.appendChild(submitBtn);

        // Enable/disable submit based on form state
        setupFormValidation(modal);

        return modal;
    }

    /* ═══════════════════════════════════════
       MODAL: Получить 3D модель
       ═══════════════════════════════════════ */

    function buildModel3dModal(data) {
        var modal = document.createElement('div');
        modal.className = 'modal modal--centered';

        modal.appendChild(createCloseBtn());

        var title = document.createElement('h3');
        title.className = 'modal__title';
        title.textContent = 'ПОЛУЧИТЬ 3D МОДЕЛЬ';
        modal.appendChild(title);

        // Небольшой отступ
        var spacer = document.createElement('div');
        spacer.style.height = '20px';
        modal.appendChild(spacer);

        var fields = createFormFields();
        modal.appendChild(fields);

        var consent = createConsent();
        modal.appendChild(consent);

        var submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'modal__submit';
        submitBtn.textContent = 'Получить';
        submitBtn.addEventListener('click', function () {
            var formData = collectFormData(modal);
            if (!formData) return;

            formData.type = 'model3d';

            submitToBitrix(formData, function () {
                openModal('modelSuccess');
            });
        });
        modal.appendChild(submitBtn);

        // Enable/disable submit based on form state
        setupFormValidation(modal);

        return modal;
    }

    /* ═══════════════════════════════════════
       MODAL: Success
       ═══════════════════════════════════════ */

    function buildSuccessModal(titleHtml, subtitleHtml) {
        var modal = document.createElement('div');
        modal.className = 'modal modal--success';

        modal.appendChild(createCloseBtn());

        var icon = document.createElement('div');
        icon.className = 'modal__success-icon';
        icon.innerHTML = SUCCESS_ICON_SVG;
        modal.appendChild(icon);

        var title = document.createElement('h3');
        title.className = 'modal__success-title';
        title.innerHTML = titleHtml;
        modal.appendChild(title);

        var text = document.createElement('p');
        text.className = 'modal__success-text';
        text.innerHTML = subtitleHtml;
        modal.appendChild(text);

        return modal;
    }

    /* ═══════════════════════════════════════
       Form Utilities
       ═══════════════════════════════════════ */

    function formatPriceDisplay(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
    }

    function formatPhoneInput(input) {
        var val = input.value.replace(/\D/g, '');

        // Начинаем с 7 для России
        if (val.length === 0) {
            input.value = '';
            return;
        }

        if (val[0] === '8') val = '7' + val.slice(1);
        if (val[0] !== '7') val = '7' + val;

        var formatted = '+7';
        if (val.length > 1) formatted += ' (' + val.slice(1, 4);
        if (val.length > 4) formatted += ') ' + val.slice(4, 7);
        if (val.length > 7) formatted += ' ' + val.slice(7, 9);
        if (val.length > 9) formatted += ' ' + val.slice(9, 11);

        input.value = formatted;
    }

    function collectFormData(modalEl) {
        var nameInput = modalEl.querySelector('input[name="name"]');
        var emailInput = modalEl.querySelector('input[name="email"]');
        var phoneInput = modalEl.querySelector('input[name="phone"]');
        var consentInput = modalEl.querySelector('input[name="consent"]');

        var valid = true;

        // Валидация
        [nameInput, emailInput, phoneInput].forEach(function (input) {
            if (input) {
                input.classList.remove('modal__input--error');
                if (!input.value.trim()) {
                    input.classList.add('modal__input--error');
                    valid = false;
                }
            }
        });

        // Email формат
        if (emailInput && emailInput.value.trim()) {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                emailInput.classList.add('modal__input--error');
                valid = false;
            }
        }

        // Телефон — минимум 11 цифр
        if (phoneInput && phoneInput.value) {
            var digits = phoneInput.value.replace(/\D/g, '');
            if (digits.length < 11) {
                phoneInput.classList.add('modal__input--error');
                valid = false;
            }
        }

        // Согласие
        if (consentInput && !consentInput.checked) {
            var consentLabel = consentInput.closest('.modal__consent');
            if (consentLabel) {
                consentLabel.style.color = '#c0392b';
                setTimeout(function () {
                    consentLabel.style.color = '';
                }, 2000);
            }
            valid = false;
        }

        if (!valid) return null;

        return {
            name: nameInput ? nameInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            phone: phoneInput ? phoneInput.value.trim() : ''
        };
    }

    /* ═══════════════════════════════════════
       Bitrix Submission
       Базовая заготовка для отправки на Битрикс24.
       Замените BITRIX_WEBHOOK_URL на реальный URL вебхука.
       ═══════════════════════════════════════ */

    var BITRIX_WEBHOOK_URL = ''; // TODO: Вставить URL вебхука Битрикс24

    function submitToBitrix(formData, onSuccess) {
        // Если URL не задан — просто логируем и показываем успех
        if (!BITRIX_WEBHOOK_URL) {
            console.log('[Salbero Modal] Form data ready for Bitrix:', formData);
            if (onSuccess) onSuccess();
            return;
        }

        // Формируем данные для CRM лида в Битрикс24
        var leadData = {
            fields: {
                TITLE: buildLeadTitle(formData),
                NAME: formData.name || '',
                EMAIL: [{ VALUE: formData.email || '', VALUE_TYPE: 'WORK' }],
                PHONE: [{ VALUE: formData.phone || '', VALUE_TYPE: 'WORK' }],
                COMMENTS: buildLeadComment(formData),
                SOURCE_ID: 'WEB'
            }
        };

        // Отправляем на Битрикс
        var xhr = new XMLHttpRequest();
        xhr.open('POST', BITRIX_WEBHOOK_URL + 'crm.lead.add.json', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log('[Salbero] Lead created:', xhr.responseText);
                if (onSuccess) onSuccess();
            } else {
                console.error('[Salbero] Bitrix error:', xhr.status, xhr.responseText);
                // Всё равно показываем успех пользователю
                if (onSuccess) onSuccess();
            }
        };

        xhr.onerror = function () {
            console.error('[Salbero] Network error');
            if (onSuccess) onSuccess();
        };

        xhr.send(JSON.stringify(leadData));
    }

    function buildLeadTitle(formData) {
        switch (formData.type) {
            case 'order':
                return 'Заказ: ' + (formData.product || 'Панно TRIO') + ' × ' + (formData.quantity || 1);
            case 'request':
                return 'Заявка: ' + (formData.product || 'Панно TRIO') + ' — Индивидуальный размер';
            case 'model3d':
                return 'Запрос 3D модели';
            default:
                return 'Заявка с сайта Salbero';
        }
    }

    function buildLeadComment(formData) {
        var lines = [];
        lines.push('Тип заявки: ' + (formData.type || ''));

        if (formData.product) lines.push('Продукт: ' + formData.product);
        if (formData.size) lines.push('Размер: ' + formData.size);
        if (formData.panelType) lines.push('Вид: ' + formData.panelType);
        if (formData.price) lines.push('Цена за шт: ' + formatPriceDisplay(formData.price));
        if (formData.quantity) lines.push('Количество: ' + formData.quantity);
        if (formData.totalPrice) lines.push('Итого: ' + formatPriceDisplay(formData.totalPrice));

        return lines.join('\n');
    }

    /* ═══════════════════════════════════════
       Public API
       ═══════════════════════════════════════ */

    window.SalberoModal = {
        open: openModal,
        close: closeModal
    };

})();
