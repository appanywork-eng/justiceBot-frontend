import { createPDF } from "../utils/pdfGen";

export default function PDFButton({ petition }) {
  const handlePDF = () => {
    createPDF(petition);
  };

  return (
    <button
      onClick={handlePDF}
      className="border border-black px-4 py-2 rounded mt-2"
    >
      Download PDF
    </button>
  );
}
