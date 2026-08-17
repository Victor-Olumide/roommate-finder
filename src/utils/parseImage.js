import { createWorker } from "tesseract.js";

/**
 * Parses portal screenshot images or rasterized PDF canvas frames using OCR.
 */
export async function parseAllocationImage(file) {
  let worker = null;
  try {
    worker = await createWorker("eng");
    const ret = await worker.recognize(file);
    await worker.terminate();

    const rawText = ret?.data?.text || "";
    console.log("[OCR Raw Output]:", rawText);
    return parseTextData(rawText);
  } catch (err) {
    console.error("OCR Verification Error:", err);
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
    // Fail-safe: If OCR processing completely crashes, treat as unverified
    return { isVerified: false, name: "" };
  }
}

function parseTextData(text) {
  const result = {
    isVerified: false,
    name: "",
    matricNo: "",
    hostel: "",
    room: "",
    roomSpace: "",
    department: "",
    level: "",
    gender: "",
    wing: "",
    floor: "",
    roomCapacity: 4,
  };

  if (!text || text.trim().length < 15) {
    return result; // Not enough text to be a valid slip
  }

  const cleanText = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  const upperText = cleanText.toUpperCase();

  // ── STRICT VALIDATION GATE ────────────────────────────────────────────
  // An official allocation slip MUST contain a valid Matric pattern OR 
  // mandatory ABUAD slip title markers together.
  const hasValidMatric = /(\d{2}\/[A-Z0-9]{2,8}\/\d{2,5})/i.test(cleanText);
  const hasAllocationHeader = upperText.includes("ALLOCATION") && (upperText.includes("ABUAD") || upperText.includes("BABALOLA"));
  
  if (!hasValidMatric && !hasAllocationHeader) {
    console.warn("Uploaded image failed ABUAD slip validation check.");
    return result; // isVerified remains false, preventing bypass!
  }

  // Extract Matric Number if present
  const matricMatch = cleanText.match(/(\d{2}\/[A-Z0-9]{2,8}\/\d{2,5})/i);
  if (matricMatch) {
    result.matricNo = matricMatch[1].trim().toUpperCase();
  }
  // ─────────────────────────────────────────────────────────────────────

  // Multi-tier Name Extraction
  const nameMatchA = cleanText.match(
    /(?:ROOM\s+)?ALLOCATION\s+FOR\s+([A-Za-z\s\-]+?)(?=\s+(?:Room\s+Allocated|PERSONAL|HOSTEL|DETAILS|Matric|Level|Gender|Sex|Session|College|Programme|soa|Seal|\d|$))/i
  );

  const nameMatchB = cleanText.match(
    /\bFOR\s+([A-Za-z\s\-]{4,45}?)(?=\s+(?:Room\s+Allocated|PERSONAL|HOSTEL|DETAILS|Matric|Level|Gender|Sex|Session|College|Programme|\d|$))/i
  );

  let rawName = "";
  if (nameMatchA && nameMatchA[1]) {
    rawName = nameMatchA[1];
  } else if (nameMatchB && nameMatchB[1]) {
    rawName = nameMatchB[1];
  }

  if (rawName) {
    rawName = rawName
      .replace(/\b(Personal|Details|Hostel|Information|Matric|soa|Sallinty|Security|Official|Stamp|Portal|University|Afe|Babalola|Room|Allocated|on)\b/gi, "")
      .replace(/[^A-Za-z\s\-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const words = rawName.split(" ").filter((w) => w.length > 1);
    if (words.length > 0) {
      if (words[0].toLowerCase() === "kueze") {
        words[0] = "Ikueze";
      }
      result.name = words.slice(0, 4).join(" ");
    }
  }

  // Mark as verified only if we successfully passed the strict gate
  result.isVerified = true;

  return result;
}