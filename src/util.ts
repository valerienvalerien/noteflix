/** Index déterministe stable à partir d'un id (uuid) — pour choisir un dégradé. */
export function hashIndex(id: string, n: number): number {
  if (n <= 0) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % n;
}
