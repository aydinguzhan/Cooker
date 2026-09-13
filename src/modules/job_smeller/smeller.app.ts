import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { gemini } from '../../providers/gemini.provider';
import { jobSmellerBuildPrompt } from './smeller.propt';
import { Job, jobResponseSchema, JobSchema } from './smeller.schema';
import { env } from '../../config/env';

puppeteer.use(StealthPlugin());


export async function scrapeWithAI(keyword: string): Promise<Job[]> {
    console.log(`[+] Kariyer.net üzerinde AI ile "${keyword}" araması başlatılıyor...`);

    const browser = await puppeteer.launch({
        headless: env.PUPPETEER_HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        const targetUrl = `${env.KARIYER_URL}?kw=${encodeURIComponent(keyword)}`;
        console.log(`[+] Sayfaya gidiliyor: ${targetUrl}`);

        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Sayfada ilan linklerinin belirmesini bekle
        await page.waitForFunction(
            () => document.querySelectorAll('a[href*="-is-ilani-"], a[href*="/is-ilani/"]').length > 0,
            { timeout: 15000 }
        ).catch(() => console.log('[!] İlan linkleri beklenirken zaman aşımı, mevcut DOM ile devam ediliyor...'));

        // 3. Sadece ilanlarla ilgili HTML/Metin parçalarını topla (Token tasarrufu ve hızlı yanıt için)
        const rawJobBlocks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="-is-ilani-"], a[href*="/is-ilani/"]'));
            const blocks: Array<{ href: string; text: string }> = [];

            links.forEach((link) => {
                const card = link.closest('div') || link.parentElement;
                if (card && card.innerText.length > 10) {
                    blocks.push({
                        href: link.href,
                        text: card.innerText.replace(/\n+/g, ' ').trim()
                    });
                }
            });

            return blocks.slice(0, 20); // İlk 20 ilanı AI'a gönder
        });

        if (rawJobBlocks.length === 0) {
            console.log('[-] Sayfada iş ilanı bloğu bulunamadı.');
            return [];
        }

        console.log(`[+] AI Model parametreleri ile ${rawJobBlocks.length} adet ham veri bloğu analiz ediliyor...`);

        // 4. Gemini SDK Çağrısı
        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: jobSmellerBuildPrompt(keyword, rawJobBlocks),
            config: {
                responseMimeType: 'application/json',
                responseSchema: jobResponseSchema
            }
        });

        const responseText = response.text;
        if (!responseText) {
            console.log('[-] Gemini modelinden boş yanıt döndü.');
            return [];
        }

        const parsedData = JSON.parse(responseText);

        // Zod Doğrulaması
        const validJobs = JobSchema.array().parse(parsedData);

        console.log(`[✓] AI tarafından ${validJobs.length} adet geçerli ilan çıkarıldı.`);
        return validJobs;

    } catch (error) {
        const err = error as Error;
        console.error('[-] AI Kazıma hatası:', err.message);
        return [];
    } finally {
        await browser.close();
    }
}

// Test çalıştırması
scrapeWithAI(env.SMELL_KEYWORD).then((jobs) => {
    console.log('Çekilen İlanlar:', JSON.stringify(jobs, null, 2));
    process.exit(0);
});
