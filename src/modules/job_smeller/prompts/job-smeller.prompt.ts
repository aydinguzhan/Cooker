import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type {
  JobMatchCandidate,
  JobMatchProfile,
  JobSource,
} from "../schemas/job.schema.js";

export function buildJobExtractionMessages(
  keyword: string,
  sources: JobSource[],
) {
  return [
    new SystemMessage(
      "Kariyer ilanı sayfalarından alan çıkaran bir asistansın. " +
      "Yalnızca verilen ilan metinlerini kullan; bilgi uydurma. " +
      "Her kaynak için tam olarak bir kayıt üret ve sourceIndex değerini aynen koru. " +
      "description alanında detay sayfasında bulunan iş tanımı, sorumluluklar " +
      "ve aranan nitelikleri mümkün olduğunca eksiksiz aktar; özetleme veya " +
      "yeniden yazma. Açıklama bulunmuyorsa boş string döndür. " +
      "Şirket veya adres metinde yoksa boş string döndür.",
    ),
    new HumanMessage(
      `Arama anahtar kelimesi: ${keyword}\n\n` +
      `Kaynak ilanlar:\n${JSON.stringify(sources, null, 2)}`,
    ),
  ];
}

export function searchJobMatchMessages(
  keyword: string,
  jobs: JobMatchCandidate[],
  userProfile: JobMatchProfile,
) {
  const jobSummaries = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company:
      typeof job.company === "string"
        ? job.company
        : job.company?.name || job.company_name || "",
    address:
      job.address ||
      (typeof job.company === "string" ? "" : job.company?.address) ||
      "",
    description: (job.description || "").slice(0, 4_000),
  }));

  return [
    new SystemMessage(
      "İş arayan kişiye uygun ilanları sıralayan bir kariyer asistanısın. " +
        "Yalnızca verilen profil ve ilan verilerine dayan; bilgi uydurma. " +
        "Her eşleşmede listedeki job id değerini aynen kullan. " +
        "Her ilan için 0-100 arası uyum puanı ve en fazla üç kısa gerekçe üret. " +
        "Puanı beceri uyumu, deneyim seviyesi, konum ve arama anahtar kelimesine göre ver. " +
        "Yalnızca puanı 40 veya üzerindeki ilanları döndür; en uygunu önce sırala. " +
        "Profilde bulunmayan beceri veya deneyimi varsayma.",
    ),
    new HumanMessage(
      `Arama anahtar kelimesi: ${keyword.trim() || "Belirtilmedi"}\n\n` +
        `Kullanıcı profili:\n${JSON.stringify(userProfile, null, 2)}\n\n` +
        `Veritabanından gelen ilanlar:\n${JSON.stringify(jobSummaries, null, 2)}`,
    ),
  ];
}
