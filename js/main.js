// Doce Quintal: interatividade (JavaScript ES6+)
(() => {
  'use strict';

  // Para receber os pedidos por e-mail, cole aqui o endereço do Formspree (ex.: 'https://formspree.io/f/abcdwxyz').
  // Vazio = envio simulado (útil para testar a validação e as mensagens).
  const FORM_ENDPOINT = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Modo escuro/claro (lembra a escolha)
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  const applyTheme = (t) => {
    root.setAttribute('data-bs-theme', t);
    themeBtn.innerHTML = `<i class="bi ${t === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}"></i>`;
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    try { localStorage.setItem('dq-theme', t); } catch (e) {}
  };
  applyTheme(root.getAttribute('data-bs-theme'));
  themeBtn.addEventListener('click', () => applyTheme(root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'));

  // 2. Navbar: sombra ao rolar e menu mobile que fecha ao clicar num link
  const nav = $('#mainNav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const menu = $('#navMenu');
  $$('.nav-link', menu).forEach((a) => a.addEventListener('click', () => {
    if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }));

  // 3. Contadores animados (começam quando aparecem na tela)
  const counters = $$('.count');
  const runCount = (el) => {
    const { target, prefix = '', suffix = '' } = el.dataset;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1600, 1);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { runCount(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach((c) => { c.textContent = (c.dataset.prefix || '') + '0' + (c.dataset.suffix || ''); io.observe(c); });
  }

  // 4. Filtro do cardápio
  const items = $$('.menu-item');
  $$('.btn-filter').forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('.btn-filter').forEach((b) => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn); });
    let shown = 0;
    items.forEach((it) => {
      const show = f === 'all' || it.dataset.category === f;
      it.classList.toggle('d-none', !show);
      it.classList.remove('is-entering');
      if (show) { shown++; void it.offsetWidth; it.classList.add('is-entering'); }
    });
    $('#menuStatus').textContent = `Mostrando ${shown} ${shown === 1 ? 'item' : 'itens'}.`;
  }));

  // 5. Modal de produto (preenchido a partir dos data-attributes do card)
  const modalEl = $('#produtoModal');
  const img = $('#modalImg');
  let current = null, wantsOrder = false;
  modalEl.addEventListener('show.bs.modal', (e) => {
    const d = e.relatedTarget.dataset;
    current = d;
    $('#produtoModalLabel').textContent = d.name;
    $('#modalDesc').textContent = d.desc;
    $('#modalPrice').textContent = d.price;
    img.hidden = false;
    img.onerror = () => { img.hidden = true; };
    img.alt = d.name;
    img.src = d.img;
  });
  $('#modalOrder').addEventListener('click', () => { wantsOrder = true; });
  modalEl.addEventListener('hidden.bs.modal', () => {
    if (!wantsOrder) return;
    wantsOrder = false;
    const tipos = { bolos: 'Bolos', doces: 'Doces para festa', tortas: 'Tortas', salgados: 'Salgados' };
    $('#tipo').value = tipos[current.category] || 'Outro';
    const msg = $('#mensagem');
    if (!msg.value.trim()) msg.value = `Olá! Gostaria de encomendar: ${current.name}. `;
    $('#encomendas').scrollIntoView();
    setTimeout(() => $('#nome').focus({ preventScroll: true }), 500);
  });

  // 6. Carrossel de depoimentos (sem rotação automática se o usuário prefere menos movimento)
  new bootstrap.Carousel('#depoCarousel', { ride: reduceMotion ? false : 'carousel', interval: 7000 });

  // 7. Formulário: máscara do telefone, validação e envio
  const form = $('#orderForm');
  const rules = {
    nome: (v) => v.trim().length >= 3 && /^[\p{L}\s'.-]+$/u.test(v.trim()),
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    telefone: (v) => [10, 11].includes(v.replace(/\D/g, '').length),
    tipo: (v) => v !== '',
    mensagem: (v) => v.trim().length >= 10,
  };
  const fields = $$('[name]', form).filter((f) => rules[f.name]);
  const check = (f) => {
    const ok = rules[f.name](f.value);
    f.classList.toggle('is-invalid', !ok);
    f.classList.toggle('is-valid', ok);
    return ok;
  };
  fields.forEach((f) => {
    f.addEventListener('blur', () => check(f));
    f.addEventListener('input', () => { if (f.classList.contains('is-invalid')) check(f); });
  });
  $('#telefone').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    e.target.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
      : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
      : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });

  const alertBox = $('#formAlert');
  const showAlert = (type, text) => { alertBox.className = `alert alert-${type} mb-3`; alertBox.textContent = text; };
  const setLoading = (on) => {
    $('#submitBtn').disabled = on;
    $('#submitBtn .spinner-border').classList.toggle('d-none', !on);
    $('#submitBtn .label').textContent = on ? 'Enviando...' : 'Enviar encomenda';
  };
  const send = async (data) => {
    if (!FORM_ENDPOINT) { await new Promise((r) => setTimeout(r, 1200)); return; } // simulação
    const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.className = 'alert d-none mb-3';
    const results = fields.map(check);
    if (results.includes(false)) {
      fields[results.indexOf(false)].focus();
      showAlert('danger', 'Confira os campos destacados e tente de novo.');
      return;
    }
    if (form.elements._gotcha.value) return; // anti-spam
    setLoading(true);
    try {
      await send(new FormData(form));
      showAlert('success', 'Encomenda enviada! Respondemos em até 1 dia útil pelo e-mail ou telefone informado.');
      form.reset();
      fields.forEach((f) => f.classList.remove('is-valid', 'is-invalid'));
    } catch (err) {
      showAlert('danger', 'Não foi possível enviar agora. Tente de novo em instantes ou chame no WhatsApp.');
    } finally {
      setLoading(false);
    }
  });

  // 8. Ano do rodapé
  $('#year').textContent = new Date().getFullYear();
})();
