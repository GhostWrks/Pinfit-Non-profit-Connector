import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, "../../data/organization_registrations.csv");

const HEADERS = [
  "id",
  "organizationName",
  "address",
  "city",
  "stateAbbreviation",
  "zip",
  "industryDescription",
  "employeeCount",
  "esriCategoryDescription",
  "missionArea",
  "mainContact",
  "contactEmail",
  "websiteLink",
  "workingHours",
  "matchedAddress",
  "needVolunteers",
  "foodYN",
  "foodText",
  "clothesYN",
  "clothesText",
  "shelterYN",
  "shelterText",
  "beddingYN",
  "beddingText",
  "toiletriesYN",
  "toiletriesText",
  "furnitureYN",
  "furnitureText",
  "medicalSuppliesYN",
  "medicalSuppliesText",
  "electronicsYN",
  "electronicsText",
  "educationMaterialsYN",
  "educationMaterialsText",
  "babyItemsYN",
  "babyItemsText",
  "cleaningItemsYN",
  "cleaningItemsText",
  "latitude",
  "longitude",
  "description",
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

const toBoolean = (value) => {
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "yes" || text === "1" || text === "y";
};

const toYesNo = (value) => (toBoolean(value) ? "Yes" : "No");

const pick = (row, keys, fallback = "") => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return fallback;
};

const parseRowsFromCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    return { headers: HEADERS, rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const raw = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = String(raw[idx] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
};

const normalizeRow = (row) => {
  const id = pick(row, ["id"], `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  const createdAt = pick(row, ["createdAt"], new Date().toISOString());
  const updatedAt = pick(row, ["updatedAt"], createdAt);

  return {
    id,
    organizationName: pick(row, ["organizationName", "Company_Business_Name", "Organization_Name"]),
    address: pick(row, ["address", "Address__", "Address", "Matched_Address"]),
    city: pick(row, ["city", "City"]),
    stateAbbreviation: pick(row, ["stateAbbreviation", "State_Abbreviation"]),
    zip: pick(row, ["zip", "ZIP_Code", "Zip"]),
    industryDescription: pick(row, ["industryDescription", "Industry_Description"]),
    employeeCount: pick(row, ["employeeCount", "Employee_Count"]),
    esriCategoryDescription: pick(row, ["esriCategoryDescription", "Esri_Category_Description"]),
    missionArea: pick(row, ["missionArea", "Mission_Area"]),
    mainContact: pick(row, ["mainContact", "Main_Contact", "Contact_Name"]),
    contactEmail: pick(row, ["contactEmail", "Contact_Email"]),
    websiteLink: pick(row, ["websiteLink", "Website_Link"]),
    workingHours: pick(row, ["workingHours", "Working_Hours"]),
    matchedAddress: pick(row, ["matchedAddress", "Matched_Address"]),
    needVolunteers: toBoolean(pick(row, ["needVolunteers", "Need_Volunteers"])),
    foodYN: toYesNo(pick(row, ["foodYN", "Food_Y_N"])),
    foodText: pick(row, ["foodText", "Food_Text"]),
    clothesYN: toYesNo(pick(row, ["clothesYN", "Clothes_Y_N"])),
    clothesText: pick(row, ["clothesText", "Clothes_Text"]),
    shelterYN: toYesNo(pick(row, ["shelterYN", "Shelter_Y_N"])),
    shelterText: pick(row, ["shelterText", "Shelter_Text"]),
    beddingYN: toYesNo(pick(row, ["beddingYN", "Bedding_Y_N"])),
    beddingText: pick(row, ["beddingText", "Bedding_Text"]),
    toiletriesYN: toYesNo(pick(row, ["toiletriesYN", "Toiletries_Y_N"])),
    toiletriesText: pick(row, ["toiletriesText", "Toiletries_Text"]),
    furnitureYN: toYesNo(pick(row, ["furnitureYN", "Furniture_Y_N"])),
    furnitureText: pick(row, ["furnitureText", "Furniture_Text"]),
    medicalSuppliesYN: toYesNo(pick(row, ["medicalSuppliesYN", "Medical_Supplies_Y_N"])),
    medicalSuppliesText: pick(row, ["medicalSuppliesText", "Medical_Supplies_Text"]),
    electronicsYN: toYesNo(pick(row, ["electronicsYN", "Electronics_Y_N"])),
    electronicsText: pick(row, ["electronicsText", "Electronics_Text"]),
    educationMaterialsYN: toYesNo(pick(row, ["educationMaterialsYN", "Education_Materials_Y_N"])),
    educationMaterialsText: pick(row, ["educationMaterialsText", "Education_Materials_Text"]),
    babyItemsYN: toYesNo(pick(row, ["babyItemsYN", "Baby_Items_Y_N"])),
    babyItemsText: pick(row, ["babyItemsText", "Baby_Items_Text"]),
    cleaningItemsYN: toYesNo(pick(row, ["cleaningItemsYN", "Cleaning_Items_Y_N"])),
    cleaningItemsText: pick(row, ["cleaningItemsText", "Cleaning_Items_Text"]),
    latitude: Number(pick(row, ["latitude", "Latitude"])),
    longitude: Number(pick(row, ["longitude", "Longitude"])),
    description: pick(row, ["description", "Organization_Description"]),
    createdAt,
    updatedAt
  };
};

const writeRows = (rows) => {
  const lines = rows.map((row) => HEADERS.map((key) => escapeCsv(row[key] ?? "")).join(","));
  const content = `${HEADERS.join(",")}\n${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`;
  fs.writeFileSync(csvPath, content, "utf8");
};

const ensureCsvFile = () => {
  const dir = path.dirname(csvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, `${HEADERS.join(",")}\n`, "utf8");
    return;
  }

  const text = fs.readFileSync(csvPath, "utf8");
  const { headers, rows } = parseRowsFromCsv(text);
  if (headers.join(",") === HEADERS.join(",")) {
    return;
  }

  const migrated = rows.map(normalizeRow);
  writeRows(migrated);
};

const readAll = () => {
  ensureCsvFile();
  const text = fs.readFileSync(csvPath, "utf8");
  const { rows } = parseRowsFromCsv(text);
  return rows
    .map(normalizeRow)
    .filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
};

const serializePayload = (payload, existing = null) => {
  const base = existing || {};
  const now = new Date().toISOString();

  return {
    id: String(base.id || payload.id || `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`),
    organizationName: String(payload.organizationName ?? base.organizationName ?? "").trim(),
    address: String(payload.address ?? base.address ?? "").trim(),
    city: String(payload.city ?? base.city ?? "").trim(),
    stateAbbreviation: String(payload.stateAbbreviation ?? base.stateAbbreviation ?? "").trim(),
    zip: String(payload.zip ?? base.zip ?? "").trim(),
    industryDescription: String(payload.industryDescription ?? base.industryDescription ?? "").trim(),
    employeeCount: String(payload.employeeCount ?? base.employeeCount ?? "").trim(),
    esriCategoryDescription: String(payload.esriCategoryDescription ?? base.esriCategoryDescription ?? "").trim(),
    missionArea: String(payload.missionArea ?? base.missionArea ?? "").trim(),
    mainContact: String(payload.mainContact ?? base.mainContact ?? "").trim(),
    contactEmail: String(payload.contactEmail ?? base.contactEmail ?? "").trim(),
    websiteLink: String(payload.websiteLink ?? base.websiteLink ?? "").trim(),
    workingHours: String(payload.workingHours ?? base.workingHours ?? "").trim(),
    matchedAddress: String(payload.matchedAddress ?? base.matchedAddress ?? "").trim(),
    needVolunteers: toBoolean(payload.needVolunteers ?? base.needVolunteers) ? "Yes" : "No",
    foodYN: toYesNo(payload.foodYN ?? base.foodYN),
    foodText: String(payload.foodText ?? base.foodText ?? "").trim(),
    clothesYN: toYesNo(payload.clothesYN ?? base.clothesYN),
    clothesText: String(payload.clothesText ?? base.clothesText ?? "").trim(),
    shelterYN: toYesNo(payload.shelterYN ?? base.shelterYN),
    shelterText: String(payload.shelterText ?? base.shelterText ?? "").trim(),
    beddingYN: toYesNo(payload.beddingYN ?? base.beddingYN),
    beddingText: String(payload.beddingText ?? base.beddingText ?? "").trim(),
    toiletriesYN: toYesNo(payload.toiletriesYN ?? base.toiletriesYN),
    toiletriesText: String(payload.toiletriesText ?? base.toiletriesText ?? "").trim(),
    furnitureYN: toYesNo(payload.furnitureYN ?? base.furnitureYN),
    furnitureText: String(payload.furnitureText ?? base.furnitureText ?? "").trim(),
    medicalSuppliesYN: toYesNo(payload.medicalSuppliesYN ?? base.medicalSuppliesYN),
    medicalSuppliesText: String(payload.medicalSuppliesText ?? base.medicalSuppliesText ?? "").trim(),
    electronicsYN: toYesNo(payload.electronicsYN ?? base.electronicsYN),
    electronicsText: String(payload.electronicsText ?? base.electronicsText ?? "").trim(),
    educationMaterialsYN: toYesNo(payload.educationMaterialsYN ?? base.educationMaterialsYN),
    educationMaterialsText: String(payload.educationMaterialsText ?? base.educationMaterialsText ?? "").trim(),
    babyItemsYN: toYesNo(payload.babyItemsYN ?? base.babyItemsYN),
    babyItemsText: String(payload.babyItemsText ?? base.babyItemsText ?? "").trim(),
    cleaningItemsYN: toYesNo(payload.cleaningItemsYN ?? base.cleaningItemsYN),
    cleaningItemsText: String(payload.cleaningItemsText ?? base.cleaningItemsText ?? "").trim(),
    latitude: String(payload.latitude ?? base.latitude ?? ""),
    longitude: String(payload.longitude ?? base.longitude ?? ""),
    description: String(payload.description ?? base.description ?? "").trim(),
    createdAt: String(base.createdAt || payload.createdAt || now),
    updatedAt: now
  };
};

const append = (payload) => {
  const rows = readAll();
  const serialized = serializePayload(payload);
  rows.push(normalizeRow(serialized));
  writeRows(rows);
  return normalizeRow(serialized);
};

const update = (id, payload) => {
  const rows = readAll();
  const targetIndex = rows.findIndex((row) => String(row.id) === String(id));
  if (targetIndex < 0) {
    return null;
  }

  const serialized = serializePayload(payload, rows[targetIndex]);
  rows[targetIndex] = normalizeRow(serialized);
  writeRows(rows);
  return rows[targetIndex];
};

export const registrationCsvStore = {
  readAll,
  append,
  update,
  csvPath
};
