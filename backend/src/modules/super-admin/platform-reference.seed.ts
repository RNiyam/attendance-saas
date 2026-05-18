import { asc, eq } from "drizzle-orm";
import { db } from "../../database";
import {
  platformEnumMasters,
  refCities,
  refSectors,
  refStates,
  refSubSectors,
} from "../../database/schema";
import { INDIAN_STATES, listCitiesForState } from "../reference/india-geo.data";
import { SECTORS } from "../reference/sectors.data";

const DEFAULT_ENUM_ROWS: { enumType: string; code: string; label: string; sortOrder: number }[] = [
  { enumType: "employee_count_band", code: "lt_20", label: "Less than 20", sortOrder: 10 },
  { enumType: "employee_count_band", code: "20_100", label: "20 – 100", sortOrder: 20 },
  { enumType: "employee_count_band", code: "100_500", label: "100 – 500", sortOrder: 30 },
  { enumType: "employee_count_band", code: "gt_500", label: "More than 500", sortOrder: 40 },
  { enumType: "payable_days_policy", code: "calendar_month", label: "Calendar month", sortOrder: 10 },
  { enumType: "payable_days_policy", code: "fixed_30", label: "Fixed 30 days", sortOrder: 20 },
  { enumType: "payable_days_policy", code: "fixed_28", label: "Fixed 28 days", sortOrder: 30 },
  { enumType: "payable_days_policy", code: "fixed_26", label: "Fixed 26 days", sortOrder: 40 },
  { enumType: "payable_days_policy", code: "exclude_weekly_offs", label: "Exclude weekly offs", sortOrder: 50 },
  { enumType: "organization_role", code: "owner", label: "Owner", sortOrder: 10 },
  { enumType: "organization_role", code: "admin", label: "Admin", sortOrder: 20 },
  { enumType: "organization_role", code: "hr", label: "HR", sortOrder: 30 },
  { enumType: "organization_role", code: "others", label: "Others", sortOrder: 40 },
  { enumType: "employment_type", code: "FULL_TIME", label: "Full time", sortOrder: 10 },
  { enumType: "employment_type", code: "PART_TIME", label: "Part time", sortOrder: 20 },
  { enumType: "employment_type", code: "CONTRACT", label: "Contract", sortOrder: 30 },
  { enumType: "employment_type", code: "INTERN", label: "Intern", sortOrder: 40 },
  { enumType: "gender", code: "male", label: "Male", sortOrder: 10 },
  { enumType: "gender", code: "female", label: "Female", sortOrder: 20 },
  { enumType: "gender", code: "other", label: "Other", sortOrder: 30 },
  { enumType: "gender", code: "prefer_not_to_say", label: "Prefer not to say", sortOrder: 40 },
];

let seedPromise: Promise<void> | null = null;

export function ensurePlatformReferenceSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedPlatformReference().catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

async function seedPlatformReference(): Promise<void> {
  const [stateCount] = await db.select({ id: refStates.id }).from(refStates).limit(1);
  if (!stateCount) {
    for (let i = 0; i < INDIAN_STATES.length; i++) {
      const s = INDIAN_STATES[i];
      await db.insert(refStates).values({
        code: s.code,
        name: s.name,
        sortOrder: i * 10,
        isActive: 1,
      });
    }
    const states = await db.select().from(refStates).orderBy(asc(refStates.sortOrder));
    const byCode = new Map(states.map((s) => [s.code, s]));
    for (const s of INDIAN_STATES) {
      const row = byCode.get(s.code);
      if (!row) continue;
      const cities = listCitiesForState(s.code);
      for (let j = 0; j < cities.length; j++) {
        await db.insert(refCities).values({
          stateId: row.id,
          name: cities[j],
          sortOrder: j,
          isActive: 1,
        });
      }
    }
  }

  const [sectorCount] = await db.select({ id: refSectors.id }).from(refSectors).limit(1);
  if (!sectorCount) {
    for (let i = 0; i < SECTORS.length; i++) {
      const sec = SECTORS[i];
      await db.insert(refSectors).values({
        code: sec.code,
        name: sec.name,
        sortOrder: i * 10,
        isActive: 1,
      });
    }
    const sectors = await db.select().from(refSectors).orderBy(asc(refSectors.sortOrder));
    const byCode = new Map(sectors.map((s) => [s.code, s]));
    for (const sec of SECTORS) {
      const row = byCode.get(sec.code);
      if (!row) continue;
      for (let j = 0; j < sec.subSectors.length; j++) {
        const sub = sec.subSectors[j];
        await db.insert(refSubSectors).values({
          sectorId: row.id,
          code: sub.code,
          name: sub.name,
          sortOrder: j * 10,
          isActive: 1,
        });
      }
    }
  }

  for (const row of DEFAULT_ENUM_ROWS) {
    try {
      await db.insert(platformEnumMasters).values(row);
    } catch {
      /* duplicate type+code */
    }
  }
}
