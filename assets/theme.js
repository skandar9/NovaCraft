(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var T = window.theme || { i18n: {}, root: '/' }, I = T.i18n || {}, root = T.root || '/';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function currency() { return (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD'; }
  function money(c, cur) { try { return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: cur || currency() }).format(c / 100); } catch (e) { return (c / 100).toFixed(2); } }
  function cents(v) { return typeof v === 'string' ? Math.round(parseFloat(v) * 100) : v; }
  function toast(msg, good) { var t = document.createElement('div'); t.className = 'toast' + (good ? ' good' : ''); t.setAttribute('role', 'alert'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); }

  /* ---------- wishlist ---------- */
  function syncWish() {
    var a = store.get('wishlist');
    $$('[data-wish]').forEach(function (b) { b.setAttribute('aria-pressed', a.indexOf(b.getAttribute('data-wish')) > -1); });
    $$('[data-wish-count]').forEach(function (c) { c.textContent = a.length; c.hidden = !a.length; });
  }
  /* ---------- product card from product JSON ---------- */
  function sized(u, w) { return u ? u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + w : ''; }
  function cardHtml(p) {
    var price = cents(p.price), cmp = cents(p.compare_at_price || 0), v = (p.variants || [])[0];
    var img = p.featured_image ? '<img src="' + esc(sized(p.featured_image.src || p.featured_image, 600)) + '" alt="' + esc(p.title) + '" loading="lazy">' : '';
    var url = p.url || ('/products/' + p.handle);
    var quick = (p.available !== false && v && (p.variants || []).length === 1) ? '<button type="button" class="quick-add" data-quick-add="' + v.id + '">' + esc(I.add) + '</button>' : '';
    return '<article class="card"><div class="card-media"><a class="card-link" href="' + esc(url) + '" aria-label="' + esc(p.title) + '">' + img + '</a>' +
      '<button type="button" class="wish-btn" data-wish="' + esc(p.handle) + '" aria-pressed="false" aria-label="wishlist"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z"/></svg></button>' + quick + '</div>' +
      '<div class="card-info"><h3 class="card-title"><a href="' + esc(url) + '">' + esc(p.title) + '</a></h3><div class="price">' +
      (cmp > price ? '<span class="price-now sale">' + money(price) + '</span><s class="price-compare">' + money(cmp) + '</s>' : '<span class="price-now">' + money(price) + '</span>') + '</div></div></article>';
  }
  function fetchProducts(handles) {
    return Promise.all(handles.map(function (h) { return fetch(root + 'products/' + h + '.js').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }))
      .then(function (a) { return a.filter(Boolean); });
  }

  function init() {
    /* menu */
    var toggle = $('[data-menu-toggle]'), nav = $('[data-nav]');
    if (toggle && nav) toggle.addEventListener('click', function () { toggle.setAttribute('aria-expanded', nav.classList.toggle('open')); });

    /* auto submit / auto click */
    $$('[data-auto-submit]').forEach(function (el) { el.addEventListener('change', function () { if (el.form) el.form.submit(); }); });
    $$('[data-auto-click]').forEach(function (el) { el.addEventListener('change', function () { var b = $(el.getAttribute('data-auto-click'), el.form); if (b) b.click(); }); });
    $$('form[data-filter-form]').forEach(function (f) { f.addEventListener('change', function (e) { if (e.target.closest('.f-price')) return; if (window.innerWidth >= 1050) f.submit(); }); });$$('form[data-filter-form]').forEach(function (f) { f.addEventListener('change', function (e) { if (e.target.closest('.f-price')) return; if (window.innerWidth >= 1050) f.submit(); }); });

    /* quantity */
    $$('.qty').forEach(function (q) {
      var input = $('input', q); if (!input) return;
      $('[data-qty-minus]', q).addEventListener('click', function () { input.value = Math.max(parseInt(input.min || 1, 10), (parseInt(input.value, 10) || 1) - 1); });
      $('[data-qty-plus]', q).addEventListener('click', function () { input.value = (parseInt(input.value, 10) || 1) + 1; });
    });

    /* hero slider */
    $$('[data-slider]').forEach(function (s) {
      var slides = $$('.hs-slide', s), dots = $$('[data-dot]', s), i = 0, timer;
      if (slides.length < 2) return;
      function go(n) { i = (n + slides.length) % slides.length; slides.forEach(function (el, k) { el.classList.toggle('is-active', k === i); }); dots.forEach(function (el, k) { el.classList.toggle('is-active', k === i); }); }
      function play() { var ms = (parseInt(s.getAttribute('data-autoplay'), 10) || 0) * 1000; clearInterval(timer); if (ms) timer = setInterval(function () { go(i + 1); }, ms); }
      dots.forEach(function (d) { d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-dot'), 10)); play(); }); });
      var p = $('[data-prev]', s), n = $('[data-next]', s);
      if (p) p.addEventListener('click', function () { go(i - 1); play(); });
      if (n) n.addEventListener('click', function () { go(i + 1); play(); });
      s.addEventListener('mouseenter', function () { clearInterval(timer); }); s.addEventListener('mouseleave', play); play();
    });

    /* tabs */
    $$('[data-tabs]').forEach(function (t) {
      $$('[data-tab]', t).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-tab');
          $$('[data-tab]', t).forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
          $$('[data-panel]', t).forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === k); });
        });
      });
    });

    /* review arrows */
    $$('.reviews').forEach(function (r) {
      var track = $('[data-scroll-track]', r), rtl = document.documentElement.dir === 'rtl';
      function by(d) { track.scrollBy({ left: d * (rtl ? -1 : 1) * track.clientWidth * 0.8, behavior: 'smooth' }); }
      var p = $('[data-scroll-prev]', r), n = $('[data-scroll-next]', r);
      if (p) p.addEventListener('click', function () { by(-1); }); if (n) n.addEventListener('click', function () { by(1); });
    });

    /* reveal + counters */
    function count(el) {
      var end = parseFloat(el.getAttribute('data-count')) || 0, suf = el.getAttribute('data-suffix') || '', t0 = null;
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = end + suf; return; }
      function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target); if (e.target.hasAttribute('data-count')) count(e.target); }); }, { threshold: 0.2 });
      $$('.reveal').forEach(function (el, k) { el.style.transitionDelay = (k % 4) * 90 + 'ms'; io.observe(el); });
      $$('[data-count]').forEach(function (el) { io.observe(el); });
    } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

    /* announcement */
    var ann = $('[data-announce]');
    if (ann) {
      try { if (sessionStorage.getItem('announce-closed')) ann.hidden = true; } catch (e) {}
      var msgs = $$('.announce-msg', ann), mi = 0;
      if (msgs.length > 1) setInterval(function () { msgs[mi].classList.remove('is-active'); mi = (mi + 1) % msgs.length; msgs[mi].classList.add('is-active'); }, 4500);
      var ac = $('[data-announce-close]', ann);
      if (ac) ac.addEventListener('click', function () { ann.hidden = true; try { sessionStorage.setItem('announce-closed', '1'); } catch (e) {} });
    }

    /* countdowns */
    $$('[data-countdown]').forEach(function (el) {
      var end = new Date(el.getAttribute('data-countdown').replace(' ', 'T')), inline = el.hasAttribute('data-inline'), iv;
      if (isNaN(end)) return;
      function tick() {
        var ms = end - new Date();
        if (ms <= 0) { if (inline) el.textContent = ''; else el.hidden = true; clearInterval(iv); return; }
        var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sc = s % 60;
        if (inline) el.textContent = (d ? d + I.days + ' ' : '') + pad(h) + ':' + pad(m) + ':' + pad(sc);
        else el.innerHTML = [[d, I.days], [h, I.hours], [m, I.mins], [sc, I.secs]].map(function (x) { return '<div class="cd-box"><b>' + pad(x[0]) + '</b><small>' + esc(x[1]) + '</small></div>'; }).join('');
      }
      tick(); iv = setInterval(tick, 1000);
    });

    /* copy code */
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var code = b.getAttribute('data-copy');
        (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).catch(function () {}).then(function () { toast(I.copied + ' ' + code, true); });
      });
    });

    /* share */
    $$('[data-share]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = { title: b.getAttribute('data-title'), url: b.getAttribute('data-url') };
        if (navigator.share) navigator.share(d).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(d.url).then(function () { toast(I.copied, true); });
      });
    });

    /* ---------- search overlay + live suggestions ---------- */
    var so = $('[data-search]'), sIn = $('[data-search-input]'), sRes = $('[data-search-results]'), st;
    function openSearch() { so.hidden = false; document.body.classList.add('no-scroll'); setTimeout(function () { sIn.focus(); }, 30); }
    function closeSearch() { so.hidden = true; document.body.classList.remove('no-scroll'); }
    if (so) {
      $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
      $$('[data-search-close]').forEach(function (b) { b.addEventListener('click', closeSearch); });
      sIn.addEventListener('input', function () {
        clearTimeout(st); var q = sIn.value.trim();
        if (!T.predictive || q.length < 2) { sRes.innerHTML = ''; return; }
        st = setTimeout(function () { suggest(q); }, 220);
      });
    }
    function suggest(q) {
      var u = T.suggestUrl + '?q=' + encodeURIComponent(q) + '&resources[type]=product,collection,article&resources[limit]=' + (T.searchLimit || 4);
      fetch(u).then(function (r) { return r.json(); }).then(function (d) {
        var r = (d.resources && d.resources.results) || {}, P = r.products || [], C = r.collections || [], A = r.articles || [];
        var h = '<div><p class="sr-title">' + esc(I.products) + '</p>' + (P.length ? P.map(function (p) {
          return '<a class="sr-prod" href="' + esc(p.url) + '">' + (p.image ? '<img src="' + esc(sized(p.image, 120)) + '" alt="" loading="lazy">' : '<span></span>') + '<span>' + esc(p.title) + '</span><span>' + money(cents(p.price)) + '</span></a>';
        }).join('') : '') + '</div><div>';
        if (C.length) h += '<p class="sr-title">' + esc(I.collections) + '</p><ul class="sr-list">' + C.map(function (c) { return '<li><a href="' + esc(c.url) + '">' + esc(c.title) + '</a></li>'; }).join('') + '</ul>';
        if (A.length) h += '<p class="sr-title">' + esc(I.articles) + '</p><ul class="sr-list">' + A.map(function (c) { return '<li><a href="' + esc(c.url) + '">' + esc(c.title) + '</a></li>'; }).join('') + '</ul>';
        h += '<p><a class="link" href="' + root + 'search?q=' + encodeURIComponent(q) + '">' + esc(I.viewAll) + '</a></p></div>';
        sRes.innerHTML = h;
      }).catch(function () {});
    }

    /* ---------- filters drawer + layout toggle ---------- */
    var fw = $('[data-filters-wrap]'), fb = $('.filters-backdrop');
    function fToggle(on) { if (fw) fw.classList.toggle('open', on); if (fb) fb.classList.toggle('open', on); document.body.classList.toggle('no-scroll', on); }
    $$('[data-filters-open]').forEach(function (b) { b.addEventListener('click', function () { fToggle(true); }); });
    $$('[data-filters-close]').forEach(function (b) { b.addEventListener('click', function () { fToggle(false); }); });
    var grid = $('[data-pgrid]');
    if (grid) {
      var saved = ''; try { saved = localStorage.getItem('cols') || ''; } catch (e) {}
      function setCols(c) { if (c) grid.setAttribute('data-cols', c); else grid.removeAttribute('data-cols'); $$('[data-cols]').forEach(function (b) { if (b.tagName === 'BUTTON') b.classList.toggle('is-active', b.getAttribute('data-cols') === c); }); }
      setCols(saved);
      $$('.layout-toggle [data-cols]').forEach(function (b) { b.addEventListener('click', function () { var c = b.getAttribute('data-cols'); setCols(c); try { localStorage.setItem('cols', c); } catch (e) {} }); });
    }

    /* ---------- discount code (cart page) ---------- */
    $$('[data-discount-form]').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); var c = f.code.value.trim(); if (c) location.href = f.getAttribute('data-base') + encodeURIComponent(c) + '?redirect=' + encodeURIComponent(f.getAttribute('data-redirect')); });
    });

    /* ---------- product page ---------- */
    var pd = $('[data-product]');
    if (pd) {
      var form = $('#product-form', pd), vEl = $('[data-variants]', pd), variants = vEl ? JSON.parse(vEl.textContent) : [], low = parseInt(pd.getAttribute('data-low'), 10) || 5;
      var idIn = $('[data-variant-id]', form), add = $('[data-add]', pd), lbl = $('[data-add-label]', pd);
      function showSlide(i) { $$('.gallery-slide', pd).forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-slide') === String(i)); }); $$('[data-thumb]', pd).forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-thumb') === String(i)); }); }
      $$('[data-thumb]', pd).forEach(function (t) { t.addEventListener('click', function () { showSlide(t.getAttribute('data-thumb')); }); });
      function update() {
        var fs = $$('[data-option]', form), opts = fs.map(function (f) { var c = $('input:checked', f); return c ? c.value : null; });
        fs.forEach(function (f, k) { var l = $('[data-opt-label]', f); if (l) l.textContent = opts[k]; });
        var v = variants.filter(function (x) { return x.options.every(function (o, k) { return !opts.length || o === opts[k]; }); })[0];
        var stock = $('[data-stock]', pd), now = $('[data-now]', pd), cmp = $('[data-compare]', pd), save = $('[data-save]', pd), badge = $('[data-sale-badge]', pd), nt = $('[data-notify]', pd);
        if (!v) { add.disabled = true; lbl.textContent = I.soldOut; stock.textContent = ''; return; }
        idIn.value = v.id;
        if (now) { now.textContent = v.price; now.classList.toggle('sale', v.pct > 0); }
        if (cmp) { cmp.textContent = v.compare; cmp.hidden = !(v.pct > 0); }
        if (save) { save.hidden = !(v.pct > 0); save.textContent = (save.textContent.split(' ')[0] || '') + ' ' + v.pct + '%'; }
        if (badge) { badge.textContent = '-' + v.pct + '%'; badge.hidden = !(v.pct > 0); }
        add.disabled = !v.available; lbl.textContent = v.available ? I.add : I.soldOut;
        if (nt) nt.hidden = v.available;
        stock.className = 'stock';
        if (!v.available) { stock.textContent = I.soldOut; stock.classList.add('out'); }
        else if (v.managed && v.qty > 0 && v.qty <= low) { stock.textContent = I.low.replace('__N__', v.qty); stock.classList.add('low'); }
        else { stock.textContent = I.inStock; }
        var sku = $('[data-sku]', pd); if (sku) sku.textContent = v.sku || '';
        var sp = $('[data-sticky-price]'); if (sp) sp.textContent = v.price;
        if (v.media > -1) showSlide(v.media);
        if (window.history && history.replaceState) history.replaceState({}, '', '?variant=' + v.id);
      }
      $$('[data-option] input', form).forEach(function (i) { i.addEventListener('change', update); });
      update();
      /* lightbox */
      var lb = $('[data-lightbox]', pd), lbi = $('[data-lb-img]', pd);
      $$('[data-zoom]', pd).forEach(function (z) { z.addEventListener('click', function () { lbi.src = z.getAttribute('data-zoom'); lb.hidden = false; }); });
      $$('[data-lb-close]', pd).forEach(function (b) { b.addEventListener('click', function () { lb.hidden = true; }); });
      lb.addEventListener('click', function (e) { if (e.target === lb) lb.hidden = true; });
      /* sticky add to cart */
      var sticky = $('[data-sticky-atc]', pd);
      if (sticky && add && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { var e = es[0]; sticky.hidden = e.isIntersecting || e.boundingClientRect.top > 0; }).observe(add);
        $('[data-sticky-btn]', sticky).addEventListener('click', function () { if (!add.disabled) add.click(); });
      }
      /* record recently viewed */
      var wb = $('[data-wish]', pd);
      if (wb) { var h = wb.getAttribute('data-wish'), r = store.get('recent').filter(function (x) { return x !== h; }); r.unshift(h); store.set('recent', r.slice(0, 12)); }
    }

    /* ---------- wishlist / recent / upsell / related ---------- */
    var wl = $('[data-wish-list]');
    if (wl) {
      var wa = store.get('wishlist'), we = $('[data-wish-empty]');
      if (!wa.length) { we.hidden = false; } else fetchProducts(wa).then(function (ps) { wl.innerHTML = ps.map(cardHtml).join(''); we.hidden = ps.length > 0; syncWish(); });
    }
    $$('[data-recent]').forEach(function (sec) {
      var cur = sec.getAttribute('data-recent'), hs = store.get('recent').filter(function (x) { return x !== cur; }).slice(0, 4);
      if (!hs.length) return;
      fetchProducts(hs).then(function (ps) { if (!ps.length) return; $('[data-recent-list]', sec).innerHTML = ps.map(cardHtml).join(''); sec.hidden = false; syncWish(); });
    });
    var up = $('[data-upsell]');
    if (up && up.getAttribute('data-upsell')) {
      fetch(root + 'recommendations/products.json?product_id=' + up.getAttribute('data-upsell') + '&limit=4&intent=related').then(function (r) { return r.json(); }).then(function (d) {
        if (!d.products || !d.products.length) return; $('[data-upsell-list]', up).innerHTML = d.products.map(cardHtml).join(''); up.hidden = false; syncWish();
      }).catch(function () {});
    }
    var rel = $('[data-related]');
    if (rel && rel.getAttribute('data-url')) {
      fetch(rel.getAttribute('data-url')).then(function (r) { return r.text(); }).then(function (html) {
        var f = $('[data-related]', new DOMParser().parseFromString(html, 'text/html')); if (f && f.innerHTML.trim()) { rel.innerHTML = f.innerHTML; syncWish(); }
      }).catch(function () {});
    }

    /* ---------- cart drawer ---------- */
    var drawer = $('[data-drawer]'), body = $('[data-drawer-body]'), foot = $('[data-drawer-foot]'), bar = $('[data-drawer-bar]'), lastFocus;
    function setCount(n) { $$('[data-cart-count]').forEach(function (el) { el.textContent = n; el.hidden = !n; }); }
    function open() { lastFocus = document.activeElement; drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll'); var c = $('.icon-btn[data-drawer-close]', drawer); if (c) c.focus(); }
    function close() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); if (lastFocus) lastFocus.focus(); }
    function render(cart) {
      setCount(cart.item_count); var cur = cart.currency;
      if (T.freeShip > 0 && cart.item_count) {
        var rem = T.freeShip - cart.total_price, pct = Math.min(100, Math.round(cart.total_price * 100 / T.freeShip));
        bar.innerHTML = '<div class="fsbar"><p>' + esc(rem > 0 ? I.freeLeft.replace('__A__', money(rem, cur)) : I.freeDone) + '</p><div class="fsbar-track"><span style="width:' + pct + '%"></span></div></div>';
      } else bar.innerHTML = '';
      if (!cart.item_count) { body.innerHTML = '<div class="d-empty"><p>' + esc(I.empty) + '</p><button type="button" class="btn" data-drawer-close>' + esc(I.cont) + '</button></div>'; foot.innerHTML = ''; return; }
      body.innerHTML = cart.items.map(function (it) {
        var disc = (it.line_level_discount_allocations || []).map(function (a) { return '<small class="disc">' + esc(a.discount_application.title) + ' (-' + money(a.amount, cur) + ')</small>'; }).join('');
        var was = it.original_line_price !== it.final_line_price ? '<s class="muted">' + money(it.original_line_price, cur) + '</s><br>' : '';
        return '<div class="d-item"><a href="' + esc(it.url) + '">' + (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="lazy">' : '') + '</a>' +
          '<div><a href="' + esc(it.url) + '">' + esc(it.product_title) + '</a>' + (it.variant_title ? '<small>' + esc(it.variant_title) + '</small>' : '') + disc +
          '<div class="d-qty"><button type="button" data-change="' + esc(it.key) + '" data-q="' + (it.quantity - 1) + '" aria-label="-">−</button><span>' + it.quantity + '</span><button type="button" data-change="' + esc(it.key) + '" data-q="' + (it.quantity + 1) + '" aria-label="+">+</button></div>' +
          '<button type="button" class="d-remove" data-change="' + esc(it.key) + '" data-q="0">' + esc(I.remove) + '</button></div><div>' + was + money(it.final_line_price, cur) + '</div></div>';
      }).join('');
      var cd = (cart.cart_level_discount_applications || []).map(function (d) { return '<p class="disc-line"><span>' + esc(d.title) + '</span><span>-' + money(d.total_allocated_amount, cur) + '</span></p>'; }).join('');
      var saved = cart.total_discount > 0 ? '<p class="disc-line"><span>' + esc(I.saved) + '</span><span>' + money(cart.total_discount, cur) + '</span></p>' : '';
      foot.innerHTML = cd + saved + '<p class="d-total"><span>' + esc(I.subtotal) + '</span><strong>' + money(cart.total_price, cur) + '</strong></p><p class="muted">' + esc(I.taxes) + '</p>' +
        '<a class="btn btn-ghost" href="' + root + 'cart">' + esc(I.view) + '</a><form action="' + root + 'cart" method="post"><button class="btn btn-block" type="submit" name="checkout">' + esc(I.checkout) + '</button></form>';
    }
    function refresh() { return fetch(root + 'cart.js').then(function (r) { return r.json(); }).then(render); }
    function addToCart(data, btn) {
      if (btn) btn.classList.add('is-busy');
      return fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.description || j.message || 'Error'); return j; }); })
        .then(function () { if (T.cartType === 'page') { location.href = root + 'cart'; return; } return refresh().then(open); })
        .catch(function (e) { toast(e.message); })
        .then(function () { if (btn) btn.classList.remove('is-busy'); });
    }
    document.addEventListener('click', function (e) {
      var w = e.target.closest('[data-wish]');
      if (w) { var h = w.getAttribute('data-wish'), a = store.get('wishlist'), k = a.indexOf(h); if (k > -1) a.splice(k, 1); else a.push(h); store.set('wishlist', a); syncWish(); return; }
      if (!drawer) return;
      if (e.target.closest('[data-drawer-close]')) { close(); return; }
      var o = e.target.closest('[data-cart-open]');
      if (o && T.cartType === 'drawer' && !document.body.classList.contains('template-cart') && !(e.metaKey || e.ctrlKey)) { e.preventDefault(); refresh().then(open); return; }
      var q = e.target.closest('[data-quick-add]');
      if (q) { var fd = new FormData(); fd.append('id', q.getAttribute('data-quick-add')); fd.append('quantity', 1); addToCart(fd, q); return; }
      var c = e.target.closest('[data-change]');
      if (c) fetch(root + 'cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ id: c.getAttribute('data-change'), quantity: parseInt(c.getAttribute('data-q'), 10) }) }).then(function (r) { return r.json(); }).then(render);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (drawer && drawer.classList.contains('open')) close();
      if (so && !so.hidden) closeSearch();
      fToggle(false);
      var lb2 = $('[data-lightbox]'); if (lb2) lb2.hidden = true;
    });
    $$('form[data-ajax-add]').forEach(function (f) { f.addEventListener('submit', function (e) { if (!drawer) return; e.preventDefault(); addToCart(new FormData(f), $('[name=add]', f)); }); });

    /* login / recover toggle + delete address */
    $$('[data-toggle]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); var b = document.getElementById(a.getAttribute('data-toggle')); if (b) b.hidden = !b.hidden; }); });
    $$('[data-delete-address]').forEach(function (b) { b.addEventListener('click', function () { if (confirm(b.getAttribute('data-confirm')) && window.Shopify && Shopify.postLink) Shopify.postLink(b.getAttribute('data-delete-address'), { parameters: { _method: 'delete' } }); }); });
    syncWish();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
