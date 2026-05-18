import { and, asc, eq } from "drizzle-orm";
import { db } from "../../database";
import {
  organizations,
  permissions,
  platformEnumMasters,
  refCities,
  refSectors,
  refStates,
  refSubSectors,
  shiftTypeMasters,
} from "../../database/schema";
import { ensurePlatformReferenceSeeded } from "./platform-reference.seed";

export async function listOrganizations() {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      legalName: organizations.legalName,
      email: organizations.email,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(asc(organizations.name));
}

export async function listPermissions() {
  return db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.code));
}

// —— Shift type masters ——
export async function listShiftTypesAdmin() {
  await ensurePlatformReferenceSeeded();
  return db.select().from(shiftTypeMasters).orderBy(asc(shiftTypeMasters.sortOrder), asc(shiftTypeMasters.id));
}

export async function createShiftType(input: {
  code: string;
  label: string;
  description?: string;
  sortOrder?: number;
}) {
  await db.insert(shiftTypeMasters).values({
    code: input.code.trim().toLowerCase(),
    label: input.label.trim(),
    description: input.description?.trim() || null,
    sortOrder: input.sortOrder ?? 0,
  });
  const [row] = await db
    .select()
    .from(shiftTypeMasters)
    .where(eq(shiftTypeMasters.code, input.code.trim().toLowerCase()))
    .limit(1);
  return row;
}

export async function updateShiftType(
  id: number,
  input: { label?: string; description?: string; sortOrder?: number },
) {
  await db
    .update(shiftTypeMasters)
    .set({
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    })
    .where(eq(shiftTypeMasters.id, id));
  const [row] = await db.select().from(shiftTypeMasters).where(eq(shiftTypeMasters.id, id)).limit(1);
  return row ?? null;
}

export async function deleteShiftType(id: number) {
  await db.delete(shiftTypeMasters).where(eq(shiftTypeMasters.id, id));
}

// —— States ——
export async function listStatesAdmin() {
  await ensurePlatformReferenceSeeded();
  return db.select().from(refStates).orderBy(asc(refStates.sortOrder), asc(refStates.name));
}

export async function createState(input: { code: string; name: string; sortOrder?: number; isActive?: boolean }) {
  await db.insert(refStates).values({
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive === false ? 0 : 1,
  });
  const [row] = await db
    .select()
    .from(refStates)
    .where(eq(refStates.code, input.code.trim().toUpperCase()))
    .limit(1);
  return row;
}

export async function updateState(
  id: number,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
) {
  await db
    .update(refStates)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    })
    .where(eq(refStates.id, id));
  const [row] = await db.select().from(refStates).where(eq(refStates.id, id)).limit(1);
  return row ?? null;
}

// —— Cities ——
export async function listCitiesAdmin(stateId?: number) {
  await ensurePlatformReferenceSeeded();
  if (stateId) {
    return db
      .select()
      .from(refCities)
      .where(eq(refCities.stateId, stateId))
      .orderBy(asc(refCities.sortOrder), asc(refCities.name));
  }
  return db.select().from(refCities).orderBy(asc(refCities.stateId), asc(refCities.name));
}

export async function createCity(input: {
  stateId: number;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  await db.insert(refCities).values({
    stateId: input.stateId,
    name: input.name.trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive === false ? 0 : 1,
  });
  const rows = await db
    .select()
    .from(refCities)
    .where(and(eq(refCities.stateId, input.stateId), eq(refCities.name, input.name.trim())))
    .limit(1);
  return rows[0];
}

export async function updateCity(
  id: number,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
) {
  await db
    .update(refCities)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    })
    .where(eq(refCities.id, id));
  const [row] = await db.select().from(refCities).where(eq(refCities.id, id)).limit(1);
  return row ?? null;
}

export async function deleteCity(id: number) {
  await db.delete(refCities).where(eq(refCities.id, id));
}

// —— Sectors ——
export async function listSectorsAdmin() {
  await ensurePlatformReferenceSeeded();
  return db.select().from(refSectors).orderBy(asc(refSectors.sortOrder), asc(refSectors.name));
}

export async function createSector(input: { code: string; name: string; sortOrder?: number; isActive?: boolean }) {
  await db.insert(refSectors).values({
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive === false ? 0 : 1,
  });
  const [row] = await db
    .select()
    .from(refSectors)
    .where(eq(refSectors.code, input.code.trim().toLowerCase()))
    .limit(1);
  return row;
}

export async function updateSector(
  id: number,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
) {
  await db
    .update(refSectors)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    })
    .where(eq(refSectors.id, id));
  const [row] = await db.select().from(refSectors).where(eq(refSectors.id, id)).limit(1);
  return row ?? null;
}

// —— Sub-sectors ——
export async function listSubSectorsAdmin(sectorId?: number) {
  await ensurePlatformReferenceSeeded();
  if (sectorId) {
    return db
      .select()
      .from(refSubSectors)
      .where(eq(refSubSectors.sectorId, sectorId))
      .orderBy(asc(refSubSectors.sortOrder), asc(refSubSectors.name));
  }
  return db.select().from(refSubSectors).orderBy(asc(refSubSectors.sectorId), asc(refSubSectors.sortOrder));
}

export async function createSubSector(input: {
  sectorId: number;
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  await db.insert(refSubSectors).values({
    sectorId: input.sectorId,
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive === false ? 0 : 1,
  });
  const rows = await db
    .select()
    .from(refSubSectors)
    .where(
      and(eq(refSubSectors.sectorId, input.sectorId), eq(refSubSectors.code, input.code.trim().toLowerCase())),
    )
    .limit(1);
  return rows[0];
}

export async function updateSubSector(
  id: number,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
) {
  await db
    .update(refSubSectors)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    })
    .where(eq(refSubSectors.id, id));
  const [row] = await db.select().from(refSubSectors).where(eq(refSubSectors.id, id)).limit(1);
  return row ?? null;
}

export async function deleteSubSector(id: number) {
  await db.delete(refSubSectors).where(eq(refSubSectors.id, id));
}

// —— Platform enums ——
export async function listEnumMasters(enumType?: string) {
  await ensurePlatformReferenceSeeded();
  if (enumType) {
    return db
      .select()
      .from(platformEnumMasters)
      .where(eq(platformEnumMasters.enumType, enumType))
      .orderBy(asc(platformEnumMasters.sortOrder), asc(platformEnumMasters.label));
  }
  return db
    .select()
    .from(platformEnumMasters)
    .orderBy(asc(platformEnumMasters.enumType), asc(platformEnumMasters.sortOrder));
}

export async function createEnumMaster(input: {
  enumType: string;
  code: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  await db.insert(platformEnumMasters).values({
    enumType: input.enumType.trim(),
    code: input.code.trim(),
    label: input.label.trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive === false ? 0 : 1,
  });
  const [row] = await db
    .select()
    .from(platformEnumMasters)
    .where(
      and(eq(platformEnumMasters.enumType, input.enumType.trim()), eq(platformEnumMasters.code, input.code.trim())),
    )
    .limit(1);
  return row;
}

export async function updateEnumMaster(
  id: number,
  input: { label?: string; sortOrder?: number; isActive?: boolean },
) {
  await db
    .update(platformEnumMasters)
    .set({
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    })
    .where(eq(platformEnumMasters.id, id));
  const [row] = await db.select().from(platformEnumMasters).where(eq(platformEnumMasters.id, id)).limit(1);
  return row ?? null;
}

export async function deleteEnumMaster(id: number) {
  await db.delete(platformEnumMasters).where(eq(platformEnumMasters.id, id));
}
