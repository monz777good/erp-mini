export function normalizePhone(input: string) {
  return (input || "").replace(/\D/g, ""); // 숫자만
}

export function isAdminPhone(phoneDigits: string) {
  const raw = process.env.ADMIN_PHONES || "";
  const admins = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/\D/g, ""));
  return admins.includes(phoneDigits);
}
