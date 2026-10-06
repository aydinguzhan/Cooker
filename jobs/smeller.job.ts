import cron from 'node-cron';
import { smellerService } from '../src/modules/job_smeller/smeller.module.js';
import { env } from '../src/config/env.js';


cron.schedule(env.SMELL_CRON_SCHEDULE, async () => {
    console.log('5 dakikalık görev tetiklendi:', new Date().toLocaleTimeString());

    try {
        const results = await smellerService.scrapeWithAI(env.SMELL_KEYWORD);

        // 1. Mantık Düzeltmesi: Başarısızsa veya veri yoksa işlemi kes
        if (!results || results.length === 0) {
            console.warn('Scrape işlemi başarısız oldu veya yeni veri bulunamadı.');
            return;
        }
        const uniqueResults = Array.from(
            new Map(results.map((job) => [job.url, job])).values(),
        );

        // 2. Fetch işlemini await ile bekleme
        const res = await fetch(env.CREATE_JOB_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${env.BACKEND_INGEST_TOKEN}`,
            },
            body: JSON.stringify(uniqueResults),
        });

        // 3. Sunucu hatası detayını öğrenme
        if (!res.ok) {
            const errorText = await res.text(); // Sunucudan dönen hata mesajını al
            throw new Error(`HTTP ${res.status} - Sunucu Hatası: ${errorText}`);
        }

        const data = await res.json();
        console.log('Sunucu Yanıtı:', data.data);
        console.log(`Scrape with Kariyer işlemi başarıyla tamamlandı.`);

    } catch (error) {
        console.error('Görev sırasında hata oluştu:', error);
    }
});
