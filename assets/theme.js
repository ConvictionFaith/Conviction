/* Conviction theme scripts. No dependencies. */
(() => {
  const T = window.theme || { routes: {}, strings: {} };
  const R = T.routes;
  const S = T.strings;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  function initLenis() {
    if (REDUCE || !window.Lenis || lenis) return;
    lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // Smooth in-page anchor links (e.g. /pages/help#shipping)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a || a.origin !== location.origin || a.pathname !== location.pathname) return;
      const target = a.hash && document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -90, duration: 1 });
      history.replaceState(null, '', a.hash);
    });
  }

  /* Photos fade in once loaded */
  const FADE_SEL = '.card__img, .iwt__img, .look__img, .product__img, .intro__img, .hero__img, .line__media img';
  document.addEventListener('load', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.matches(FADE_SEL)) requestAnimationFrame(() => img.classList.add('is-loaded'));
  }, true);
  function sweepImages(root = document) {
    $$(FADE_SEL, root).forEach((img) => { if (img.complete && img.naturalWidth) img.classList.add('is-loaded'); });
  }

  /* ---------- Bag drawer ---------- */
  const Bag = {
    get el() { return $('[data-cart-drawer]'); },
    lastFocus: null,

    open() {
      const d = this.el;
      if (!d) { window.location.href = R.cart; return; }
      this.lastFocus = document.activeElement;
      d.classList.remove('is-closing', 'is-open');
      d.hidden = false;
      void d.offsetWidth;
      d.classList.add('is-open', 'is-fresh');
      setTimeout(() => d.classList.remove('is-fresh'), 1200);
      document.body.classList.add('has-drawer');
      lenis && lenis.stop();
      const panel = $('.drawer__panel', d);
      panel && panel.focus();
    },

    close() {
      const d = this.el;
      if (!d || d.hidden || d.classList.contains('is-closing')) return;
      const finish = () => {
        d.hidden = true;
        d.classList.remove('is-open', 'is-closing');
        document.body.classList.remove('has-drawer');
        lenis && lenis.start();
        if (this.lastFocus) this.lastFocus.focus();
      };
      if (REDUCE) return finish();
      d.classList.add('is-closing');
      setTimeout(finish, 380);
    },

    render(sections) {
      if (!sections) return;
      const html = sections['cart-drawer'];
      const d = this.el;
      if (!html || !d) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = doc.querySelector('[data-cart-drawer]');
      if (fresh) { d.innerHTML = fresh.innerHTML; sweepImages(d); }
    },

    async refreshCount() {
      try {
        const res = await fetch(`${R.cart}.js`, { headers: { Accept: 'application/json' } });
        const cart = await res.json();
        $$('[data-cart-count]').forEach((n) => {
          if (n.textContent !== String(cart.item_count)) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
          n.textContent = cart.item_count;
        });
        $$('[data-cart-toggle]').forEach((n) => {
          n.setAttribute('aria-label', `Bag, ${cart.item_count} items`);
        });
      } catch (e) { /* count stays as is */ }
    },

    async add(formData) {
      formData.append('sections', 'cart-drawer');
      formData.append('sections_url', window.location.pathname);
      const res = await fetch(R.cartAdd, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || S.error);
      return data;
    },

    async change(line, quantity) {
      const d = this.el;
      d && d.classList.add('is-busy');
      try {
        const res = await fetch(R.cartChange, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ line, quantity, sections: ['cart-drawer'], sections_url: window.location.pathname })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.description || S.error);
        this.render(data.sections);
        $$('[data-cart-count]').forEach((n) => { n.textContent = data.item_count; n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); });
      } catch (e) {
        window.location.href = R.cart;
      } finally {
        d && d.classList.remove('is-busy');
      }
    },

    async afterAdd(data) {
      if (T.cartType === 'page' || !this.el) {
        window.location.href = R.cart;
        return;
      }
      this.render(data.sections);
      await this.refreshCount();
      this.open();
    }
  };

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-cart-toggle]');
    if (toggle && Bag.el && T.cartType === 'drawer') {
      e.preventDefault();
      Bag.open();
      return;
    }
    if (e.target.closest('[data-cart-close]')) {
      e.preventDefault();
      Bag.close();
      return;
    }
    const lineBtn = e.target.closest('[data-line-change]');
    if (lineBtn && lineBtn.closest('[data-cart-drawer]')) {
      e.preventDefault();
      Bag.change(Number(lineBtn.dataset.lineChange), Number(lineBtn.dataset.qty));
    }
  });

  document.addEventListener('keydown', (e) => {
    const d = Bag.el;
    if (!d || d.hidden) return;
    if (e.key === 'Escape') { Bag.close(); return; }
    if (e.key === 'Tab') {
      const focusables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', $('.drawer__panel', d));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Quick add from product cards ---------- */
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-quick-add]');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    const fd = new FormData();
    fd.append('id', btn.dataset.quickAdd);
    fd.append('quantity', '1');
    btn.disabled = true;
    try {
      const data = await Bag.add(fd);
      btn.classList.add('is-added');
      setTimeout(() => btn.classList.remove('is-added'), 1200);
      await Bag.afterAdd(data);
    } catch (err) {
      alert(err.message || S.error);
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Product page ---------- */
  function initProduct(section) {
    const form = $('.product__form', section);
    const jsonEl = $('[data-product-json]', section);
    if (!form || !jsonEl) return;
    const { variants } = JSON.parse(jsonEl.textContent);
    const idInput = $('[data-variant-input]', form);
    const addBtn = $('[data-add-button]', form);
    const errorEl = $('[data-form-error]', form);
    const priceWrap = $('[data-price-wrap]', section);
    const inputs = $$('[data-option-input]', form);
    const optionCount = variants[0] ? variants[0].options.length : 0;

    const selected = () => {
      const values = new Array(optionCount).fill(null);
      inputs.forEach((i) => {
        if (i.type === 'hidden' || i.checked) values[Number(i.dataset.index)] = i.value;
      });
      return values;
    };

    const findVariant = (values) =>
      variants.find((v) => v.options.every((o, idx) => o === values[idx]));

    const markAvailability = (values) => {
      inputs.forEach((i) => {
        if (i.type !== 'radio') return;
        const idx = Number(i.dataset.index);
        const trial = values.slice();
        trial[idx] = i.value;
        const match = variants.find((v) => v.options.every((o, k) => trial[k] === null || o === trial[k]));
        i.parentElement.classList.toggle('is-unavailable', !match || !match.available);
      });
    };

    const update = () => {
      const values = selected();
      $$('[data-option-group]', form).forEach((group) => {
        const checked = $('input:checked', group);
        const label = $('[data-option-selected]', group);
        if (checked && label) label.textContent = checked.value;
        group.classList.remove('is-missing');
      });
      markAvailability(values);
      if (errorEl) errorEl.hidden = true;

      if (values.includes(null)) {
        addBtn.disabled = false;
        addBtn.textContent = S.chooseSize;
        return;
      }
      const v = findVariant(values);
      if (!v) {
        addBtn.disabled = true;
        addBtn.textContent = S.unavailable;
        return;
      }
      idInput.value = v.id;
      addBtn.disabled = !v.available;
      addBtn.textContent = v.available ? S.addToBag : S.soldOut;
      addBtn.dataset.needsChoice = 'false';

      if (priceWrap) {
        priceWrap.innerHTML = v.compare
          ? `<span class="price price--sale"><span class="price__now">${v.price}</span> <s class="price__was">${v.compare}</s></span>`
          : `<span class="price"><span class="price__now">${v.price}</span></span>`;
      }

      const url = new URL(window.location.href);
      url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url.toString());

      if (v.media) {
        const slide = $(`[data-media-id="${v.media}"]`, section);
        const track = $('[data-gallery-track]', section);
        if (slide && track && track.scrollWidth > track.clientWidth) {
          track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
        }
      }
    };

    inputs.forEach((i) => i.addEventListener('change', update));
    if (inputs.some((i) => i.type === 'radio')) markAvailability(selected());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = selected();
      if (values.includes(null)) {
        $$('[data-option-group]', form).forEach((group) => {
          if (!$('input:checked', group)) { group.classList.remove('is-missing'); void group.offsetWidth; group.classList.add('is-missing'); }
        });
        const missing = $('.is-missing input', form);
        missing && missing.focus();
        if (errorEl) { errorEl.textContent = S.chooseSize; errorEl.hidden = false; }
        return;
      }
      const original = addBtn.textContent;
      addBtn.disabled = true;
      addBtn.textContent = S.adding;
      try {
        const data = await Bag.add(new FormData(form));
        addBtn.textContent = S.added;
        await Bag.afterAdd(data);
      } catch (err) {
        if (errorEl) { errorEl.textContent = err.message || S.error; errorEl.hidden = false; }
      } finally {
        setTimeout(() => { addBtn.disabled = false; addBtn.textContent = original === S.chooseSize ? S.addToBag : original; }, 900);
      }
    });

    /* Gallery counter on phones */
    const track = $('[data-gallery-track]', section);
    const current = $('[data-gallery-current]', section);
    if (track && current) {
      track.addEventListener('scroll', () => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        current.textContent = String(i + 1);
      }, { passive: true });
    }
  }

  /* ---------- Recommendations ---------- */
  function initRecommendations() {
    $$('[data-recommendations]').forEach(async (el) => {
      if (el.children.length) return;
      try {
        const res = await fetch(el.dataset.url);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('[data-recommendations]');
        if (fresh && fresh.innerHTML.trim()) { el.innerHTML = fresh.innerHTML; initMotion(el); }
      } catch (e) { /* section stays empty */ }
    });
  }

  /* ---------- Film sound ---------- */
  function initFilm() {
    $$('[data-film]').forEach((film) => {
      const video = $('video', film);
      const btn = $('[data-film-sound]', film);
      if (!video || !btn) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        video.removeAttribute('autoplay');
        video.pause();
      }
      btn.addEventListener('click', () => {
        const turnOn = video.muted;
        video.muted = !turnOn;
        if (turnOn) { video.currentTime = 0; video.play(); }
        btn.setAttribute('aria-pressed', String(turnOn));
        btn.textContent = turnOn ? btn.dataset.labelOn : btn.dataset.labelOff;
      });
    });
  }


  /* ---------- Motion ---------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w.replace(/</g, '&lt;')}</span></span>`).join(' ');
    el.classList.add('split');
    el.dataset.splitDone = '1';
  }

  let revealObserver;
  function initMotion(root = document) {
    $$('[data-split]', root).forEach(splitWords);
    $$('[data-stagger]', root).forEach((ul) => Array.from(ul.children).forEach((li, i) => li.style.setProperty('--i', i % 8)));
    const targets = $$('[data-split], [data-reveal], [data-stagger]', root);
    const hero = $('[data-hero]', root);
    if (REDUCE || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in'));
      hero && hero.classList.add('in');
      return;
    }
    revealObserver = revealObserver || new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach((t) => revealObserver.observe(t));
    if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('in')));
  }

  /* Header hide/show and hero parallax */
  (() => {
    const header = $('[data-header]');
    let lastY = window.scrollY, ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (header) {
        header.classList.toggle('is-scrolled', y > 8);
        if (y > 240 && y > lastY + 4) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 240) header.classList.remove('is-hidden');
      }
      lastY = y;
      if (!REDUCE) {
        const par = $('[data-parallax]');
        if (par && y < window.innerHeight * 1.2) par.style.transform = `translate3d(0, ${Math.round(y * 0.28)}px, 0)`;
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  })();

  /* Smooth accordions */
  document.addEventListener('click', (e) => {
    const sum = e.target.closest('details.fold > summary');
    if (!sum || REDUCE) return;
    const det = sum.parentElement;
    const body = $('.fold__body', det);
    if (!body || det.dataset.animating) return;
    e.preventDefault();
    det.dataset.animating = '1';
    if (det.open) {
      const a = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.77,0,.18,1)' });
      a.onfinish = () => { det.open = false; delete det.dataset.animating; };
    } else {
      det.open = true;
      const a = body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
      a.onfinish = () => { delete det.dataset.animating; };
    }
  });


  /* Footer wordmark: reveal and let the photo drift inside the letters */
  function initBigmark() {
    const wrap = $('[data-bigmark]');
    if (!wrap || wrap.dataset.ready) return;
    wrap.dataset.ready = '1';
    const fill = $('.bigmark__fill', wrap);
    if (REDUCE || !('IntersectionObserver' in window)) { wrap.classList.add('in'); return; }
    let visible = false, ticking = false;
    new IntersectionObserver((es) => es.forEach((e) => {
      visible = e.isIntersecting;
      if (e.isIntersecting) wrap.classList.add('in');
    }), { threshold: [0, 0.2] }).observe(wrap);
    const drift = () => {
      ticking = false;
      if (!visible) return;
      const r = wrap.getBoundingClientRect();
      const t = 1 - (r.top + r.height) / (window.innerHeight + r.height);
      fill.style.backgroundPosition = `50% ${Math.round(20 + t * 60)}%`;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  }

  /* ---------- Sorting ---------- */
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-auto-submit]')) e.target.form.submit();
  });

  function init() {
    initLenis();
    sweepImages();
    initMotion();
    initBigmark();
    $$('[data-product-section]').forEach(initProduct);
    initRecommendations();
    initFilm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* Theme editor support */
  document.addEventListener('shopify:section:load', (e) => {
    initMotion(e.target);
    initBigmark();
    const s = $('[data-product-section]', e.target);
    s && initProduct(s);
    initRecommendations();
    initFilm();
  });
})();
