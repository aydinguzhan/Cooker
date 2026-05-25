type PromptSkill = {
  id: string;
  name: string;
  short_key: string;
};

export function buildProfilePrompt(prompt: string, skills: PromptSkill[]) {
  return `
Kullanıcının verdiği metinden profil sayfası için structured JSON üret.

Kurallar:
- Sadece verilen bilgileri kullan.
- Bilinmeyen alanları null, boş string veya boş array yap.
- Skill level 1-5 arası olmalı.
- Skill üretirken sadece aşağıdaki skill listesinden seçim yap.
- skills alanındaki her item için skill_id, name, short_key ve level dön.
- Skill listesinde olmayan yeni bir skill uydurma.
- experiences.startDate ve experiences.endDate alanlarini ISO formatta don: YYYY-MM-DD.
- Eger sadece yil biliniyorsa YYYY-01-01 kullan.
- Eger yil ve ay biliniyorsa YYYY-MM-01 kullan.
- Devam eden iste experiences.isCurrent true, experiences.endDate null don.
- Açıklama yazma.
- Sadece JSON üret.

Kullanılabilir skill listesi:
${JSON.stringify(skills, null, 2)}

Kullanıcı metni:
${prompt}
`;
}
