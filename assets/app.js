/*
  Josh Lucem Portfolio - app.js
  Código principal del sitio
*/

(function() {
  'use strict';

  // Detecta si el usuario prefiere menos animaciones
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tema claro/oscuro con persistencia en localStorage
  function initTheme() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', initial);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    // Actualiza si cambia la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
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

    const close = () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cierra al hacer click en un link
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', close);
    });

    // Cierra con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });
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

        const target = document.querySelector(href);
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

  // Inicializa todo cuando el DOM está listo
  function init() {
    initTheme();
    initHeaderScroll();
    initMobileMenu();
    initRevealAnimations();
    initSmoothScroll();
    initCopyrightYear();
    initTestimonialSlider();
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
        dot.setAttribute('aria-label', `Ir al testimonio ${i + 1}`);
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

    track.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        const threshold = 50; // min swipe distance in pixels

        if (diff > threshold) {
            // swipe right
            goToSlide(currentIndex - 1);
        } else if (diff < -threshold) {
            // swipe left
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
