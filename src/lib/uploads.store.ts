// Armazenamento das análises carregadas — tudo no dispositivo.
//
// Os valores e o texto extraído ficam em localStorage (são poucos KB). O PDF
// original vai para IndexedDB, que aguenta blobs e tem quota muito maior; se
// não estiver disponível, grava-se na mesma o resto e perde-se só o botão de
// abrir o original. Nada disto toca na rede.

import type { ParsedValue } from "./lab-parse";

export interface StoredValue {
  marker: string | null;
  label: string;
  raw: string;
  value: string;
  unit: string;
  ref: string;
}

// Como o conteúdo foi lido. Muda o que o ecrã de documento mostra (texto do
// PDF ou a imagem) e o aviso de fiabilidade: o texto de um PDF digital é
// exacto, o que sai de OCR é uma leitura e pode ter erros.
export type UploadKind = "pdf-text" | "pdf-ocr" | "image";

export interface StoredUpload {
  id: string;
  kind: UploadKind;
  filename: string;
  mime: string;
  sizeKb: number;
  pages: number;
  uploadedISO: string;
  collectedISO: string;
  lab: string | null;
  lines: string[];
  values: StoredValue[];
  hasFile: boolean;
}

const KEY = "rv-uploads-v1";
const MAX_LINES = 400; // um relatório longo cabe bem; evita encher o localStorage

export function loadUploads(): StoredUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUpload[]) : [];
  } catch {
    return [];
  }
}

function persist(list: StoredUpload[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function saveUpload(u: StoredUpload): StoredUpload[] {
  const list = [u, ...loadUploads().filter((x) => x.id !== u.id)];
  persist(list);
  return list;
}

export function deleteUpload(id: string): StoredUpload[] {
  const list = loadUploads().filter((x) => x.id !== id);
  persist(list);
  void deleteFile(id);
  return list;
}

export function makeUpload(
  file: File,
  doc: { lines: string[]; pages: number; lab: string | null; collectedISO: string | null },
  values: ParsedValue[],
  kind: UploadKind,
): StoredUpload {
  const now = new Date();
  return {
    id: `u-${now.getTime()}`,
    kind,
    filename: file.name,
    mime: file.type || "application/octet-stream",
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    pages: doc.pages,
    uploadedISO: now.toISOString(),
    collectedISO: doc.collectedISO ?? now.toISOString().slice(0, 10),
    lab: doc.lab,
    lines: doc.lines.slice(0, MAX_LINES),
    values: values.map(({ marker, label, raw, value, unit, ref }) => ({ marker, label, raw, value, unit, ref })),
    hasFile: false,
  };
}

// ─── PDF original em IndexedDB ───────────────────────
const DB_NAME = "rv-vivara";
const STORE = "files";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function putFile(id: string, file: File): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(file, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getFile(id: string): Promise<File | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as File) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
  } catch {
    /* ignorado — o registo já foi removido do localStorage */
  }
}
