// Dados do pedido HTTP lidos no servidor (nunca vêm do telemóvel).
import { getRequest } from "@tanstack/react-start/server";

/** IP do cliente, tal como chega ao servidor (a Vercel põe-no nestes cabeçalhos). */
export function clientIp(): string | null {
  const h = getRequest()?.headers;
  if (!h) return null;
  const raw = h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || h.get("x-forwarded-for") || "";
  const ip = raw.split(",")[0].trim();
  if (!ip || ip.length > 45) return null;
  const v4 = /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip);
  const v6 = /^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":");
  return v4 || v6 ? ip : null;
}

export function userAgent(): string | null {
  const ua = getRequest()?.headers.get("user-agent");
  return ua ? ua.slice(0, 500) : null;
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
