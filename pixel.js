/**
 * Global Facebook Pixel Integration
 */
(function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

// REPLACE 'PIXEL_ID' with the real ID provided by the user
const PIXEL_ID = 'PIXEL_ID';

if (PIXEL_ID !== 'PIXEL_ID') {
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
} else {
    console.warn('Facebook Pixel ID not set in pixel.js');
}
