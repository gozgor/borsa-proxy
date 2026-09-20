/**
 * BORSA SİNYAL PANELİ — Veri Köprüsü (Cloudflare Worker)
 * ---------------------------------------------------------
 * Bu küçük kod, Yahoo Finance'ten hisse verisini çekip
 * tarayıcının (Blogger sayfandaki JS'in) okuyabileceği şekilde
 * sana geri veriyor. Tarayıcılar güvenlik nedeniyle Yahoo'ya
 * doğrudan istek atmana izin vermiyor (CORS engeli), bu worker
 * o engeli aşmak için araya giriyor.
 *
 * KURULUM (yaklaşık 3 dakika, ücretsiz):
 * 1. https://dash.cloudflare.com adresine ücretsiz üye ol / giriş yap.
 * 2. Sol menüden "Workers & Pages" > "Create" > "Create Worker".
 * 3. Bir isim ver (örn. "borsa-proxy"), "Deploy" de.
 * 4. Açılan editörde mevcut kodu SİL, bu dosyanın TAMAMINI yapıştır.
 * 5. Sağ üstten "Deploy" / "Save and deploy" butonuna bas.
 * 6. Sana verilen adresi kopyala, örn:
 *    https://borsa-proxy.SENIN-KULLANICI-ADIN.workers.dev
 * 7. Bu adresi, borsa-sinyal-paneli.html dosyasındaki
 *    PROXY_URL değişkenine yapıştıracaksın.
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Tarayıcı bazen "OPTIONS" ile ön kontrol isteği atar, buna izin verelim.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const symbol = url.searchParams.get("symbol");
    if (!symbol) {
      return json({ error: "symbol parametresi gerekli, örn: ?symbol=THYAO.IS" }, 400);
    }

    const range = url.searchParams.get("range") || "1y";
    const interval = url.searchParams.get("interval") || "1d";

    const yahooUrl =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

    try {
      const resp = await fetch(yahooUrl, {
        headers: {
          // Yahoo bazı isteksiz gelen isteklerde engelleme yapabiliyor,
          // gerçek bir tarayıcı gibi görünmek için basit bir User-Agent ekliyoruz.
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!resp.ok) {
        return json(
          { error: `Yahoo Finance isteği başarısız oldu (HTTP ${resp.status})` },
          resp.status
        );
      }

      const data = await resp.json();
      return json(data, 200);
    } catch (err) {
      return json({ error: "Veri çekilirken hata oluştu: " + err.message }, 500);
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: corsHeaders(),
  });
}
