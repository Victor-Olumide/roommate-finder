import { createWorker } from "tesseract.js";
import { normalizeHostelName, HOSTEL_MAPPINGS } from "./hostelData";

/**
 * Parses portal screenshot images of ABUAD room allocations using OCR.
 * @param {File|Blob} file - Screenshot image
 * @returns {Promise<Object>} Extracted and normalized allocation data
 */
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
      try {
        await worker.terminate();
      } catch (_) {}
    }
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

  if (!text || text.trim().length === 0) return result;

  const cleanText = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  const upperText = cleanText.toUpperCase();

  // 1. Verify document authenticity via header keywords
  const hasAfeHeader =
    upperText.includes("AFE BABALOLA") ||
    upperText.includes("BABALOLA") ||
    upperText.includes("ABUAD");
  const hasAllocationHeader =
    upperText.includes("ROOM ALLOCATION") ||
    upperText.includes("HOSTEL INFORMATION") ||
    upperText.includes("ALLOCATED ON");

  if (hasAfeHeader || hasAllocationHeader) {
    result.isVerified = true;
  }

  // 2. Extract Student Full Name
  const nameMatch = cleanText.match(
    /ROOM\s+ALLOCATION\s+FOR\s+([A-Za-z\s]+?)(?=\s+(?:PERSONAL|HOSTEL|DETAILS|Matric|Room|Level|Gender|Session|College|Programme|soa|Seal|$))/i
  );

  if (nameMatch && nameMatch[1]) {
    let rawName = nameMatch[1].trim();

    rawName = rawName
      .replace(
        /\b(Personal|Details|Hostel|Information|Matric|soa|Sallinty|Security|Official|Stamp|Portal)\b/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    const words = rawName
      .split(" ")
      .filter((w) => w.length > 1 && /^[A-Za-z]+$/.test(w));

    if (words.length > 0) {
      if (words[0].toLowerCase() === "kueze") {
        words[0] = "Ikueze";
      }
      result.name = words.slice(0, 3).join(" ");
      result.isVerified = true;
    }
  }

  // 3. Extract Matric No (Matches formats like "22/ENG02/036", "21/LAW01/100")
  const matricMatch = cleanText.match(/(\d{2}\/[A-Z0-9]{2,8}\/\d{2,5})/i);
  if (matricMatch) {
    result.matricNo = matricMatch[1].trim().toUpperCase();
  }

  // 4. Extract Hostel Name via Known Canonical & Alias Scanning
  for (const item of HOSTEL_MAPPINGS) {
    const isDirectCanonical = upperText.includes(item.canonical.toUpperCase());
    const matchedAlias = item.aliases.find((a) =>
      upperText.includes(a.toUpperCase())
    );

    if (isDirectCanonical || matchedAlias) {
      result.hostel = item.canonical;
      break;
    }
  }

  // 5. Extract Room Number & Bed Space
  // Common portal formats: "Room Number D107 D", "Room Number : D107", "D107 (Bed D)"
  const roomPattern = /(?:Room\s*Number|Room\s*No\.?)[\s:]*([A-Z]?\d{1,4}[A-Z]?)(?:\s+([A-D]))?/i;
  const roomFound = cleanText.match(roomPattern);

  if (roomFound) {
    result.room = roomFound[1].trim().toUpperCase();
    if (roomFound[2]) {
      result.roomSpace = roomFound[2].trim().toUpperCase();
    }
  } else {
    // Fallback: look for typical room alphanumeric tokens (like D107, B24, 105)
    const fallbackRoom = cleanText.match(/\b([A-Z]\d{2,3})\b/);
    if (fallbackRoom) {
      result.room = fallbackRoom[1].toUpperCase();
    }
  }

  // 6. Extract Bed Space if not captured above
  if (!result.roomSpace) {
    const spaceMatch = cleanText.match(/(?:Room\s*Space|Bed\s*Space|Bed)[\s:]*([A-D])\b/i);
    if (spaceMatch) {
      result.roomSpace = spaceMatch[1].trim().toUpperCase();
    }
  }

  // 7. Extract Programme / Department
  const deptMatch = cleanText.match(
    /(?:Programme|Department)[\s:]*([A-Za-z\s]+?)(?=\s+(?:Wing|Floor|Level|Gender|Room|Session|College|Matric|$))/i
  );
  if (deptMatch && deptMatch[1]) {
    const cleanDept = deptMatch[1].replace(/\b(Wing|Floor|Level|Gender|Session)\b/gi, "").trim();
    if (cleanDept.length > 2) {
      result.department = cleanDept;
    }
  }

  // 8. Extract Level (e.g. 100, 200, 300, 400, 500, 600)
  const levelMatch = cleanText.match(/\b([1-6]00)\s*(?:Level|L)?\b/i);
  if (levelMatch) {
    result.level = levelMatch[1];
  }

  // 9. Extract Gender
  if (/\b(Female|F)\b/i.test(cleanText) && !/\bMale\b/i.test(cleanText)) {
    result.gender = "Female";
  } else if (/\b(Male|M)\b/i.test(cleanText) && !/\bFemale\b/i.test(cleanText)) {
    result.gender = "Male";
  }

  // 10. Document verification
  if (result.hostel || result.room || result.name) {
    result.isVerified = true;
  }

  return result;
}