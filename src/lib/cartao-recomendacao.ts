import QRCode from "qrcode";

// Cartão A6 (105 × 148 mm) para o consultório: QR, nome do médico, código e o aviso de transparência.
// Gerado no browser; não contém dados de saúde.
export async function descarregarCartao(opts: {
  codigo: string;
  ligacao: string;
  convite: string;
  chamada: string;
  transparencia: string;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a6", orientation: "portrait" });
  const largura = 105;
  const qr = await QRCode.toDataURL(opts.ligacao, {
    margin: 1,
    width: 600,
    errorCorrectionLevel: "M",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Vivara", largura / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(opts.convite, 85), largura / 2, 26, { align: "center" });

  doc.addImage(qr, "PNG", (largura - 60) / 2, 34, 60, 60);

  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.text(opts.codigo, largura / 2, 102, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(doc.splitTextToSize(opts.chamada, 85), largura / 2, 111, { align: "center" });

  doc.setDrawColor(200);
  doc.line(12, 121, largura - 12, 121);
  doc.setFontSize(8.5);
  doc.setTextColor(60);
  doc.text(doc.splitTextToSize(opts.transparencia, 85), largura / 2, 128, { align: "center" });

  doc.save(`vivara-convite-${opts.codigo}.pdf`);
}

export function qrDataUrl(texto: string) {
  return QRCode.toDataURL(texto, { margin: 1, width: 480, errorCorrectionLevel: "M" });
}
