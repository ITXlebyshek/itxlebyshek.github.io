/**
 * Salbero — Brand Page Script
 * Page Scaler, Scroll Reveal, Mobile Menu
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
       ═══════════════════════════════════════ */

    var DESIGN_WIDTH = 1920;

    function applyScale() {
        var container = $('.container');
        if (!container) return;

        if (window.innerWidth <= 991) {
            container.style.zoom = '';
            return;
        }

        var zoom = Math.min(1, window.innerWidth / DESIGN_WIDTH);
        container.style.zoom = zoom;
    }

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

        var desktopObserver = new IntersectionObserver(revealCallback, { threshold: 0.3 });
        var mobileObserver = new IntersectionObserver(revealCallback, { threshold: 0.1 });

        $$('section').forEach(function (section) {
            if (section.classList.contains('mob-brand')) {
                mobileObserver.observe(section);
            } else {
                desktopObserver.observe(section);
            }
        });
    }

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
