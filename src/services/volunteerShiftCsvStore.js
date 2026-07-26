import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, "../../data/volunteer_shifts.csv");

const HEADERS = [
  "id",
  "organizationName",
  "roleTitle",
  "shiftDate",
  "startTime",
  "endTime",
  "volunteersNeeded",
  "location",
  "notes",
  "contactName",
  "contactEmail",
  "createdAt",
  "updatedAt"
];

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(current);
  return values;
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const ensureCsv = () => {
  const dir = path.dirname(csvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, `${HEADERS.join(",")}\n`, "utf8");
  }
};

const readAll = () => {
  ensureCsv();
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const raw = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = String(raw[idx] ?? "").trim();
    });

    return {
      id: row.id,
      organizationName: row.organizationName,
      roleTitle: row.roleTitle,
      shiftDate: row.shiftDate,
      startTime: row.startTime,
      endTime: row.endTime,
      volunteersNeeded: Number(row.volunteersNeeded) || 0,
      location: row.location,
      notes: row.notes,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  });
};

const writeAll = (rows) => {
  ensureCsv();
  const lines = rows.map((row) => HEADERS.map((header) => escapeCsv(row[header] ?? "")).join(","));
  const content = `${HEADERS.join(",")}\n${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`;
  fs.writeFileSync(csvPath, content, "utf8");
};

const create = (payload) => {
  const rows = readAll();
  const now = new Date().toISOString();
  const row = {
    id: `shift-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    organizationName: payload.organizationName,
    roleTitle: payload.roleTitle,
    shiftDate: payload.shiftDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    volunteersNeeded: String(payload.volunteersNeeded),
    location: payload.location,
    notes: payload.notes,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    createdAt: now,
    updatedAt: now
  };

  rows.push(row);
  writeAll(rows);
  return {
    ...row,
    volunteersNeeded: Number(row.volunteersNeeded) || 0
  };
};

export const volunteerShiftCsvStore = {
  readAll,
  create,
  csvPath
};
