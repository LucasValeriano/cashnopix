/**
 * Global Facebook Pixel & CAPI Integration
 */
(function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js'));

const PIXEL_ID = '1279585706937112';
const CAPI_TOKEN = 'EAANt5nyjdkABRPcPA4b3UixZCUmylyAlN9pb8z9ZBZBvedgAv4IFTVQlsQqaIToHdUIOACMSUMjVdT2uhVVpez3lZAOFORlCZC7pVvZAWmTV0zm96YFYYZC11m53S4wW7C1fWwon1GA9ck4pAUl2oToEmXBN5x5nOZC3UDKP3UZCd0bPvndQY7oasfcXtWAjeWrkArQZDZD';

fbq('init', PIXEL_ID);
fbq('track', 'PageView');

/**
 * fbTrack: Tracks events via Browser (Pixel) and Server (CAPI)
 * @param {string} eventName - Standard or custom event name
 * @param {object} data - Event parameters (value, currency, etc)
 */
async function fbTrack(eventName, data = {}) {
  // 1. Browser Pixel
  if (typeof fbq === 'function') {
    fbq('track', eventName, data);
  }

  // 2. Conversions API (CAPI) - Client-side proxy
  if (CAPI_TOKEN) {
    try {
      const userData = JSON.parse(localStorage.getItem('cnp') || '{}');
      const payload = {
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: window.location.href,
          user_data: {
            fn: userData.nome ? btoa(userData.nome.toLowerCase()) : undefined,
            ph: userData.whatsapp ? btoa(userData.whatsapp.replace(/\D/g,'')) : undefined,
            external_id: btoa(userData.email || 'guest'),
          },
          custom_data: {
            value: data.value,
            currency: data.currency || 'BRL',
          }
        }]
      };

      fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.error('CAPI Error:', e));

    } catch (err) {
      console.error('Tracking Helper Error:', err);
    }
  }
}

window.fbTrack = fbTrack;
