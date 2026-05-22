export function buildProfilePrompt(prompt: string) {
  return `
Kullanıcının verdiği metinden profil sayfası için structured JSON üret.

Kurallar:
- Sadece verilen bilgileri kullan.
- Bilinmeyen alanları null, boş string veya boş array yap.
- Skill level 1-5 arası olmalı.
- Açıklama yazma.
- Sadece JSON üret.

Kullanıcı metni:
${prompt}
`;
}
