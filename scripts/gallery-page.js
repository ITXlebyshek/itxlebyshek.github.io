/**
 * Salbero — Gallery Page Script
 * Page Scaler, Scroll Reveal (per-item), Mobile Menu, GLightbox init
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
                setTimeout(function() { preloader.style.display = 'none'; }, 800);
            }, 1500);
        };
        if (document.readyState === 'complete') { hidePreloader(); }
        else { window.addEventListener('load', hidePreloader); }
    }
    initPreloader();

    function $(selector, context) {
        return (context || document).querySelector(selector);
    }

    function $$(selector, context) {
        return Array.from((context || document).querySelectorAll(selector));
    }

    /* ═══════════════════════════════════════
       Page Scaler — CSS zoom (gallery uses container-like max-width)
       ═══════════════════════════════════════ */

    var DESIGN_WIDTH = 1920;

    function applyScale() {
        var page = $('.gallery-page');
        if (!page) return;

        if (window.innerWidth <= 991) {
            page.style.zoom = '';
            return;
        }

        var zoom = Math.min(1, window.innerWidth / DESIGN_WIDTH);
        page.style.zoom = zoom;
    }

    applyScale();
    window.addEventListener('resize', applyScale, { passive: true });
    window.addEventListener('load', applyScale);

    /* ═══════════════════════════════════════
       Scroll Reveal — per gallery item
       ═══════════════════════════════════════ */

    function initScrollReveal() {
        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    // Stagger if multiple items enter at once
                    var item = entry.target;
                    var siblings = $$('.gallery-item');
                    var idx = siblings.indexOf(item);
                    var delay = (idx % 3) * 100; // stagger per column

                    setTimeout(function () {
                        item.classList.add('visible');
                    }, delay);

                    obs.unobserve(item);
                }
            });
        }, { threshold: 0.15 });

        $$('.gallery-item').forEach(function (item) {
            observer.observe(item);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollReveal);
    } else {
        initScrollReveal();
    }

    /* ═══════════════════════════════════════
       GLightbox Initialization
       ═══════════════════════════════════════ */

    function initLightbox() {
        if (typeof GLightbox === 'undefined') return;

        GLightbox({
            selector: '.glightbox',
            touchNavigation: true,
            touchFollowAxis: true,
            loop: true,
            zoomable: true,
            draggable: true,
            dragToleranceX: 40,
            dragToleranceY: 65,
            openEffect: 'fade',
            closeEffect: 'fade',
            cssEfects: {
                fade: { in: 'fadeIn', out: 'fadeOut' }
            },
            slideExtraAttributes: {
                title: '',
                description: ''
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLightbox);
    } else {
        initLightbox();
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

})();
