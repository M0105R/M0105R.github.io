/* Monisha Reddy — Signal & Ledger interactions */
(function () {
  'use strict';

  window.__portfolioInit = true;

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  /* ── Theme ── */
  var THEME_KEY = 'mr-theme';
  var themeButtons = Array.prototype.slice.call(doc.querySelectorAll('.theme-toggle'));
  var themeLabels = Array.prototype.slice.call(doc.querySelectorAll('.theme-label'));

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeButtons.forEach(function (btn) {
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    });
    themeLabels.forEach(function (label) {
      label.textContent = isDark ? 'Light' : 'Dark';
    });
  }

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
    });
  });

  applyTheme(currentTheme());

  /* ── Mobile menu ── */
  var menuToggle = doc.querySelector('.menu-toggle');
  var menuClose = doc.querySelector('.menu-close');
  var mobileMenu = doc.getElementById('mobile-menu');
  var mobileLinks = mobileMenu
    ? Array.prototype.slice.call(mobileMenu.querySelectorAll('a[href^="#"]'))
    : [];

  function openMenu() {
    body.classList.add('menu-open');
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'false');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    window.setTimeout(function () {
      if (menuClose && body.classList.contains('menu-open')) menuClose.focus();
    }, 0);
  }

  function closeMenu(returnFocus) {
    body.classList.remove('menu-open');
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus && menuToggle) menuToggle.focus();
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      if (body.classList.contains('menu-open')) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', function () {
      closeMenu(true);
    });
  }

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu(false);
    });
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) {
      closeMenu(true);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024 && body.classList.contains('menu-open')) {
      closeMenu(false);
    }
  });

  /* ── Tabs (specimen + case files) ── */
  function initTabs(tablist, vertical) {
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
        t.classList.toggle('is-active', selected);

        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !selected;
          panel.classList.toggle('is-active', selected);
        }
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        activate(tab, false);
      });

      tab.addEventListener('keydown', function (e) {
        var next = null;
        var prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
        var nextKey = vertical ? 'ArrowDown' : 'ArrowRight';

        if (e.key === prevKey) {
          next = tabs[(i - 1 + tabs.length) % tabs.length];
        } else if (e.key === nextKey) {
          next = tabs[(i + 1) % tabs.length];
        } else if (e.key === 'Home') {
          next = tabs[0];
        } else if (e.key === 'End') {
          next = tabs[tabs.length - 1];
        }

        if (next) {
          e.preventDefault();
          activate(next, true);
        }
      });
    });
  }

  initTabs(doc.querySelector('.specimen-tabs'), false);
  initTabs(doc.querySelector('.case-list'), true);

  /* ── Navigation, scroll spy, progress ── */
  var railBar = doc.getElementById('rail-progress-bar');
  var topBar = doc.getElementById('topbar-progress-bar');

  var navAnchors = Array.prototype.slice.call(
    doc.querySelectorAll('.rail-nav a[href^="#"], .mobile-nav a[href^="#"]')
  );

  var seen = {};
  var sections = [];
  navAnchors.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (seen[id]) return;
    seen[id] = true;
    var el = doc.getElementById(id);
    if (el) sections.push(el);
  });

  function setActiveSection() {
    if (!sections.length) return;

    var marker = window.innerWidth <= 1024 ? 96 : 130;
    var current = sections[0];

    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });

    var scrollBottom = window.pageYOffset + window.innerHeight;
    if (scrollBottom >= root.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }

    navAnchors.forEach(function (a) {
      var isActive = a.getAttribute('href') === '#' + current.id;
      a.classList.toggle('is-active', isActive);
      if (isActive) {
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function setProgress() {
    var scrollTop = window.pageYOffset || root.scrollTop;
    var max = root.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;

    if (railBar) railBar.style.height = pct + '%';
    if (topBar) topBar.style.width = pct + '%';
  }

  /* ── Reveal on scroll ── */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function checkReveals() {
    var vh = window.innerHeight || root.clientHeight;
    reveals.forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      var rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.94 && rect.bottom > -40) {
        el.classList.add('is-visible');
      }
    });
  }

  if (reduceMotion) {
    reveals.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ── Single throttled scroll handler ── */
  var scheduled = false;

  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(function () {
      scheduled = false;
      setActiveSection();
      setProgress();
      if (!reduceMotion) checkReveals();
    }, 16);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  setActiveSection();
  setProgress();
  if (!reduceMotion) {
    checkReveals();
    window.setTimeout(checkReveals, 400);
  }

  /* ── Paris local time ── */
  function updateParisTime() {
    var now;
    try {
      now = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date());
    } catch (e) {
      now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    ['paris-time', 'paris-time-mobile', 'paris-time-foot'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.textContent = now;
    });
  }

  updateParisTime();
  window.setInterval(updateParisTime, 30000);

  /* ── Copy email ── */
  var copyBtn = doc.querySelector('.copy-btn');
  if (copyBtn) {
    var copyLabel = copyBtn.querySelector('.copy-text');
    var originalText = copyLabel ? copyLabel.textContent : 'Copy email';

    copyBtn.addEventListener('click', function () {
      var value = copyBtn.getAttribute('data-copy') || '';

      function done() {
        if (copyLabel) copyLabel.textContent = 'Copied';
        copyBtn.classList.add('copied');
        window.setTimeout(function () {
          if (copyLabel) copyLabel.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 1800);
      }

      function fallback() {
        var temp = doc.createElement('textarea');
        temp.value = value;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        doc.body.appendChild(temp);
        temp.select();
        try {
          doc.execCommand('copy');
          done();
        } catch (err) {}
        doc.body.removeChild(temp);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(fallback);
      } else {
        fallback();
      }
    });
  }

  /* ── Footer year ── */
  var year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
