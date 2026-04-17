/**
 * CashNoPix — Paradise Pags Integration
 * Baseado no Helper oficial fornecido pelo usuário.
 */

const PARADISE_CONFIG = {
  baseUrl: 'https://multi.paradisepags.com/api/v1',
  apiKey: 'sk_442210ea27466a39a787b9cd791c0d93c3f374bfb9eea4443dd0656a319ddb23',
  sellerId: 7215,
};

class ParadisePixAPI {
  constructor(config = PARADISE_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Erro HTTP ${response.status}`);
    return data;
  }

  async createPixTransaction({ amount, description, reference, customer }) {
    const payload = {
      amount,
      description,
      reference,
      customer,
      source: 'api_externa'
    };
    return this.request('/transaction.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTransactionById(id) {
    return this.request(`/transaction/status?id=${id}`, {
      method: 'GET',
    });
  }
}

// Singleton instance for the funnel
const pixAPI = new ParadisePixAPI();

const PAY = {
  async createPix(amount, description = 'Taxa de Validação CashNoPix') {
    const state = JSON.parse(localStorage.getItem('cnp') || '{}');
    
    // Converte para centavos (OBRIGATÓRIO para a API)
    const amountInCents = Math.round(parseFloat(amount) * 100);
    const ref = 'CNP_' + Date.now();
    
    const customer = {
      name: state.nome || 'Usuário CashNoPix',
      email: (state.nome ? state.nome.replace(/\s/g, '').toLowerCase() : 'user') + '@email.com',
      phone: state.whatsapp || '11999999999', // Campo OBRIGATÓRIO p/ Paradise
      document: '12345678909' // CPF Placeholder
    };

    try {
      const data = await pixAPI.createPixTransaction({
        amount: amountInCents,
        description,
        reference: ref,
        customer
      });

      // Normalização dos campos de retorno da Paradise
      const qrCodeText = data.qr_code || data.pix_string;
      let qrCodeImg = data.qr_code_base64 || data.qrcode || '';
      
      // FALLBACK: Se qr_code_base64 vier nulo, geramos via API externa usando a string PIX
      if (!qrCodeImg && qrCodeText) {
        qrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeText)}`;
      }
      
      // Adiciona prefixo se for base64 puro (sem o cabeçalho data:image)
      if (qrCodeImg && !qrCodeImg.startsWith('http') && !qrCodeImg.startsWith('data:')) {
        qrCodeImg = 'data:image/png;base64,' + qrCodeImg;
      }

      // Trigger Pixel: InitiateCheckout
      if (typeof fbTrack === 'function') {
        fbTrack('InitiateCheckout', { 
          value: amount / 100, 
          currency: 'BRL',
          content_name: description
        });
      }

      return {
        id: data.id,
        copy_paste: qrCodeText,
        qrcode: qrCodeImg
      };
    } catch (err) {
      console.error('Paradise API Error:', err);
      throw err;
    }
  },

  async checkStatus(id) {
    try {
      const data = await pixAPI.getTransactionById(id);
      
      // Trigger Pixel: Purchase (approved/paid)
      if ((data.status === 'paid' || data.status === 'approved') && !state.tracked) {
        if (typeof fbTrack === 'function') {
          fbTrack('Purchase', { 
            value: data.amount / 100, 
            currency: 'BRL',
            transaction_id: id
          });
          // Mark as tracked to avoid duplicate firing
          state.tracked = true;
          localStorage.setItem('cnp', JSON.stringify(state));
        }
      }

      return data.status; // 'pending', 'paid', 'approved', etc.
    } catch (err) {
      console.error('Status Check Error:', err);
      return 'error';
    }
  },

  trackPixel(eventName, params = {}) {
    if (typeof fbq === 'function') {
      fbq('track', eventName, params);
      console.log(`Pixel Track: ${eventName}`, params);
    }
  }
};

window.PAY = PAY;
