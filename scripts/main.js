/**
 * Salbero Panno — Main Script
 * No ES modules — works directly via file:// protocol
 */

(function () {
    'use strict';

    function initPreloader() {
        var preloader = document.getElementById('preloader');
        if (!preloader) return;

        var hidePreloader = function () {
            setTimeout(function () {
                preloader.classList.add('hidden');
                document.body.classList.remove('preloader-active');
                setTimeout(function() {
                    preloader.style.display = 'none';
                }, 800);
            }, 1500);
        };

        if (document.readyState === 'complete') {
            hidePreloader();
        } else {
            window.addEventListener('load', hidePreloader);
        }
    }

    initPreloader();

    /* ═══════════════════════════════════════
       DOM Utilities
       ═══════════════════════════════════════ */

    function $(selector, context) {
        return (context || document).querySelector(selector);
    }

    function $$(selector, context) {
        return Array.from((context || document).querySelectorAll(selector));
    }

    /* ═══════════════════════════════════════
       Page Scaler — CSS zoom
       Браузерный scroll-anchoring (overflow-anchor: auto)
       сам удерживает позицию — JS-коррекция не нужна.
       ═══════════════════════════════════════ */

    var DESIGN_WIDTH = 1920;

    function applyScale() {
        var container = $('.container');
        if (!container) return;

        // На мобильных (≤991px) зум не нужен — мобильные секции fluid
        if (window.innerWidth <= 991) {
            container.style.zoom = '';
            return;
        }

        var zoom = Math.min(1, window.innerWidth / DESIGN_WIDTH);
        container.style.zoom = zoom;
    }

    // Инициализация
    applyScale();

    window.addEventListener('resize', function () {
        applyScale();
    }, { passive: true });

    window.addEventListener('load', applyScale);

    /* ═══════════════════════════════════════
       Scroll Reveal — IntersectionObserver
       ═══════════════════════════════════════ */

    function initScrollReveal() {
        var revealCallback = function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        };

        // Десктопные секции — порог 30%
        var desktopObserver = new IntersectionObserver(revealCallback, { threshold: 0.3 });
        // Мобильные секции — порог 10% (длинные изображения)
        var mobileObserver = new IntersectionObserver(revealCallback, { threshold: 0.1 });

        $$('section').forEach(function (section) {
            if (section.classList.contains('mob-section')) {
                mobileObserver.observe(section);
            } else {
                desktopObserver.observe(section);
            }
        });
    }

    // Init after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollReveal);
    } else {
        initScrollReveal();
    }

    /* ═══════════════════════════════════════
       Mobile Menu Toggle
       ═══════════════════════════════════════ */
    function initMobileMenu() {
        var burger = $('.header__burger');
        var mobileMenu = $('#mobile-menu');
        var closeLinks = $$('.mobile-menu__link--close');

        if (!burger || !mobileMenu) return;

        function toggleMenu() {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');

            if (mobileMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        burger.addEventListener('click', toggleMenu);

        // Закрываем меню при клике на якорные ссылки
        closeLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                burger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    /* ═══════════════════════════════════════
       Price Calculator
       Данные берутся из scripts/calculator-data.js
       ═══════════════════════════════════════ */

    function formatPrice(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
    }

    /**
     * Одометр на фиксированных 6 колонках: [d][d][d][ ][d][d][d] ₽
     * Первая колонка плавно скрывается при digit=0 (пятизначные цены)
     */
    function buildOdometer(container) {
        container.innerHTML = '';
        container._cols = [];
        container._colEls = [];

        for (var i = 0; i < 6; i++) {
            // Пробел-разделитель после 3-й цифры (между col 2 и col 3)
            if (i === 3) {
                var spacer = document.createElement('span');
                spacer.className = 'calc-digit-space';
                container.appendChild(spacer);
            }

            var col = document.createElement('span');
            col.className = 'calc-digit-col';
            if (i === 0) col.classList.add('calc-digit-col--leading');

            var strip = document.createElement('span');
            strip.className = 'calc-digit-strip';
            for (var d = 0; d <= 9; d++) {
                var cell = document.createElement('span');
                cell.textContent = d;
                strip.appendChild(cell);
            }
            col.appendChild(strip);
            container.appendChild(col);
            container._cols.push(strip);
            container._colEls.push(col);
        }
        // Суффикс ₽
        var suffix = document.createElement('span');
        suffix.className = 'calc-digit-suffix';
        suffix.textContent = '₽';
        container.appendChild(suffix);
        container._built = true;
    }

    function animatePrice(container, price) {
        if (!container._built) {
            buildOdometer(container);
            // Мгновенно ставим начальное значение без анимации
            var initStr = ('000000' + price).slice(-6);
            for (var j = 0; j < container._cols.length; j++) {
                container._cols[j].style.transition = 'none';
                container._cols[j].style.transform = 'translateY(-' + parseInt(initStr[j], 10) + 'em)';
            }
            var leadCol = container._colEls[0];
            if (parseInt(initStr[0], 10) === 0) {
                leadCol.style.transition = 'none';
                leadCol.style.width = '0';
                leadCol.style.opacity = '0';
            }
            void container.offsetHeight;
            // Возвращаем transition
            for (var k = 0; k < container._cols.length; k++) {
                container._cols[k].style.transition = '';
            }
            leadCol.style.transition = '';
            return;
        }

        var str = ('000000' + price).slice(-6);
        var cols = container._cols;
        var leadColEl = container._colEls[0];
        var leadDigit = parseInt(str[0], 10);

        for (var i = 0; i < cols.length; i++) {
            var digit = parseInt(str[i], 10);
            var strip = cols[i];
            var delay = (cols.length - 1 - i) * 50;
            strip.style.transitionDelay = delay + 'ms';
            strip.style.transform = 'translateY(-' + digit + 'em)';
        }

        // Плавно скрываем/показываем первую колонку
        if (leadDigit === 0) {
            leadColEl.style.width = '0';
            leadColEl.style.opacity = '0';
        } else {
            leadColEl.style.width = '';
            leadColEl.style.opacity = '1';
        }
    }

    /**
     * Получить label по id из массива опций
     */
    function getLabelById(arr, id) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].id === id) return arr[i].label;
        }
        return id;
    }

    function initCalculator() {
        var data = window.CALC_DATA;
        if (!data) return;

        var section = $('#section-14');
        if (!section) return;

        var priceEl = $('#calc-price');
        var previewImgEl = $('#calc-preview-image');
        var groups = $$('.calc-group', section);
        var scaleItems = $$('.calc-scale-item', section);

        // Текущий выбор — инициализируем из defaults
        var selected = {
            color: data.defaults.color,
            type: data.defaults.type,
            size: data.defaults.size
        };

        // ── Обработка кликов по кнопкам ──
        groups.forEach(function (group) {
            var buttons = $$('.calc-btn', group);
            buttons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    buttons.forEach(function (b) {
                        b.classList.remove('calc-btn--active');
                    });
                    btn.classList.add('calc-btn--active');

                    var groupName = group.getAttribute('data-group');

                    if (groupName === 'color') {
                        selected.color = btn.getAttribute('data-color');
                    } else if (groupName === 'type') {
                        selected.type = btn.getAttribute('data-type');
                    } else if (groupName === 'size') {
                        selected.size = btn.getAttribute('data-size');
                        syncScale(selected.size);
                    }

                    recalculate();
                });
            });
        });

        // ── Обработка кликов по человечкам ──
        scaleItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var sizeVal = item.getAttribute('data-scale-size');
                selected.size = sizeVal;

                var sizeGroup = $('[data-group="size"]', section);
                if (sizeGroup) {
                    $$('.calc-btn', sizeGroup).forEach(function (b) {
                        b.classList.remove('calc-btn--active');
                        if (b.getAttribute('data-size') === sizeVal) {
                            b.classList.add('calc-btn--active');
                        }
                    });
                }
                syncScale(sizeVal);
                recalculate();
            });
        });

        function syncScale(sizeVal) {
            scaleItems.forEach(function (item) {
                item.classList.remove('calc-scale-item--active');
                if (item.getAttribute('data-scale-size') === sizeVal) {
                    item.classList.add('calc-scale-item--active');
                }
            });
        }



        function recalculate() {
            // Получаем цену напрямую из матрицы
            var price = 0;
            try {
                price = data.prices[selected.color][selected.type][selected.size];
            } catch (e) {
                price = 0;
            }

            if (priceEl) {
                animatePrice(priceEl, price);
            }

            // Обновляем превью-картинку
            if (previewImgEl && data.images) {
                try {
                    var imageFile = data.images[selected.color][selected.type][selected.size];
                    if (imageFile) {
                        previewImgEl.src = data.imagePath + imageFile;
                        previewImgEl.alt = imageFile;
                    }
                } catch (e) {
                    // Если картинка не найдена — не трогаем
                }
            }
        }

        // Начальный расчёт
        recalculate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalculator);
    } else {
        initCalculator();
    }

    /* ═══════════════════════════════════════
       Mobile Calculator
       Использует те же CALC_DATA данные
       ═══════════════════════════════════════ */

    function initMobileCalculator() {
        var data = window.CALC_DATA;
        if (!data) return;

        var section = $('#mob-section-13');
        if (!section) return;

        var priceEl = $('#mob-calc-price');
        var previewEl = $('#mob-calc-preview-image');

        var colorItems = $$('.mob-calc__color-item', section);
        var typeItems = $$('.mob-calc__type-item', section);
        var sizeItems = $$('.mob-calc__size-item', section);

        var selected = {
            color: data.defaults.color,
            type: data.defaults.type,
            size: data.defaults.size
        };

        // Утилита: найти и активировать элемент
        function activateItem(items, value, attrName) {
            items.forEach(function (item) {
                var input = item.querySelector('input');
                if (input && input.value === value) {
                    item.classList.add('active');
                    input.checked = true;
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // Инициализация дефолтных значений
        activateItem(colorItems, selected.color);
        activateItem(typeItems, selected.type);
        activateItem(sizeItems, selected.size);

        // Обработка кликов — цвет
        colorItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var input = item.querySelector('input');
                if (input) {
                    selected.color = input.value;
                    activateItem(colorItems, selected.color);
                    recalc();
                }
            });
        });

        // Обработка кликов — тип
        typeItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var input = item.querySelector('input');
                if (input) {
                    selected.type = input.value;
                    activateItem(typeItems, selected.type);
                    recalc();
                }
            });
        });

        // Обработка кликов — размер
        sizeItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var input = item.querySelector('input');
                if (input) {
                    selected.size = input.value;
                    activateItem(sizeItems, selected.size);
                    recalc();
                }
            });
        });

        function recalc() {
            var price = 0;
            try {
                price = data.prices[selected.color][selected.type][selected.size];
            } catch (e) {
                price = 0;
            }

            if (priceEl) {
                priceEl.textContent = formatPrice(price);
            }

            if (previewEl && data.images) {
                try {
                    var imageFile = data.images[selected.color][selected.type][selected.size];
                    if (imageFile) {
                        previewEl.src = data.imagePath + imageFile;
                    }
                } catch (e) {}
            }
        }

        // Начальный расчёт
        recalc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileCalculator);
    } else {
        initMobileCalculator();
    }

    /* ═══════════════════════════════════════
       Modal Triggers
       Подключаем кнопки к модалкам
       ═══════════════════════════════════════ */

    function initModalTriggers() {
        if (!window.SalberoModal) return;

        var data = window.CALC_DATA;

        /* ── Хелпер: получить текущие выбранные значения калькулятора ── */
        function getCalcSelected() {
            var section14 = document.querySelector('#section-14');
            if (!section14 || !data) return null;

            var color = data.defaults.color;
            var type = data.defaults.type;
            var size = data.defaults.size;

            // Считываем текущий выбор из активных кнопок
            var activeColor = section14.querySelector('[data-group="color"] .calc-btn--active');
            var activeType = section14.querySelector('[data-group="type"] .calc-btn--active');
            var activeSize = section14.querySelector('[data-group="size"] .calc-btn--active');

            if (activeColor) color = activeColor.getAttribute('data-color');
            if (activeType) type = activeType.getAttribute('data-type');
            if (activeSize) size = activeSize.getAttribute('data-size');

            var price = 0;
            try { price = data.prices[color][type][size]; } catch (e) {}

            return {
                color: color,
                type: type,
                size: size,
                price: price,
                colorLabel: getLabelById(data.colors, color),
                typeLabel: getLabelById(data.types, type),
                sizeLabel: size
            };
        }

        /* ── Хелпер: получить выбор из мобильного калькулятора ── */
        function getMobCalcSelected() {
            var section = document.querySelector('#mob-section-13');
            if (!section || !data) return null;

            var color = data.defaults.color;
            var type = data.defaults.type;
            var size = data.defaults.size;

            var checkedColor = section.querySelector('input[name="mob-color"]:checked');
            var checkedType = section.querySelector('input[name="mob-type"]:checked');
            var checkedSize = section.querySelector('input[name="mob-size"]:checked');

            if (checkedColor) color = checkedColor.value;
            if (checkedType) type = checkedType.value;
            if (checkedSize) size = checkedSize.value;

            var price = 0;
            try { price = data.prices[color][type][size]; } catch (e) {}

            return {
                color: color,
                type: type,
                size: size,
                price: price,
                colorLabel: getLabelById(data.colors, color),
                typeLabel: getLabelById(data.types, type),
                sizeLabel: size
            };
        }

        /* ── Desktop: Оформить заказ ── */
        var calcOrderBtn = document.querySelector('#calc-order-btn');
        if (calcOrderBtn) {
            calcOrderBtn.addEventListener('click', function () {
                var sel = getCalcSelected();
                SalberoModal.open('order', sel || {});
            });
        }

        /* ── Mobile: Оформить заказ ── */
        var mobCalcOrderBtn = document.querySelector('#mob-calc-order-btn');
        if (mobCalcOrderBtn) {
            mobCalcOrderBtn.addEventListener('click', function () {
                var sel = getMobCalcSelected();
                SalberoModal.open('order', sel || {});
            });
        }

        /* ── Section 15: Оформить заявку (инд. размер) ── */
        var s15RequestBtn = document.querySelector('#s15-request-btn');
        if (s15RequestBtn) {
            s15RequestBtn.addEventListener('click', function () {
                var sel = getCalcSelected();
                SalberoModal.open('request', sel ? { colorLabel: sel.colorLabel, typeLabel: sel.typeLabel } : {});
            });
        }

        /* ── Mobile Section 15: Оформить заявку ── */
        var mobS15RequestBtn = document.querySelector('#mob-s15-request-btn');
        if (mobS15RequestBtn) {
            mobS15RequestBtn.addEventListener('click', function () {
                var sel = getMobCalcSelected();
                SalberoModal.open('request', sel ? { colorLabel: sel.colorLabel, typeLabel: sel.typeLabel } : {});
            });
        }

        /* ── Desktop: Получить 3D Модель ── */
        var s16ModelBtn = document.querySelector('#s16-card-model');
        if (s16ModelBtn) {
            s16ModelBtn.addEventListener('click', function (e) {
                e.preventDefault();
                SalberoModal.open('model3d');
            });
        }

        /* ── Mobile: Получить 3D Модель ── */
        var mobModelBtn = document.querySelector('#mob-dl-card-model');
        if (mobModelBtn) {
            mobModelBtn.addEventListener('click', function (e) {
                e.preventDefault();
                SalberoModal.open('model3d');
            });
        }

        /* ── Section 24: Свяжитесь с нами ── */
        var s24ContactBtn = document.querySelector('#btn-contact-modal');
        if (s24ContactBtn) {
            s24ContactBtn.addEventListener('click', function () {
                SalberoModal.open('request');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModalTriggers);
    } else {
        initModalTriggers();
    }

    /* ═══════════════════════════════════════
       Mobile Slider (Section 18)
       ═══════════════════════════════════════ */
    function initMobileSlider() {
        var track = document.querySelector('#mob-section-18 .mob-slider__track');
        var btnPrev = document.querySelector('#mob-section-18 .mob-slider__btn--prev');
        var btnNext = document.querySelector('#mob-section-18 .mob-slider__btn--next');

        if (!track || !btnPrev || !btnNext) return;

        // Проверяем наличие контейнера и Swiper
        var swiperContainer = document.querySelector('.mob-swiper');
        if (!swiperContainer || typeof Swiper === 'undefined') return;

        new Swiper('.mob-swiper', {
            slidesPerView: 1.11, // Основной слайд занимает ~90% (100 / 1.11 ≈ 90)
            centeredSlides: true,
            spaceBetween: 10,
            loop: true,
            navigation: {
                nextEl: '.mob-slider__btn--next',
                prevEl: '.mob-slider__btn--prev',
            },
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileSlider);
    } else {
        initMobileSlider();
    }

})();
