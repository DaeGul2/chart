import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportCanvasToPdf({
  canvasContainerRef,
  rows,
  renderWithRowIndex,
  onProgress
}) {
  const el = canvasContainerRef;
  const { width, height } = el.getBoundingClientRect();

  const pdf = new jsPDF({
    unit: "px",
    format: [width, height],
    orientation: width > height ? "landscape" : "portrait"
  });

  for (let i = 0; i < rows.length; i++) {
    if (onProgress) onProgress(i + 1, rows.length);

    // --- 여기서 renderWithRowIndex()가 "paint 완료" 타이밍까지 기다리고 resolve 합니다.
    await renderWithRowIndex(i);

    // 캔버스 엘리먼트만 캡처
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      width,
      height
    });
    const imgData = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage([width, height]);
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
  }

  pdf.save("리포트.pdf");
}
