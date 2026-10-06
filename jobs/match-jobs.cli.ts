import { smellerService } from "../src/modules/job_smeller/smeller.module.js";
import type { JobMatchProfile } from "../src/modules/job_smeller/schemas/job.schema.js";

const [keyword = "", skillsInput = "", experienceInput = "0", location = ""] =
  process.argv.slice(2);

if (!keyword.trim()) {
  console.error(
    'Kullanım: npm run match-jobs -- "keyword" "Skill 1,Skill 2" deneyimYılı "şehir"',
  );
  process.exitCode = 1;
} else {
  const experience = Number(experienceInput);
  if (!Number.isFinite(experience) || experience < 0) {
    console.error("Deneyim yılı sıfır veya pozitif bir sayı olmalı.");
    process.exitCode = 1;
  } else {
    const userProfile: JobMatchProfile = {
      skills: skillsInput
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      experience,
      location: location.trim(),
    };

    try {
      const matches = await smellerService.searchMatchJobs(keyword, userProfile);
      console.log(JSON.stringify(matches, null, 2));
    } catch (error) {
      console.error("İş eşleştirme çalıştırılamadı:", error);
      process.exitCode = 1;
    }
  }
}
