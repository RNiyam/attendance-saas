import { and, asc, eq } from "drizzle-orm";
import { db } from "../../database";
import { platformEnumMasters, refCities, refSectors, refStates, refSubSectors } from "../../database/schema";
import { ensurePlatformReferenceSeeded } from "../super-admin/platform-reference.seed";
import { INDIAN_STATES, listCitiesForState } from "./india-geo.data";
import { findSector, SECTORS } from "./sectors.data";

export async function listStates() {
  try {
    await ensurePlatformReferenceSeeded();
    const rows = await db
      .select()
      .from(refStates)
      .where(eq(refStates.isActive, 1))
      .orderBy(asc(refStates.sortOrder), asc(refStates.name));
    if (rows.length > 0) {
      return rows.map((s) => ({ code: s.code, name: s.name }));
    }
  } catch {
    /* table missing */
  }
  return INDIAN_STATES.map((s) => ({ code: s.code, name: s.name }));
}

export async function listCitiesForStateCode(stateCode: string) {
  const code = stateCode.trim().toUpperCase();
  try {
    await ensurePlatformReferenceSeeded();
    const [state] = await db.select().from(refStates).where(eq(refStates.code, code)).limit(1);
    if (state) {
      const cities = await db
        .select()
        .from(refCities)
        .where(and(eq(refCities.stateId, state.id), eq(refCities.isActive, 1)))
        .orderBy(asc(refCities.sortOrder), asc(refCities.name));
      if (cities.length > 0) {
        return { stateCode: code, cities: cities.map((c) => ({ name: c.name })) };
      }
    }
  } catch {
    /* fallback */
  }
  const exists = INDIAN_STATES.some((s) => s.code === code);
  if (!exists) return null;
  const cities = listCitiesForState(code);
  return { stateCode: code, cities: cities.map((name) => ({ name })) };
}

export async function listSectors() {
  try {
    await ensurePlatformReferenceSeeded();
    const rows = await db
      .select()
      .from(refSectors)
      .where(eq(refSectors.isActive, 1))
      .orderBy(asc(refSectors.sortOrder), asc(refSectors.name));
    if (rows.length > 0) {
      return rows.map((s) => ({ code: s.code, name: s.name }));
    }
  } catch {
    /* fallback */
  }
  return SECTORS.map((s) => ({ code: s.code, name: s.name }));
}

export async function listSubSectorsForSectorCode(sectorCode: string) {
  const code = sectorCode.trim().toLowerCase();
  try {
    await ensurePlatformReferenceSeeded();
    const [sector] = await db.select().from(refSectors).where(eq(refSectors.code, code)).limit(1);
    if (sector) {
      const subs = await db
        .select()
        .from(refSubSectors)
        .where(and(eq(refSubSectors.sectorId, sector.id), eq(refSubSectors.isActive, 1)))
        .orderBy(asc(refSubSectors.sortOrder), asc(refSubSectors.name));
      if (subs.length > 0) {
        return {
          sectorCode: sector.code,
          subSectors: subs.map((x) => ({ code: x.code, name: x.name })),
        };
      }
    }
  } catch {
    /* fallback */
  }
  const sector = findSector(code);
  if (!sector) return null;
  return {
    sectorCode: sector.code,
    subSectors: sector.subSectors.map((x) => ({ code: x.code, name: x.name })),
  };
}

export async function findSectorByCodeAndName(sectorCode: string, sectorName: string) {
  try {
    await ensurePlatformReferenceSeeded();
    const [row] = await db.select().from(refSectors).where(eq(refSectors.code, sectorCode.trim().toLowerCase())).limit(1);
    if (row && row.name.toLowerCase() === sectorName.trim().toLowerCase()) {
      const subs = await db
        .select()
        .from(refSubSectors)
        .where(eq(refSubSectors.sectorId, row.id));
      return {
        code: row.code,
        name: row.name,
        subSectors: subs.map((s) => ({ code: s.code, name: s.name })),
      };
    }
  } catch {
    /* fallback */
  }
  return findSector(sectorCode);
}

export async function listEnumsByType(enumType: string) {
  try {
    await ensurePlatformReferenceSeeded();
    const rows = await db
      .select()
      .from(platformEnumMasters)
      .where(and(eq(platformEnumMasters.enumType, enumType), eq(platformEnumMasters.isActive, 1)))
      .orderBy(asc(platformEnumMasters.sortOrder));
    if (rows.length > 0) {
      return rows.map((r) => ({ code: r.code, label: r.label }));
    }
  } catch {
    /* ignore */
  }
  return [];
}
