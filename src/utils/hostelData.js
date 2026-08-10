/**
 * Canonical list of ABUAD Hostels mapped to their aliases and nicknames.
 */
export const HOSTEL_MAPPINGS = [
  {
    canonical: "Abuad Female Hostel 1",
    aliases: ["ABUAD Hostel", "Female Hall 1", "FH 1", "Female Hall 1", "Abuad Female Hostel 1"],
  },
  {
    canonical: "Abuad Female Hostel 2",
    aliases: ["Wema Hostel", "Wema", "Female Hall 2", "FH 2", "Abuad Female Hostel 2"],
  },
  {
    canonical: "Abuad Female Hostel 3",
    aliases: ["NFH1", "NFH 1", "New Female Hostel 1", "Female Hall 3", "FH 3", "Abuad Female Hostel 3"],
  },
  {
    canonical: "Abuad Female Hostel 4",
    aliases: ["NFH2", "NFH 2", "New Female Hostel 2", "Female Hall 4", "FH 4", "Abuad Female Hostel 4"],
  },
  {
    canonical: "Female Hall 5 (A)",
    aliases: ["Female Hall 5A", "FH 5A", "Female Hall 5 (A)"],
  },
  {
    canonical: "Female Hall 5 (B)",
    aliases: ["Female Hall 5B", "FH 5B", "Female Hall 5 (B)"],
  },
  {
    canonical: "Female Hall 5 (C)",
    aliases: ["Female Hall 5C", "FH 5C", "Female Hall 5 (C)"],
  },
  {
    canonical: "Female Hall 5 (D)",
    aliases: ["Female Hall 5D", "FH 5D", "FH5D", "Female Hall 5 (D)"],
  },
  {
    canonical: "Female Medical Hall 1",
    aliases: ["FMH 1", "FMH1", "Female Medical Hall 1"],
  },
  {
    canonical: "Female Medical Hall 2",
    aliases: ["FMH 2", "FMH2", "Female Medical Hall 2"],
  },
  {
    canonical: "Female Medical Hall 3",
    aliases: ["FMH 3", "FMH3", "Female Medical Hall 3"],
  },
  {
    canonical: "Female Medical Hall 4",
    aliases: ["FMH 4", "FMH4", "Female Medical Hall 4"],
  },
  {
    canonical: "Abuad Male Hostel 1",
    aliases: ["Jamaica", "Male Hall 1", "MH 1", "Abuad Male Hostel 1"],
  },
  {
    canonical: "Abuad Male Hostel 2",
    aliases: ["Kuvuki", "Male Hall 2", "MH 2", "Abuad Male Hostel 2"],
  },
  {
    canonical: "Abuad Male Hostel 3",
    aliases: ["Freshers Male Hostel", "Freshers Hostel", "Male Hall 3", "MH 3", "Abuad Male Hostel 3"],
  },
  {
    canonical: "Abuad Male Hostel 4",
    aliases: ["Male Hall 4", "MH 4", "Abuad Male Hostel 4"],
  },
  {
    canonical: "Abuad Male Hostel 5",
    aliases: ["Male Hall 5", "MH 5", "Abuad Male Hostel 5"],
  },
  {
    canonical: "Abuad Male Hostel 6",
    aliases: ["Male Hall 6", "MH 6", "Abuad Male Hostel 6"],
  },
  {
    canonical: "Male Medical Hall 1",
    aliases: ["MMH 1", "MMH1", "Male Medical Hall 1"],
  },
  {
    canonical: "Male Medical Hall 2",
    aliases: ["MMH 2", "MMH2", "Male Medical Hall 2"],
  },
];

/**
 * Array of all display options (canonical names + popular aliases) for form autocomplete.
 */
export const ABUAD_HOSTELS = HOSTEL_MAPPINGS.map((h) => h.canonical);

/**
 * Normalizes any user search or raw PDF string to its official canonical name.
 */
export function normalizeHostelName(rawInput) {
  if (!rawInput) return "";
  const cleaned = rawInput.trim().toLowerCase();

  for (const item of HOSTEL_MAPPINGS) {
    if (item.canonical.toLowerCase() === cleaned) return item.canonical;
    if (item.aliases.some((alias) => alias.toLowerCase() === cleaned)) {
      return item.canonical;
    }
  }

  return rawInput.trim();
}