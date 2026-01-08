export const warnings = new Map();
export const verifSettings = new Map();
export const verifCodes = new Map();
export const joinSettings = new Map();

export function generateCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
