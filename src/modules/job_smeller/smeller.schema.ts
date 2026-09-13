import { z } from 'zod';
import { Type, Schema } from '@google/genai';

export const JobSchema = z.object({
    title: z.string(),
    company: z.string(),
    address: z.string(),
    description: z.string(),
    url: z.string()
});

export type Job = z.infer<typeof JobSchema>;

// 2. Gemini İçin Çıktı Şeması (Structured Output)
export const jobResponseSchema: Schema = {
    type: Type.ARRAY,
    description: 'Sayfadan ayıklanan iş ilanları listesi',
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'İlan veya pozisyon başlığı' },
            description: { type: Type.STRING, description: "İş ile ilgili bir açıklama varsa açıklaması yoksa boş string" },
            company: { type: Type.STRING, description: 'Şirket adı ve varsa diğer şirket bilgileri' },
            address: { type: Type.STRING, description: 'Şehir veya çalışma modeli (Hibrit, Uzaktan vb.)' },
            url: { type: Type.STRING, description: 'İlanın bağlantı adresi (href)' }
        },
        required: ['title', 'company', 'url']
    }
};