import cron from 'node-cron';
import { smellerController } from '../src/modules/job_smeller/smeller.module'


cron.schedule('*/5 * * * *', async () => {
    console.log('5 dakikalık görev tetiklendi:', new Date().toLocaleTimeString());

    try {
        const results = await smellerController.kariyerScrapeWithAILocal("web");

        // 1. Mantık Düzeltmesi: Başarısızsa veya veri yoksa işlemi kes
        if (!results || results.length === 0) {
            console.warn('Scrape işlemi başarısız oldu veya yeni veri bulunamadı.');
            return;
        }
        console.log(results)

        // 2. Fetch işlemini await ile bekleme
        const res = await fetch(process.env.CREATE_JOB_URL as string, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
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