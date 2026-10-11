(function () {
  'use strict';
  var doc = document.documentElement;
  var es = doc.lang === 'es';

  // drop the old site's service worker and caches if a browser still has them
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    }).catch(function () {});
  }
  if (window.caches) {
    caches.keys().then(function (keys) { keys.forEach(function (k) { caches.delete(k); }); }).catch(function () {});
  }

  function syncToggle() {
    var dark = doc.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', dark ? 'true' : 'false'); });
  }
  function setTheme(mode) {
    doc.setAttribute('data-theme', mode);
    try { localStorage.setItem('theme', mode); } catch (x) {}
    syncToggle();
  }
  syncToggle();
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
  });

  // mobile menu
  var bar = document.querySelector('.bar'), menuBtn = document.querySelector('.menu-btn');
  if (bar && menuBtn) {
    var setMenu = function (open) { bar.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    menuBtn.addEventListener('click', function (ev) { ev.stopPropagation(); setMenu(!bar.classList.contains('open')); });
    document.addEventListener('click', function (ev) { if (!bar.contains(ev.target)) setMenu(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && bar.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  }

  // hero animation
  var field = null, fieldHost = document.querySelector('[data-orbits]');
  if (fieldHost && window.OrbitField) {
    field = window.OrbitField.mount(fieldHost, { pointerTarget: fieldHost.parentNode, hitTarget: document.querySelector('.hero-art') });
  }

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key));
      localStorage.setItem(key, JSON.stringify(val));
    } catch (x) { return null; }
  }

  // reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // release name and Modrinth status, cached per session
  function cached(key, load, use) {
    var hit;
    try { hit = sessionStorage.getItem(key); } catch (x) {}
    if (hit !== null && hit !== undefined) { use(JSON.parse(hit)); return; }
    load().then(function (v) {
      try { sessionStorage.setItem(key, JSON.stringify(v)); } catch (x) {}
      use(v);
    }).catch(function () {});
  }
  var rel = document.querySelectorAll('[data-release]');
  if (rel.length) {
    var repo = rel[0].getAttribute('data-release');
    cached('rel:' + repo, function () {
      return fetch('https://api.github.com/repos/' + repo + '/releases/latest')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return d && d.name ? d.name : null; });
    }, function (name) { if (name) rel.forEach(function (el) { el.textContent = name; }); });
  }
  var mr = document.querySelectorAll('[data-modrinth]');
  if (mr.length) {
    var slug = mr[0].getAttribute('data-modrinth');
    cached('mr:' + slug, function () {
      return fetch('https://api.modrinth.com/v2/project/' + slug).then(function (r) { return r.ok; });
    }, function (ok) { if (ok) mr.forEach(function (a) { a.hidden = false; }); });
  }

  // advancements
  var ADV = {
    chat:   [es ? 'Abre el chat' : 'Open the chat', es ? 'Pulsa T, como en el juego' : 'Press T, like in the game'],
    time:   [es ? 'Media vuelta' : 'Half a turn', es ? 'Cambia la hora del mundo' : 'Change the time of the world'],
    align:  [es ? 'Colapso' : 'Collapse', es ? 'Insiste con el átomo' : 'Keep poking the atom'],
    void:   [es ? 'Fuera del mundo' : 'Out of this world', es ? 'Llega a un chunk sin generar' : 'Reach an ungenerated chunk']
  };
  var TOTAL = Object.keys(ADV).length;
  var toastBox;
  function earned() {
    return (store('ol-adv') || []).filter(function (k) { return ADV.hasOwnProperty(k); });
  }
  function grant(id) {
    var got = earned();
    if (got.indexOf(id) !== -1) return;
    got.push(id);
    store('ol-adv', got);
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'toasts';
      toastBox.setAttribute('role', 'status');
      toastBox.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastBox);
    }
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<svg class="tile" viewBox="0 0 40 40" aria-hidden="true"><rect class="tile-box" x="1" y="1" width="38" height="38" rx="3"/><text class="tile-num" x="5" y="11">47</text><text class="tile-sym" x="20" y="30" text-anchor="middle">Ag</text></svg>'
      + '<div><b>' + (es ? '¡Logro conseguido!' : 'Advancement made!') + '</b><span></span><small></small></div>';
    t.querySelector('span').textContent = ADV[id][0];
    t.querySelector('small').textContent = ADV[id][1] + ' · ' + got.length + '/' + TOTAL;
    toastBox.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 4200);
    setTimeout(function () { t.remove(); }, 4800);
  }
  if (document.body.getAttribute('data-adv')) grant(document.body.getAttribute('data-adv'));

  // atom: 7 clicks
  var art = document.querySelector('.hero-art');
  if (art) {
    var clicks = 0, timer;
    art.addEventListener('click', function () {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1600);
      art.classList.remove('nudge'); void art.offsetWidth; art.classList.add('nudge');
      if (field) field.kick();
      if (clicks >= 7 && !art.classList.contains('align')) {
        clicks = 0;
        art.classList.add('align');
        if (field) field.collapse();
        grant('align');
        setTimeout(function () { art.classList.add('done'); art.classList.remove('align'); }, 3500);
      }
    });
  }

  // chat
  var chat, input, log;
  var L = es ? {
    help: 'Comandos: /time set day|night, /credits, /seed, /advancements, /shortcut on|off',
    unknown: 'Comando desconocido. Escribe /help para ver la ayuda.',
    day: 'Hora fijada en 1000', night: 'Hora fijada en 13000', time: 'Uso: /time set day|night',
    credits: 'Hecho por Josh Lucem.',
    seed: 'Semilla: [333333333]',
    adv: function (n) { return 'Logros: ' + n + '/' + TOTAL; },
    gm: 'No tienes permiso para usar este comando.',
    say: function (m) { return '<tester_333> ' + m; },
    keyOn: 'La tecla T vuelve a abrir el chat.', keyOff: 'La tecla T ya no abre el chat. Usa el enlace del pie de página.', keyUse: 'Uso: /shortcut on|off',
    placeholder: 'Escribe un comando, prueba /help'
  } : {
    help: 'Commands: /time set day|night, /credits, /seed, /advancements, /shortcut on|off',
    unknown: 'Unknown command. Type /help for help.',
    day: 'Set the time to 1000', night: 'Set the time to 13000', time: 'Usage: /time set day|night',
    credits: 'Made by Josh Lucem.',
    seed: 'Seed: [333333333]',
    adv: function (n) { return 'Advancements: ' + n + '/' + TOTAL; },
    gm: 'You do not have permission to use this command.',
    say: function (m) { return '<tester_333> ' + m; },
    keyOn: 'The T key opens the chat again.', keyOff: 'The T key no longer opens the chat. Use the link in the footer.', keyUse: 'Usage: /shortcut on|off',
    placeholder: 'Type a command, try /help'
  };

  function line(text, cls) {
    var p = document.createElement('p');
    p.textContent = text;
    if (cls) p.className = cls;
    log.appendChild(p);
    while (log.children.length > 8) log.removeChild(log.firstChild);
  }


  function run(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    if (cmd.charAt(0) !== '/') { line(L.say(cmd)); return; }
    var a = cmd.slice(1).split(/\s+/);
    var c = a[0].toLowerCase();
    line(cmd, 'echo');
    if (c === 'help' || c === '?') line(L.help, 'sys');
    else if (c === 'time') {
      var v = (a[2] || '').toLowerCase();
      if (a[1] !== 'set' || (v !== 'day' && v !== 'night')) { line(L.time, 'err'); return; }
      setTheme(v === 'day' ? 'light' : 'dark');
      line(v === 'day' ? L.day : L.night, 'ok'); grant('time');
    }
    else if (c === 'credits' || c === 'about') line(L.credits, 'sys');
    else if (c === 'seed') line(L.seed, 'sys');
    else if (c === 'advancements') line(L.adv(earned().length), 'sys');
    else if (c === 'shortcut') {
      if (a[1] === 'off') { store('ol-keys', false); line(L.keyOff, 'ok'); }
      else if (a[1] === 'on') { store('ol-keys', true); line(L.keyOn, 'ok'); }
      else line(L.keyUse, 'err');
    }
    else if (c === 'gamemode' || c === 'op' || c === 'give') line(L.gm, 'err');
    else line(L.unknown, 'err');
  }

  function openChat(prefill) {
    if (!chat) {
      chat = document.createElement('div');
      chat.className = 'chat';
      chat.innerHTML = '<div class="chat-log" aria-live="polite"></div><input type="text" autocomplete="off" spellcheck="false" aria-label="Chat">';
      document.body.appendChild(chat);
      log = chat.querySelector('.chat-log');
      input = chat.querySelector('input');
      input.placeholder = L.placeholder;
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { run(input.value); input.value = ''; }
        if (ev.key === 'Escape') closeChat();
        ev.stopPropagation();
      });
      input.addEventListener('blur', function () { setTimeout(closeChat, 150); });
    }
    chat.classList.add('open');
    input.value = prefill || '';
    input.focus();
    grant('chat');
  }
  function closeChat() { if (chat) { chat.classList.remove('open'); input.blur(); } }

  document.addEventListener('keydown', function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
    if (ev.key !== 't' && ev.key !== 'T') return;
    var focused = document.activeElement;
    if (focused && focused !== document.body && focused !== doc) return;
    if (store('ol-keys') === false) return;
    ev.preventDefault();
    openChat('');
  });
  document.querySelectorAll('[data-chat]').forEach(function (b) {
    b.addEventListener('click', function () { openChat('/'); });
  });

  // console message
  try {
    console.log('%c  ·(•)·  %c\n' + (es
      ? 'El código de este sitio es público: https://github.com/joshlucem/joshlucem.github.io\nPista: pulsa T en la página.'
      : 'The source of this site is public: https://github.com/joshlucem/joshlucem.github.io\nHint: press T on the page.'),
      'font:20px serif;color:#b39a78;background:#101114;padding:6px 10px;border-radius:4px', 'color:inherit');
  } catch (x) {}
})();
