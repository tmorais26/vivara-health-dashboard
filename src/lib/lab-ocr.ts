// OCR de imagens e de PDFs digitalizados, a correr no dispositivo.
//
// O tesseract.js, o núcleo WebAssembly e o modelo de língua são servidos pela
// própria app (public/tesseract, public/tessdata) em vez de virem de um CDN:
// assim não há pedidos a terceiros e a promessa de que o ficheiro não sai do
// telemóvel continua verificável olhando para o tráfego.
//
// O reconhecimento de imagem erra — sobretudo dígitos, que é precisamente o
// que interessa numa análise. Por isso tudo o que sai daqui passa
// obrigatoriamente pelo ecrã de revisão, onde os valores podem ser corrigidos
// à mão com a imagem à vista.

const LANG = "por";

export type OcrProgress = (pct: number) => void;

// Redimensiona e aumenta o contraste. O tesseract lê muito melhor texto grande
// e bem separado do fundo do que uma fotografia crua de telemóvel.
function preprocess(source: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const TARGET = 2200;
  const scale = Math.min(3, Math.max(1, TARGET / Math.max(w, h)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  // Cinzento + alongamento de contraste entre os percentis extremos, para que
  // papel amarelado ou sombra de fotografia não esbata as letras.
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
    hist[g]++;
  }
  const total = canvas.width * canvas.height;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > total * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > total * 0.02) { hi = v; break; } }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) / span) * 255));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function canvasFromImageFile(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = preprocess(bitmap, bitmap.width, bitmap.height);
  bitmap.close();
  return canvas;
}

// PDFs que são digitalizações não têm texto para extrair; desenha-se cada
// página num canvas e lê-se por OCR, como se fosse uma fotografia.
export async function canvasesFromPdf(file: File, maxPages = 4): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const out: HTMLCanvasElement[] = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    out.push(preprocess(canvas, canvas.width, canvas.height));
  }
  await doc.destroy();
  return out;
}

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker(onProgress?: OcrProgress) {
  if (!workerPromise) {
    const { createWorker } = await import("tesseract.js");
    workerPromise = createWorker(LANG, 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract",
      langPath: "/tessdata",
      gzip: false, // o modelo é servido já descomprimido
      logger: (m: { status: string; progress: number }) => {
        if (onProgress && m.status === "recognizing text") onProgress(Math.round(m.progress * 100));
      },
    });
  }
  return workerPromise;
}

export async function ocrCanvases(canvases: HTMLCanvasElement[], onProgress?: OcrProgress): Promise<string[]> {
  const worker = await getWorker(onProgress);
  const lines: string[] = [];
  for (let i = 0; i < canvases.length; i++) {
    const { data } = await worker.recognize(canvases[i]);
    lines.push(...data.text.split("\n").map((l) => l.trim()).filter(Boolean));
    onProgress?.(Math.round(((i + 1) / canvases.length) * 100));
  }
  return lines;
}

export async function ocrImageFile(file: File, onProgress?: OcrProgress): Promise<string[]> {
  return ocrCanvases([await canvasFromImageFile(file)], onProgress);
}

export async function ocrScannedPdf(file: File, onProgress?: OcrProgress): Promise<string[]> {
  return ocrCanvases(await canvasesFromPdf(file), onProgress);
}
