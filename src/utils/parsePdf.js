import * as pdfjsLib from "pdfjs-dist";
import { normalizeHostelName, HOSTEL_MAPPINGS } from "./hostelData";
import { parseAllocationImage } from "./parseImage";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Renders the first page of an image-based PDF to a high-res image Blob.
 */
async function renderPageToBlob(page) {
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.height = Math.floor(viewport.height);
  canvas.width = Math.floor(viewport.width);

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Parses uploaded PDF allocation slips.
 */
export async function parseAllocationPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let rawText = "";
    const firstPage = await pdf.getPage(1);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      rawText += pageText + " ";
    }

    let cleanText = rawText.replace(/\s+/g, " ").trim();

    // Helper for OCR fallback
    const runOcrFallback = async () => {
      console.log("Routing PDF to Canvas OCR renderer...");
      const pageImageBlob = await renderPageToBlob(firstPage);
      return await parseAllocationImage(pageImageBlob);
    };

    // If PDF has no digital text layer, route directly to OCR
    if (cleanText.length < 35) {
      return await runOcrFallback();
    }

    // ── STRICT VALIDATION GATE ────────────────────────────────────────────
    // An official ABUAD allocation slip MUST contain a valid Matric Number pattern 
    // AND reference room/hostel/allocation context. If not, reject it immediately!
    const hasValidMatric = /(\d{2}\/[A-Z0-9]{2,8}\/\d{2,5})/i.test(cleanText);
    const hasSlipKeywords = 
      /allocation/i.test(cleanText) || 
      (/hostel/i.test(cleanText) && /room/i.test(cleanText));

    if (!hasValidMatric && !hasSlipKeywords) {
      console.warn("Uploaded document failed ABUAD slip validation check.");
      return { isVerified: false, name: "" };
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── DIGITAL TEXT EXTRACTION ───────────────────────────────────────────
    let extractedName = "";
    const nameMatch = cleanText.match(
      /(?:ROOM\s+)?ALLOCATION\s+FOR\s+([A-Za-z\s]+?)(?=\s+(?:PERSONAL|HOSTEL|DETAILS|Matric|Sex|Gender|Level|Session|Programme|Floor|Wing|Room|$))/i
    );
    if (nameMatch && nameMatch[1]) {
      extractedName = nameMatch[1]
        .replace(/\b(AFE|BABALOLA|UNIVERSITY|OFFICIAL|COPY|WATERMARK|PORTAL|STUDENT|SLIP)\b/gi, "")
        .trim();
    }

    // If digital text extraction failed to locate the name, cascade to OCR
    if (!extractedName) {
      return await runOcrFallback();
    }

    // Matric Number
    let extractedMatric = "";
    const matricMatch = cleanText.match(/(\d{2}\/[A-Z0-9]{2,8}\/\d{2,5})/i);
    if (matricMatch) {
      extractedMatric = matricMatch[1].trim().toUpperCase();
    }

    // Gender
    let extractedGender = "";
    const isFemaleDoc =
      /\b(Female|F)\b/i.test(cleanText) &&
      !/\bMale\b/i.test(cleanText.replace(/\bFemale\b/gi, ""));
    if (isFemaleDoc) {
      extractedGender = "Female";
    } else if (/\bMale\b/i.test(cleanText)) {
      extractedGender = "Male";
    }

    // Hostel Name
    let extractedHostel = "";
    const hostelFieldMatch = cleanText.match(
      /Hostel\s*Name\s*[:.\s]?\s*([A-Za-z0-9\s()]+?)(?=\s+(?:Wing|Programme|Floor|Level|Gender|Sex|Room|Session|College|$))/i
    );

    if (hostelFieldMatch && hostelFieldMatch[1]) {
      extractedHostel = normalizeHostelName(hostelFieldMatch[1].trim());
    }

    if (!extractedHostel) {
      const candidates = [];
      HOSTEL_MAPPINGS.forEach((item) => {
        if (extractedGender === "Female" && !item.canonical.toLowerCase().includes("female")) return;
        if (extractedGender === "Male" && item.canonical.toLowerCase().includes("female")) return;

        candidates.push({ name: item.canonical, pattern: item.canonical });
        (item.aliases || []).forEach((alias) => {
          candidates.push({ name: item.canonical, pattern: alias });
        });
      });

      candidates.sort((a, b) => b.pattern.length - a.pattern.length);

      for (const candidate of candidates) {
        const regex = new RegExp(`\\b${candidate.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (regex.test(cleanText)) {
          extractedHostel = candidate.name;
          break;
        }
      }
    }

    // Room Number & Space
    let extractedRoom = "";
    let extractedSpace = "";
    const roomMatch = cleanText.match(/Room\s*Number\s*[:.\s]?\s*([A-Z0-9]+)(?:\s+([A-D]))?/i);
    if (roomMatch) {
      extractedRoom = roomMatch[1].trim().toUpperCase();
      if (roomMatch[2]) extractedSpace = roomMatch[2].trim().toUpperCase();
    }

    if (!extractedSpace) {
      const spaceMatch = cleanText.match(/Room\s*Space\s*[:.\s]?\s*([A-D0-9])/i);
      if (spaceMatch) extractedSpace = spaceMatch[1].trim().toUpperCase();
    }

    // Department / Programme
    let extractedDept = "";
    const deptMatch = cleanText.match(
      /Programme\s*[:.\s]?\s*([A-Za-z\s]+?)(?=\s+(?:Wing|Floor|Level|Gender|Sex|Room|Session|College|Matric|$))/i
    );
    if (deptMatch && deptMatch[1]) {
      extractedDept = deptMatch[1]
        .replace(/\b(AFE|BABALOLA|UNIVERSITY|OFFICIAL|COPY)\b/gi, "")
        .trim();
    }

    // Level
    let extractedLevel = "";
    const levelMatch = cleanText.match(/Level\s*[:.\s]?\s*(\d{3}L?)/i) || cleanText.match(/\b([1-6]00)\s*(?:Level|L)?\b/i);
    if (levelMatch) {
      extractedLevel = levelMatch[1].replace(/L/i, "").trim();
    }

    return {
      isVerified: true,
      name: extractedName,
      matricNo: extractedMatric,
      hostel: extractedHostel,
      room: extractedRoom,
      roomSpace: extractedSpace,
      department: extractedDept,
      level: extractedLevel,
      gender: extractedGender,
      roomCapacity: 4,
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return { isVerified: false, name: "" };
  }
}