function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseDelimitedRows(rawValue, delimiter) {
  const lines = rawValue
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV imports need a header row and at least one lead row.");
  }

  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.trim());
  if (!headers.length || headers.some((header) => !header)) {
    throw new Error("CSV header row has an empty column name.");
  }

  return lines.slice(1).map((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

export function parseLeadImportRows(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed?.rows)) {
      return parsed.rows;
    }

    if (Array.isArray(parsed?.leads)) {
      return parsed.leads;
    }

    throw new Error("JSON imports must be an array, or an object with rows/leads.");
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";
  return parseDelimitedRows(trimmed, delimiter);
}
