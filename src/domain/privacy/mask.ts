export function maskNickname(nickname: string): string {
  const value = nickname.trim();
  if (value.length <= 1) return `${value || "익"}*`;
  const visibleLength = value.length <= 3 ? 1 : 2;
  const hiddenLength = value.length <= 3 ? value.length - visibleLength : Math.max(3, value.length - visibleLength);
  return `${value.slice(0, visibleLength)}${"*".repeat(hiddenLength)}`;
}

export function maskBirthDate(date: string): string {
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? `${year.slice(0, 3)}*.**.**` : "****.**.**";
}
