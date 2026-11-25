const GA = import.meta.env.VITE_GA_ID;
const PX = import.meta.env.VITE_META_PIXEL_ID;

export function initTracking() {
  if (GA) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA, { send_page_view: false });
  }
  if (PX) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PX);
  }
}

export function pageview(path, title) {
  window.gtag?.("event", "page_view", { page_path: path, page_title: title });
  window.fbq?.("track", "PageView");
}

// metaEvento: nombre de evento estándar de Meta (ViewContent, AddToWishlist, Lead). Sin él se envía como personalizado.
export function track(nombre, params = {}, metaEvento) {
  window.gtag?.("event", nombre, params);
  if (window.fbq) {
    if (metaEvento) window.fbq("track", metaEvento, params);
    else window.fbq("trackCustom", nombre, params);
  }
}

export function utm() {
  const q = new URLSearchParams(location.search);
  return {
    utm_source: q.get("utm_source") || undefined,
    utm_medium: q.get("utm_medium") || undefined,
    utm_campaign: q.get("utm_campaign") || undefined,
  };
}
