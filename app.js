// Escuna Tânia · interactions
(function () {
  // Navbar: scroll state + mobile menu
  var nav = document.querySelector('.navbar');
  var navLinks = document.querySelector('.navbar nav');
  var toggle = document.querySelector('.navbar .menu-toggle');

  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 24) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) navLinks.classList.remove('open');
    });
  }

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  // Video posters: play on load (autoplay is in HTML but ensure intersection-based play for non-hero)
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (v.paused) { v.play().catch(function () {}); }
        } else {
          if (!v.paused && v.dataset.persistPlay !== '1') { v.pause(); }
        }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('video[data-viewport-play]').forEach(function (v) { vio.observe(v); });
  }

  // Audio toggle for hero video
  var heroVideo = document.getElementById('hero-video');
  var audioBtn = document.getElementById('hero-audio-toggle');
  if (heroVideo && audioBtn) {
    audioBtn.addEventListener('click', function () {
      heroVideo.muted = !heroVideo.muted;
      audioBtn.setAttribute('aria-pressed', String(!heroVideo.muted));
      audioBtn.querySelector('.label').textContent = heroVideo.muted ? 'Ativar som' : 'Silenciar';
    });
  }

  // Reserve panel — simple validation, opens WhatsApp pre-filled
  var reserveForms = document.querySelectorAll('[data-reserve-form]');
  reserveForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var date = data.get('date') || '';
      var people = data.get('people') || '';
      var pkg = data.get('package') || 'Passeio padrão';
      var msg = 'Olá! Gostaria de reservar a Escuna Tânia.%0A' +
        '• Data: ' + date + '%0A' +
        '• Passageiros: ' + people + '%0A' +
        '• Pacote: ' + pkg;
      window.open('https://wa.me/5524999999999?text=' + msg, '_blank');
    });
  });

  // Contact form — same WhatsApp redirect
  var contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(contactForm);
      var name = data.get('name') || '';
      var subject = data.get('subject') || 'Contato';
      var message = data.get('message') || '';
      var msg = 'Olá, sou ' + name + '.%0A' +
        '• Assunto: ' + subject + '%0A' +
        '• Mensagem: ' + message;
      window.open('https://wa.me/5524999999999?text=' + msg, '_blank');
    });
  }

  // ====== Mapa interativo: pinos clicáveis (mobile/touch) ======
  var mapPins = document.querySelectorAll('.map-pin');
  if (mapPins.length) {
    var closeAllPops = function (except) {
      mapPins.forEach(function (p) { if (p !== except) p.classList.remove('is-open'); });
    };
    mapPins.forEach(function (pin) {
      pin.addEventListener('click', function (e) {
        // Evita que cliques na galeria-pop fechem ela
        if (e.target.closest('.pin-pop')) return;
        e.preventDefault();
        var willOpen = !pin.classList.contains('is-open');
        closeAllPops(pin);
        pin.classList.toggle('is-open', willOpen);
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.map-pin')) closeAllPops(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllPops(null);
    });
  }

  // ====== Fallback gracioso para imagens externas (LoremFlickr) ======
  document.querySelectorAll('.pop-thumb img').forEach(function (img) {
    img.addEventListener('error', function () {
      // Substitui por placeholder estável do Picsum baseado no alt text
      var seed = encodeURIComponent((img.getAttribute('alt') || 'paraty') + img.src.length);
      var fallback = 'https://picsum.photos/seed/' + seed + '/400/300';
      if (img.src.indexOf('picsum.photos') === -1) {
        img.src = fallback;
      } else {
        // Último fallback: gradient tropical
        img.style.display = 'none';
        var tile = img.closest('.pop-thumb');
        if (tile) {
          tile.style.background = 'linear-gradient(135deg, oklch(72% 0.12 220), oklch(40% 0.10 250))';
        }
      }
    }, { once: false });
  });
})();
