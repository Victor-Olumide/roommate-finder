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

    const cleanText = rawText.replace(/\s+/g, " ").trim();

    // 1. Full Name (e.g. "Ikueze Chidimma Marycindy")
    const nameMatch = cleanText.match(
      /ROOM ALLOCATION FOR\s+(.*?)\s+(?:PERSONAL|HOSTEL|DETAILS|Matric)/i
    );

    // 2. Matric No (e.g. "22/ENG02/036")
    const matricMatch = cleanText.match(
      /Matric\s*(?:No|Number)?\s*[:.\s]?\s*([0-9]{2}\/[A-Z0-9\/]+)/i
    );

    // 3. Hostel Name (e.g. "Female Hall 1 (ABUAD Female Hostel)")
    const hostelMatch = cleanText.match(
      /Hostel Name\s+(.*?)(?=\s+(?:Wing|Programme|Floor|Level|Gender|Room|Session|College|$))/i
    );

    // 4. Room Number (extracts clean room ID like "D107")
    const roomMatch = cleanText.match(/Room Number\s*[:.\s]?\s*([A-Z0-9]+)/i);

    // 5. Room / Bed Space (e.g. "D")
    const spaceMatch = cleanText.match(/Room Space\s*[:.\s]?\s*([A-Z0-9]+)/i);

    // 6. Programme / Department (e.g. "Computer Engineering")
    const deptMatch = cleanText.match(
      /Programme\s*[:.\s]?\s*(.*?)(?=\s+(?:Wing|Floor|Level|Gender|Room|Session|College|$))/i
    );

    // 7. Level (e.g. "500")
    const levelMatch = cleanText.match(/Level\s*[:.\s]?\s*(\d{3}L?)/i);

    // 8. Floor (e.g. "Ground Floor")
    const floorMatch = cleanText.match(
      /Floor\s+(.*?)(?=\s+(?:Wing|Room|Hostel|Level|Gender|Session|$))/i
    );

    // 9. Wing (e.g. "Wing D" or "D")
    const wingMatch = cleanText.match(/Wing\s+(?:Wing\s+)?([A-Z0-9]+)/i);

    // 10. Gender (e.g. "Female" or "Male")
    const genderMatch = cleanText.match(/Gender\s*[:.\s]?\s*(Male|Female)/i);

    // 11. Room Capacity (e.g. "4-Person Room" -> 4)
    const capacityMatch = cleanText.match(
      /(?:Hostel Type\s+(\d+)|No\.\s*of\s*Occupa\s*(\d+))/i
    );

    const rawHostel = hostelMatch ? hostelMatch[1].trim() : "";

    return {
      name: nameMatch ? nameMatch[1].trim() : "",
      matricNo: matricMatch ? matricMatch[1].trim() : "",
      hostel: normalizeHostelName(rawHostel),
      room: roomMatch ? roomMatch[1].trim() : "",
      roomSpace: spaceMatch ? spaceMatch[1].trim() : "",
      department: deptMatch ? deptMatch[1].trim() : "",
      level: levelMatch ? levelMatch[1].trim() : "",
      gender: genderMatch ? genderMatch[1].trim() : "",
      floor: floorMatch ? floorMatch[1].trim() : "",
      wing: wingMatch ? wingMatch[1].trim() : "",
      roomCapacity: capacityMatch
        ? Number(capacityMatch[1] || capacityMatch[2])
        : 4,
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw error;
  }
}