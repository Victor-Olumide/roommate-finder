import * as pdfjsLib from "pdfjs-dist";
import { normalizeHostelName } from "./hostelData";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Extracts and parses ABUAD Room Allocation PDF slips.
 */
export async function parseAllocationPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let rawText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      rawText += pageText + " ";
    }

    const cleanText = rawText.replace(/\s+/g, " ");

    // Regex extraction
    const nameMatch = cleanText.match(/ROOM ALLOCATION FOR\s+(.*?)\s+(?:PERSONAL|HOSTEL|DETAILS)/i);
    const hostelMatch = cleanText.match(/Hostel Name\s+(.*?)(?=\s+(?:Floor|Wing|Programme|College|Level|Gender|Room|Session|No\.|\d{3}L|$))/i);
    const roomMatch = cleanText.match(/Room Number\s+([A-Z0-9]+)/i);
    const deptMatch = cleanText.match(/Programme:?\s+(.*?)(?=\s+(?:Floor|Wing|Level|Gender|Room|Session|No\.|\d{3}|$))/i);
    const levelMatch = cleanText.match(/Level:?\s*(\d{3}L?)/i);
    const floorMatch = cleanText.match(/Floor\s+(.*?)(?=\s+(?:Wing|Room|Hostel|Level|$))/i);
    const wingMatch = cleanText.match(/Wing\s+([A-Z0-9]+)/i);
    const capacityMatch = cleanText.match(/(?:Hostel Type\s+(\d+)|No\.\s*of\s*Occupa\s*(\d+))/i);

    const rawHostel = hostelMatch ? hostelMatch[1].trim() : "";

    return {
      name: nameMatch ? nameMatch[1].trim() : "",
      hostel: normalizeHostelName(rawHostel), // Standardizes PDF extraction
      room: roomMatch ? roomMatch[1].trim() : "",
      department: deptMatch ? deptMatch[1].trim() : "",
      level: levelMatch ? levelMatch[1].trim() : "",
      floor: floorMatch ? floorMatch[1].trim() : "",
      wing: wingMatch ? wingMatch[1].trim() : "",
      roomCapacity: capacityMatch ? Number(capacityMatch[1] || capacityMatch[2]) : 4,
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw error;
  }
}