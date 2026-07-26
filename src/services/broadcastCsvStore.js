import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, "../../data/broadcasts.csv");

const HEADERS = [
  "id",
  "broadcastId",
  "senderOrganization",
  "recipientOrganization",
  "title",
  "category",
  "urgency",
  "location",
  "startDate",
  "endDate",
  "message",
  "contactName",
  "contactEmail",
  "responseStatus",
  "responseNote",
  "respondedAt",
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
      broadcastId: row.broadcastId,
      senderOrganization: row.senderOrganization,
      recipientOrganization: row.recipientOrganization,
      title: row.title,
      category: row.category,
      urgency: row.urgency,
      location: row.location,
      startDate: row.startDate,
      endDate: row.endDate,
      message: row.message,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      responseStatus: row.responseStatus || "pending",
      responseNote: row.responseNote || "",
      respondedAt: row.respondedAt || "",
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

const normalizeName = (value) => String(value ?? "").trim().toLowerCase();

const createBroadcast = (payload) => {
  const rows = readAll();
  const now = new Date().toISOString();
  const broadcastId = `broadcast-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const recipients = Array.from(new Set((payload.recipients || []).map((name) => String(name || "").trim()).filter(Boolean)));

  const createdRows = recipients.map((recipient) => ({
    id: `broadcast-entry-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    broadcastId,
    senderOrganization: String(payload.senderOrganization || "").trim(),
    recipientOrganization: recipient,
    title: String(payload.title || "").trim(),
    category: String(payload.category || "General").trim(),
    urgency: String(payload.urgency || "Normal").trim(),
    location: String(payload.location || "").trim(),
    startDate: String(payload.startDate || "").trim(),
    endDate: String(payload.endDate || "").trim(),
    message: String(payload.message || "").trim(),
    contactName: String(payload.contactName || "").trim(),
    contactEmail: String(payload.contactEmail || "").trim(),
    responseStatus: "pending",
    responseNote: "",
    respondedAt: "",
    createdAt: now,
    updatedAt: now
  }));

  rows.push(...createdRows);
  writeAll(rows);

  return {
    broadcastId,
    createdCount: createdRows.length,
    rows: createdRows
  };
};

const listInbox = (organizationName) => {
  const target = normalizeName(organizationName);
  return readAll()
    .filter((row) => normalizeName(row.recipientOrganization) === target)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
};

const summarizeSent = (organizationName) => {
  const target = normalizeName(organizationName);
  const rows = readAll().filter((row) => normalizeName(row.senderOrganization) === target);

  const grouped = new Map();
  rows.forEach((row) => {
    const key = String(row.broadcastId || row.id);
    if (!grouped.has(key)) {
      grouped.set(key, {
        broadcastId: key,
        senderOrganization: row.senderOrganization,
        title: row.title,
        category: row.category,
        urgency: row.urgency,
        location: row.location,
        startDate: row.startDate,
        endDate: row.endDate,
        message: row.message,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        recipients: []
      });
    }

    const item = grouped.get(key);
    item.recipients.push({
      id: row.id,
      recipientOrganization: row.recipientOrganization,
      responseStatus: row.responseStatus || "pending",
      responseNote: row.responseNote || "",
      respondedAt: row.respondedAt || ""
    });
    if (String(row.updatedAt || "") > String(item.updatedAt || "")) {
      item.updatedAt = row.updatedAt;
    }
  });

  const broadcasts = Array.from(grouped.values()).map((item) => {
    const counts = {
      total: item.recipients.length,
      pending: item.recipients.filter((r) => r.responseStatus === "pending").length,
      canHelp: item.recipients.filter((r) => r.responseStatus === "can-help").length,
      cannotHelp: item.recipients.filter((r) => r.responseStatus === "cannot-help").length,
      needDetails: item.recipients.filter((r) => r.responseStatus === "need-details").length
    };

    return {
      ...item,
      counts
    };
  });

  broadcasts.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return broadcasts;
};

const updateResponse = (entryId, organizationName, responseStatus, responseNote = "") => {
  const rows = readAll();
  const index = rows.findIndex((row) => String(row.id) === String(entryId));
  if (index < 0) {
    return null;
  }

  const existing = rows[index];
  const targetOrg = normalizeName(organizationName);
  if (targetOrg && normalizeName(existing.recipientOrganization) !== targetOrg) {
    return null;
  }

  const now = new Date().toISOString();
  rows[index] = {
    ...existing,
    responseStatus,
    responseNote: String(responseNote || "").trim(),
    respondedAt: now,
    updatedAt: now
  };

  writeAll(rows);
  return rows[index];
};

export const broadcastCsvStore = {
  readAll,
  createBroadcast,
  listInbox,
  summarizeSent,
  updateResponse,
  csvPath
};
