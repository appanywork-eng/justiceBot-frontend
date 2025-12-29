import { PDFDocument, StandardFonts } from "pdf-lib";

export async function createPDF(petitionText) {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage([600, 800]);
    const { height } = page.getSize();

    page.drawText("JusticeBot Petition", {
      x: 40,
      y: height - 40,
      font,
      size: 16
    });

    page.drawText(petitionText, {
      x: 40,
      y: height - 80,
      font,
      size: 11,
      maxWidth: 520,
      lineHeight: 14
    });

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "JusticeBot-Petition.pdf";
    link.click();
  } catch {
    console.error("PDF generation error");
  }
}
