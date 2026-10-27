(function () {
  'use strict';

  /* ================= НАСТРОЙКИ ================= */
  // Цены в руб. ПМР за единицу. Замените на актуальные.
  var RATES = {
    foam:    { label: 'Утепление пенопластом',            price: 380, unit: 'м²',  areaLabel: 'Площадь фасада, м²' },
    wool:    { label: 'Утепление минватой',               price: 480, unit: 'м²',  areaLabel: 'Площадь фасада, м²' },
    damp:    { label: 'Устранение сырости и плесени',     price: 260, unit: 'м²',  areaLabel: 'Площадь поражённой стены, м²' },
    plaster: { label: 'Декоративная штукатурка / короед', price: 300, unit: 'м²',  areaLabel: 'Площадь фасада, м²' },
    paint:   { label: 'Реставрация и покраска фасада',    price: 180, unit: 'м²',  areaLabel: 'Площадь фасада, м²' },
    seams:   { label: 'Герметизация швов',                price: 120, unit: 'п.м', areaLabel: 'Длина швов, п.м' }
  };
  var OBJECT_COEF = { apartment: 1.15, house: 1.0 }; // квартира — работы на высоте
  var SPREAD = 0.1;                                  // «вилка» ±10%
  var FORM_ENDPOINT = '';                            // например, 'https://formspree.io/f/xxxx'

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' '); };
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var G = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  $('#year').textContent = new Date().getFullYear();

  /* ================= ФОТО: заглушка, если файла нет ================= */
  $$('.photo').forEach(function (f) {
    var img = $('img', f);
    if (!img) { return; }
    function fail() {
      var fb = img.dataset.fallback;
      if (fb && !img.dataset.tried) { img.dataset.tried = '1'; img.src = fb; } // своё фото не найдено — берём запасное
      else { f.classList.add('ph'); }
    }
    img.addEventListener('error', fail);
    if (img.complete && !img.naturalWidth && img.loading !== 'lazy') { fail(); }
  });

  /* ================= БАЗА: если анимации недоступны ================= */
  var pre = $('#preloader');
  if (!G || reduce) {
    root.classList.remove('anim');
    if (pre) { pre.remove(); }
  }

  /* ================= ПЛАВНЫЙ СКРОЛЛ ================= */
  if (G && !reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else if (G) {
    gsap.registerPlugin(ScrollTrigger);
  }
  function goTo(sel) {
    var t = $(sel); if (!t) { return; }
    if (lenis) { lenis.scrollTo(t, { offset: -76, duration: 1.4 }); }
    else { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  }
  $$('[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var h = a.getAttribute('href');
      if (h && h.charAt(0) === '#') { e.preventDefault(); closeMenu(); goTo(h === '#top' ? 'body' : h); }
    });
  });

  /* ================= ШАПКА И МОБИЛЬНОЕ МЕНЮ ================= */
  var header = $('#header'), lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 30);
    header.classList.toggle('hide', y > lastY && y > 500 && !$('#mmenu').classList.contains('open'));
    lastY = y;
  }, { passive: true });

  var burger = $('#burger'), mmenu = $('#mmenu');
  function closeMenu() {
    mmenu.classList.remove('open'); burger.classList.remove('on');
    burger.setAttribute('aria-expanded', 'false'); mmenu.setAttribute('aria-hidden', 'true');
    if (lenis && modal.hidden) { lenis.start(); }
  }
  burger.addEventListener('click', function () {
    var open = mmenu.classList.toggle('open');
    burger.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', String(open)); mmenu.setAttribute('aria-hidden', String(!open));
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });

  /* ================= ВСПОМОГАТЕЛЬНОЕ: текст по словам ================= */
  function splitWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) { return; }
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var i = document.createElement('span'); i.textContent = p; w.appendChild(i); frag.appendChild(w);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1) { splitWords(n); }
    });
  }

  /* ================= АНИМАЦИИ GSAP ================= */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    gsap.set('.split .w>span', { y: 0, yPercent: 110 });
    tl.to('.split .w>span', { yPercent: 0, duration: 1.2, stagger: 0.07 }, 0.1)
      .to('[data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.5)
      .fromTo('.hero-visual .arch', { opacity: 0, y: 70, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.5 }, 0.3)
      .fromTo('.seal', { opacity: 0, scale: 0.4, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.2, ease: 'back.out(1.6)' }, 0.9)
      .fromTo('.float-card', { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.18, ease: 'back.out(1.4)' }, 1.1);
    gsap.to('.fc1', { y: -12, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to('.fc2', { y: 12, duration: 3.6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }

  if (G && !reduce) {
    splitWords($('.split'));

    // Прелоадер
    var o = { v: 0 }, num = $('#preNum'), bar = $('#preBar');
    gsap.to(o, {
      v: 100, duration: 1.3, ease: 'power2.inOut',
      onUpdate: function () { num.textContent = Math.round(o.v); bar.style.width = o.v + '%'; },
      onComplete: function () {
        gsap.to(pre, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', onComplete: function () { pre.remove(); } });
        intro();
      }
    });

    // Появление блоков при скролле
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', overwrite: true }); }
    });

    // Счётчики
    $$('[data-count]').forEach(function (el) {
      var t = Number(el.dataset.count), c = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () { gsap.to(c, { v: t, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(c.v); } }); }
      });
    });

    // Параллакс главного фото
    var heroImg = $('[data-parallax]');
    if (heroImg) {
      gsap.fromTo(heroImg, { yPercent: 0 }, { yPercent: -13, ease: 'none',
        scrollTrigger: { trigger: heroImg.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Линия процесса
    var vertical = window.innerWidth <= 900, line = $('.steps-line');
    gsap.set(line, { transformOrigin: vertical ? 'top' : 'left' });
    gsap.fromTo(line, vertical ? { scaleY: 0 } : { scaleX: 0 }, Object.assign({ ease: 'none',
      scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 75%', scrub: true } }, vertical ? { scaleY: 1 } : { scaleX: 1 }));

    // Кнопки «магниты»
    if (fine) {
      $$('[data-magnetic]').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
        });
        el.addEventListener('mouseleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' }); });
      });

      // Кастомный курсор
      var cur = $('#cursor');
      var qx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
      window.addEventListener('mousemove', function (e) { cur.style.opacity = 1; qx(e.clientX); qy(e.clientY); });
      $$('a, button, .ba, .svc, .work').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cur.classList.add('big'); });
        el.addEventListener('mouseleave', function () { cur.classList.remove('big'); });
      });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ================= SWIPER «РАБОТЫ» ================= */
  if (window.Swiper) {
    new Swiper('.works', {
      slidesPerView: 1.15, spaceBetween: 18, grabCursor: true,
      navigation: { nextEl: '.sw-next', prevEl: '.sw-prev' },
      breakpoints: { 700: { slidesPerView: 2.1 }, 1100: { slidesPerView: 3.1 } }
    });
  }

  /* ================= СЛАЙДЕР «ДО / ПОСЛЕ» ================= */
  var baRange = $('#baRange'), baTop = $('#baTop'), baLine = $('#baLine');
  function setBA(v) { baTop.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; baLine.style.left = v + '%'; }
  baRange.addEventListener('input', function () { setBA(baRange.value); });
  setBA(50);
  if (G && !reduce) {
    var p = { v: 50 };
    ScrollTrigger.create({
      trigger: '#ba', start: 'top 65%', once: true,
      onEnter: function () {
        gsap.timeline()
          .to(p, { v: 78, duration: 0.9, ease: 'power2.inOut', onUpdate: function () { baRange.value = p.v; setBA(p.v); } })
          .to(p, { v: 22, duration: 1.3, ease: 'power2.inOut', onUpdate: function () { baRange.value = p.v; setBA(p.v); } })
          .to(p, { v: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: function () { baRange.value = p.v; setBA(p.v); } });
      }
    });
  }

  /* ================= КАЛЬКУЛЯТОР ================= */
  var serviceSel = $('#service'), area = $('#area'), areaOut = $('#areaOut'), areaLabel = $('#areaLabel');
  var priceOut = $('#priceOut'), priceNote = $('#priceNote'), shown = { v: 0 };
  function render() {
    priceOut.textContent = fmt(shown.v * (1 - SPREAD)) + ' – ' + fmt(shown.v * (1 + SPREAD)) + ' руб.';
  }
  function calc() {
    var rate = RATES[serviceSel.value], obj = $('input[name=object]:checked').value, qty = Number(area.value);
    var base = qty * rate.price * OBJECT_COEF[obj];
    areaLabel.textContent = rate.areaLabel;
    areaOut.textContent = qty + ' ' + rate.unit;
    area.style.setProperty('--fill', ((qty - area.min) / (area.max - area.min) * 100) + '%');
    priceNote.textContent = rate.label + ' · ' + qty + ' ' + rate.unit + (obj === 'apartment' ? ' · с учётом работ на высоте' : '');
    if (G && !reduce) { gsap.to(shown, { v: base, duration: 0.7, ease: 'power3.out', overwrite: true, onUpdate: render }); }
    else { shown.v = base; render(); }
  }
  serviceSel.addEventListener('change', calc);
  area.addEventListener('input', calc);
  $$('input[name=object]').forEach(function (r) { r.addEventListener('change', calc); });
  calc();

  /* ================= ФОРМЫ ================= */
  function isPhone(v) { return v.replace(/\D/g, '').length >= 8; }
  function msg(form, text, type) { var el = $('.form-msg', form); el.textContent = text; el.className = 'form-msg ' + (type || ''); }
  function send(payload) {
    if (!FORM_ENDPOINT) { return new Promise(function (r) { setTimeout(r, 700); }); }
    return fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (res) { if (!res.ok) { throw new Error('HTTP ' + res.status); } });
  }
  function bindForm(form, required, build, okText, onOk) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      for (var i = 0; i < required.length; i++) {
        var k = required[i], bad = k === 'phone' ? !isPhone(f[k].value) : !f[k].value.trim();
        if (bad) { msg(form, k === 'phone' ? 'Проверьте номер телефона.' : 'Заполните обязательные поля.', 'err'); f[k].focus(); return; }
      }
      var btn = $('button[type=submit]', form); btn.disabled = true; msg(form, 'Отправляем…');
      send(build(f)).then(function () { msg(form, okText, 'ok'); form.reset(); if (onOk) { onOk(); } })
        .catch(function () { msg(form, 'Не удалось отправить. Позвоните: +373 777 00 000.', 'err'); })
        .then(function () { btn.disabled = false; });
    });
  }
  bindForm($('#estimateForm'), ['name', 'phone'], function (f) {
    return { type: 'estimate', object: $('input[name=object]:checked').value, service: RATES[serviceSel.value].label,
      quantity: area.value + ' ' + RATES[serviceSel.value].unit, estimate: priceOut.textContent, name: f.name.value.trim(), phone: f.phone.value.trim() };
  }, 'Спасибо! Пришлём точную смету после звонка.');

  /* ================= МОДАЛЬНОЕ ОКНО ================= */
  var modal = $('#modal'), measure = $('#measureForm'), lastFocus = null;
  function openModal(service) {
    lastFocus = document.activeElement;
    $('#modalService').textContent = service ? 'Услуга: ' + service : '';
    measure.dataset.service = service || ''; msg(measure, '');
    $('#m-date').min = new Date().toISOString().split('T')[0];
    closeMenu(); modal.hidden = false; document.body.classList.add('modal-open');
    if (lenis) { lenis.stop(); }
    if (G && !reduce) {
      gsap.fromTo('.modal-bg', { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo('.modal-box', { y: 50, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)' });
    }
    setTimeout(function () { $('#m-name').focus(); }, 80);
  }
  function closeModal() {
    modal.hidden = true; document.body.classList.remove('modal-open');
    if (lenis) { lenis.start(); }
    if (lastFocus) { lastFocus.focus(); }
  }
  $$('[data-open-modal]').forEach(function (b) { b.addEventListener('click', function () { openModal(b.dataset.service || ''); }); });
  $$('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!modal.hidden) { closeModal(); } else { closeMenu(); } }
    if (e.key === 'Tab' && !modal.hidden) {
      var f = $$('button, input, a[href]', $('.modal-box')).filter(function (x) { return !x.disabled; });
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  bindForm(measure, ['name', 'phone', 'address'], function (f) {
    return { type: 'measure', service: measure.dataset.service || '', name: f.name.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim(), date: f.date.value };
  }, 'Заявка принята. Мы перезвоним в ближайшее время.', function () { setTimeout(closeModal, 2200); });
})();
