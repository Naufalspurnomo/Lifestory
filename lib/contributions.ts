import { createHash, randomBytes } from "crypto";

export const CONTRIBUTION_TOKEN_TTL_DAYS = 7;

export function generateContributionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashContributionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getContributionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + CONTRIBUTION_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function getContributionUrl(origin: string, token: string): string {
  return new URL(`/contribute/${token}`, origin).toString();
}

export const starterContributionPrompts = [
  "Apa kenangan masa kecil yang paling sering diceritakan tentang orang ini?",
  "Di rumah lama, sudut atau kebiasaan apa yang paling Anda ingat?",
  "Sekolah atau guru mana yang paling membentuk perjalanan hidupnya?",
  "Pekerjaan pertama apa yang pernah dijalani dan bagaimana ceritanya?",
  "Usaha keluarga apa yang pernah dirintis atau dijaga bersama?",
  "Apa alasan ia merantau, dan apa yang dibawanya pulang?",
  "Momen mudik atau pertemuan keluarga apa yang paling berkesan?",
  "Bagaimana kisah pernikahan atau pertemuan penting dalam keluarga?",
  "Resep apa yang selalu mengingatkan Anda pada rumah?",
  "Tradisi apa yang ingin tetap diteruskan ke generasi berikutnya?",
  "Pusaka atau benda apa yang punya cerita khusus?",
  "Panggilan keluarga apa yang hanya dipahami oleh orang-orang dekat?",
  "Kapan terakhir kali keluarga berkumpul dan merasa sangat lengkap?",
  "Pelajaran hidup apa yang paling sering ia bagikan?",
  "Apa hal kecil yang membuatnya tertawa?",
  "Siapa teman atau tetangga yang penting dalam kisah hidupnya?",
  "Perubahan zaman apa yang paling ia rasakan?",
  "Apa tantangan terbesar yang pernah dilewati keluarga bersama?",
  "Foto lama ini diambil di mana dan siapa saja yang ada di dalamnya?",
  "Apa yang belum banyak orang tahu tentang orang ini?",
  "Bagaimana keluarga merayakan hari besar ketika dulu?",
  "Apa lagu, film, atau buku yang selalu mengingatkan Anda padanya?",
  "Apa nasihat yang ingin Anda titipkan untuk cucu dan cicit?",
  "Tempat mana yang terasa seperti rumah bagi keluarga ini?",
  "Bagaimana kisah kehilangan yang mengubah cara keluarga saling menjaga?",
  "Apa keberanian kecil yang pernah ia tunjukkan?",
  "Kapan Anda pertama kali menyadari arti penting keluarga ini?",
  "Apa cerita lucu yang layak diceritakan ulang?",
  "Apa harapan Anda untuk arsip keluarga ini?",
  "Jika bisa mengucapkan satu kalimat kepadanya, apa yang ingin Anda katakan?",
] as const;
