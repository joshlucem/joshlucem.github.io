/*
  Josh Lucem Portfolio - app.js
  Código principal del sitio
*/

(function() {
  'use strict';

  // Detecta si el usuario prefiere menos animaciones
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getStoredTheme() {
    try {
      const theme = window.localStorage.getItem('theme');
      return theme === 'dark' || theme === 'light' ? theme : null;
    } catch (error) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      window.localStorage.setItem('theme', theme);
    } catch (error) {
      // Ignora bloqueos de almacenamiento del navegador.
    }
  }

  function updateThemeToggle(toggle, theme) {
    if (!toggle) return;

    const isDark = theme === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // Tema claro/oscuro con persistencia en localStorage
  function initTheme() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    const saved = getStoredTheme();
    const prefersDark = colorSchemeQuery.matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', initial);
    updateThemeToggle(toggle, initial);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setStoredTheme(next);
      updateThemeToggle(toggle, next);
    });

    // Actualiza si cambia la preferencia del sistema
    const syncWithSystemTheme = (e) => {
      if (!getStoredTheme()) {
        const nextTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        updateThemeToggle(toggle, nextTheme);
      }
    };

    if (typeof colorSchemeQuery.addEventListener === 'function') {
      colorSchemeQuery.addEventListener('change', syncWithSystemTheme);
    } else if (typeof colorSchemeQuery.addListener === 'function') {
      colorSchemeQuery.addListener(syncWithSystemTheme);
    }
  }

  // Cambia el header cuando se hace scroll
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Menu hamburguesa para móviles
  function initMobileMenu() {
    const toggle = document.querySelector('.mobile-toggle');
    const menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;

    if (!menu.id) {
      menu.id = 'site-mobile-menu';
    }

    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');

    const close = () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const isOpen = !menu.classList.contains('open');
      menu.classList.toggle('open', isOpen);
      toggle.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Cierra al hacer click en un link
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', close);
    });

    // Cierra con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && menu.classList.contains('open')) {
        close();
      }
    }, { passive: true });
  }

  // Animaciones de entrada al hacer scroll (IntersectionObserver)
  function initRevealAnimations() {
    const elements = document.querySelectorAll('.reveal');
    
    if (reducedMotion) {
      elements.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '-50px' });

    elements.forEach(el => observer.observe(el));
  }

  // Scroll suave para links internos
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const targetId = href.slice(1);
        if (!targetId) return;

        const target = document.getElementById(decodeURIComponent(targetId));
        if (target) {
          e.preventDefault();
          const headerH = document.querySelector('.header')?.offsetHeight || 0;
          const top = target.getBoundingClientRect().top + window.scrollY - headerH;
          window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      });
    });
  }

  // Actualiza el año del copyright automáticamente
  function initCopyrightYear() {
    document.querySelectorAll('.current-year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  // Efecto de escritura tipo terminal
  function initTypingEffect() {
    const typingEl = document.querySelector('.hero-typing');
    if (!typingEl || reducedMotion) return;

    const text = typingEl.getAttribute('data-text') || './build.sh --portfolio';
    const speed = 50;
    let index = 0;

    function type() {
      if (index < text.length) {
        typingEl.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed + Math.random() * 40);
      } else {
        typingEl.classList.add('hero-typing-done');
        typingEl.nextElementSibling.classList.remove('terminal-cursor');
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(type, 600);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(typingEl.closest('.hero-command'));
  }

  // Sistema de idiomas
  function getStoredLang() {
    try { return window.localStorage.getItem('lang') || 'es'; }
    catch { return 'es'; }
  }

  function setStoredLang(lang) {
    try { window.localStorage.setItem('lang', lang); }
    catch {}
  }

  function getCurrentLang() {
    return document.documentElement.getAttribute('data-lang') || 'es';
  }

  function resolveKey(obj, key) {
    var parts = key.split('.');
    var value = obj;
    for (var i = 0; i < parts.length; i++) {
      if (value && value[parts[i]] !== undefined) {
        value = value[parts[i]];
      } else {
        return null;
      }
    }
    return value;
  }

  async function setLanguage(lang) {
    try {
      const res = await fetch('lang/' + lang + '.json');
      const data = await res.json();

      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        var parts = key.split('.');
        var value = data;
        for (var i = 0; i < parts.length; i++) {
          if (value && value[parts[i]] !== undefined) {
            value = value[parts[i]];
          } else {
            value = undefined;
            break;
          }
        }
        if (value !== undefined && value !== null) {
          if (el.getAttribute('data-i18n-attr')) {
            el.setAttribute(el.getAttribute('data-i18n-attr'), value);
          } else {
            el.textContent = value;
          }
        }
      });

      document.documentElement.setAttribute('data-lang', lang);
      document.documentElement.lang = lang === 'en' ? 'en' : lang === 'pt' ? 'pt' : 'es';

      document.querySelectorAll('.lang-btn').forEach(function(btn) {
        var active = btn.getAttribute('data-lang') === lang;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-checked', String(active));
      });

      var typingEl = document.querySelector('.hero-typing');
      if (typingEl) {
        var cmd = resolveKey(data, 'hero.command');
        if (cmd) {
          typingEl.setAttribute('data-text', cmd);
          if (typingEl.classList.contains('hero-typing-done')) {
            typingEl.textContent = '';
            typingEl.textContent = cmd;
          }
        }
      }

      setStoredLang(lang);
    } catch (e) {
      console.warn('i18n: could not load', lang);
    }
  }

  function initI18n() {
    var saved = getStoredLang();
    if (saved && saved !== 'es') {
      setLanguage(saved);
    }

    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var lang = this.getAttribute('data-lang');
        if (lang !== getCurrentLang()) {
          setLanguage(lang);
        }
      });
    });
  }

  // Boton volver arriba
  function initScrollTop() {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  // Service Worker
  function initSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }

  // Inicializa todo cuando el DOM está listo
  function init() {
    initTheme();
    initHeaderScroll();
    initMobileMenu();
    initRevealAnimations();
    initSmoothScroll();
    initCopyrightYear();
    initTestimonialSlider();
    initI18n();
    initTypingEffect();
    initScrollTop();
    initSW();
  }

  // Carrusel de testimonios
  function initTestimonialSlider() {
    const wrapper = document.querySelector('.testimonial-wrapper');
    if (!wrapper) return;

    const track = wrapper.querySelector('.testimonial-track');
    const cards = Array.from(track.children);
    const nextButton = wrapper.querySelector('.testimonial-next');
    const prevButton = wrapper.querySelector('.testimonial-prev');
    const dotsNav = wrapper.querySelector('.testimonial-dots');

    if (cards.length <= 1) {
      if (nextButton) nextButton.style.display = 'none';
      if (prevButton) prevButton.style.display = 'none';
      if (dotsNav) dotsNav.style.display = 'none';
      return;
    }

    let currentIndex = 0;

    // Create dots
    if (dotsNav) {
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('testimonial-dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
        dot.addEventListener('click', () => goToSlide(i));
        dotsNav.appendChild(dot);
      });
    }
    const dots = dotsNav ? Array.from(dotsNav.children) : [];

    const goToSlide = (index) => {
      // Loop
      if (index < 0) {
        index = cards.length - 1;
      } else if (index >= cards.length) {
        index = 0;
      }
      
      track.style.transform = 'translateX(-' + 100 * index + '%)';
      
      if(dots.length > 0) {
        if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
        if (dots[index]) dots[index].classList.add('active');
      }

      currentIndex = index;
    };

    if(nextButton) {
        nextButton.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });
    }

    if(prevButton) {
        prevButton.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });
    }

    // Swipe functionality
    let touchStartX = 0;
    
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    track.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        const threshold = 50;

        if (diff > threshold) {
            goToSlide(currentIndex - 1);
        } else if (diff < -threshold) {
            goToSlide(currentIndex + 1);
        }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
