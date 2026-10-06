# BIST Finans API

API prefix: `/ai/fin-smell`  
Default local server: `http://localhost:3000` (`PORT` değişkeniyle değiştirilebilir.)

Sunucuyu proje kökünde başlat:

```bash
npm run dev
```

`GEMINI_API_KEY` ve projenin `.env` dosyasında gereken diğer ayarlar tanımlı olmalı. İsteklerde BIST sembolünü kullan; `.IS` uzantısı gönderilirse kaldırılır. Sembol büyük/küçük harfe duyarsızdır.

## 1. BIST 100 şirket listesini al

```http
GET /ai/fin-smell/companies
```

Örnek:

```bash
curl http://localhost:3000/ai/fin-smell/companies
```

Yanıt:

```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "symbol": "THYAO",
      "companyName": "Türk Hava Yolları",
      "sector": "Ulaştırma"
    }
  ]
}
```

`data`, JSON dosyasındaki şirketlerin tamamını içerir.

## 2. Yahoo Finance piyasa ve finansal verilerini al

```http
GET /ai/fin-smell/:symbol
```

Örnek:

```bash
curl http://localhost:3000/ai/fin-smell/THYAO
```

Yanıtın şekli:

```json
{
  "success": true,
  "data": {
    "company": {
      "symbol": "THYAO",
      "companyName": "Türk Hava Yolları",
      "sector": "Ulaştırma"
    },
    "market": {
      "currency": "TRY",
      "regularMarketPrice": 0,
      "regularMarketChange": 0,
      "regularMarketChangePercent": 0,
      "regularMarketPreviousClose": 0,
      "regularMarketDayHigh": 0,
      "regularMarketDayLow": 0,
      "regularMarketVolume": 0,
      "marketCap": 0,
      "fiftyTwoWeekHigh": 0,
      "fiftyTwoWeekLow": 0,
      "quoteTimestamp": "2026-01-01T10:00:00.000Z"
    },
    "fundamentals": {
      "revenueGrowth": 0,
      "earningsGrowth": 0,
      "profitMargins": 0,
      "returnOnEquity": 0,
      "debtToEquity": 0,
      "currentRatio": 0,
      "freeCashflow": 0,
      "trailingPE": 0,
      "forwardPE": 0,
      "priceToBook": 0,
      "dividendYield": 0
    },
    "dataRetrievedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

Yukarıdaki sayısal değerler ve tarihler yalnızca örnektir. Yahoo Finance’in sağlamadığı temel göstergeler yanıtta eksik olabilir. Gerçek veriler istenirken Yahoo Finance’ten alınır.

## 3. Yatırımcıya yönelik AI analizini al

```http
POST /ai/fin-smell/:symbol/analyze
```

Örnek:

```bash
curl -X GET http://localhost:3000/ai/fin-smell/THYAO/analyze
```

İstek gövdesi gerekmez. Sunucu Yahoo Finance verisini alır ve Gemini’ye yorumlatır.

Yanıtın şekli:

```json
{
  "success": true,
  "data": {
    "companyOverview": "Şirketin faaliyet alanının kısa açıklaması.",
    "marketData": "Fiyat ve piyasa verilerinin özeti.",
    "financialAssessment": "Büyüme, kârlılık, borçluluk ve değerleme göstergelerinin değerlendirmesi.",
    "analysisSummary": "Yatırımcı için birkaç cümlelik kısa özet.",
    "risks": ["Veriye dayalı risk açıklaması."],
    "dataAsOf": "2026-01-01T10:00:00.000Z"
  }
}
```

Analiz yanıtı model tarafından oluşturulur; aynı istek için metin ve değerlendirmeler değişebilir. Endpoint kesin al/sat tavsiyesi üretmek üzere tasarlanmamıştır.

## 4. KAP bildirimlerini ayrıca al

KAP taraması, Yahoo Finance analiz endpoint’inden ayrıdır:

```http
GET /ai/fin-smell/:symbol/kap?days=90&limit=5
```

`days`: geriye dönük gün sayısı (1–365, varsayılan 90).  
`limit`: getirilecek bildirim sayısı (1–10, varsayılan 5).

```bash
curl "http://localhost:3000/ai/fin-smell/THYAO/kap?days=90&limit=5"
```

Yanıt her bildirim için `publishDate`, `subject`, `summary`, `url` ve sayfadan çıkarılan `content` alanlarını içerebilir.

## Hata yanıtları

BIST 100 listesinde olmayan bir sembolde `404` döner:

```json
{
  "success": false,
  "message": "BIST 100 şirketi bulunamadı: ABC"
}
```

Yahoo Finance, Gemini veya KAP erişim hatalarında ilgili endpoint `502` döner ve `message` alanında hata açıklamasını verir.
