import { createWorker } from "tesseract.js";

export async function parseAllocationImage(file) {
  let worker = null;
  try {
    worker = await createWorker("eng");
    const ret = await worker.recognize(file);
    await worker.terminate();

    const rawText = ret?.data?.text || "";
    return parseTextData(rawText);
  } catch (err) {
    console.error("OCR Verification Error:", err);
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    return { isVerified: false, name: "" };
  }
}

function parseTextData(text) {
  const result = {
    isVerified: false,
    name: "",
  };

  if (!text || text.trim().length === 0) return result;

  const cleanText = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
  const upperText = cleanText.toUpperCase();

  // 1. Verify document genuineness via header text
  const hasAfeHeader = upperText.includes("AFE BABALOLA") || upperText.includes("BABALOLA UNIVERSITY");
  const hasAllocationHeader = upperText.includes("ROOM ALLOCATION");

  if (hasAfeHeader || hasAllocationHeader) {
    result.isVerified = true;
  }

  // 2. Extract student name (2-3 words directly after "ROOM ALLOCATION FOR")
  const nameMatch = cleanText.match(/ROOM\s+ALLOCATION\s+FOR\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,2})/i);
  if (nameMatch) {
    const cleanName = nameMatch[1].replace(/\b(Pere|yr|Room|Allocated|on|Personal|Details)\b/gi, "").trim();
    result.name = cleanName;
    result.isVerified = true;
  }

  return result;
}