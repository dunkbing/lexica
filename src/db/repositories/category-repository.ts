import { eq, sql } from "drizzle-orm";
import { getVocabDrizzle } from "../database";
import {
  categories,
  categoryGroups,
  type CategoryGroupRow,
} from "../drizzle/schema";
import type { Category, CategoryGroup } from "@/types";

// Convert database row to CategoryGroup type
const rowToCategoryGroup = (row: CategoryGroupRow): CategoryGroup => ({
  id: row.id,
  name_en: row.nameEn,
  name_vi: row.nameVi,
});

// Get all category groups
export const getAllCategoryGroups = async (): Promise<CategoryGroup[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(categoryGroups);
  return rows.map(rowToCategoryGroup);
};

// Get category group by ID
export const getCategoryGroupById = async (
  id: string,
): Promise<CategoryGroup | undefined> => {
  const db = await getVocabDrizzle();
  const rows = await db
    .select()
    .from(categoryGroups)
    .where(eq(categoryGroups.id, id));
  return rows.length > 0 ? rowToCategoryGroup(rows[0]) : undefined;
};

// Get all categories with word counts
export const getAllCategories = async (): Promise<Category[]> => {
  const db = await getVocabDrizzle();

  const result = await db
    .select({
      id: categories.id,
      groupId: categories.groupId,
      nameEn: categories.nameEn,
      nameVi: categories.nameVi,
      wordCount: sql<number>`(SELECT COUNT(*) FROM words WHERE words.category_id = ${categories.id})`,
    })
    .from(categories);

  return result.map((row) => ({
    id: row.id,
    groupId: row.groupId,
    name_en: row.nameEn,
    name_vi: row.nameVi,
    wordCount: row.wordCount,
  }));
};

// Get categories by group
export const getCategoriesByGroup = async (
  groupId: string,
): Promise<Category[]> => {
  const db = await getVocabDrizzle();

  const result = await db
    .select({
      id: categories.id,
      groupId: categories.groupId,
      nameEn: categories.nameEn,
      nameVi: categories.nameVi,
      wordCount: sql<number>`(SELECT COUNT(*) FROM words WHERE words.category_id = ${categories.id})`,
    })
    .from(categories)
    .where(eq(categories.groupId, groupId));

  return result.map((row) => ({
    id: row.id,
    groupId: row.groupId,
    name_en: row.nameEn,
    name_vi: row.nameVi,
    wordCount: row.wordCount,
  }));
};

// Get category by ID
export const getCategoryById = async (
  id: string,
): Promise<Category | undefined> => {
  const db = await getVocabDrizzle();

  const result = await db
    .select({
      id: categories.id,
      groupId: categories.groupId,
      nameEn: categories.nameEn,
      nameVi: categories.nameVi,
      wordCount: sql<number>`(SELECT COUNT(*) FROM words WHERE words.category_id = ${categories.id})`,
    })
    .from(categories)
    .where(eq(categories.id, id));

  if (result.length === 0) return undefined;

  const row = result[0];
  return {
    id: row.id,
    groupId: row.groupId,
    name_en: row.nameEn,
    name_vi: row.nameVi,
    wordCount: row.wordCount,
  };
};

// Get total category count
export const getCategoryCount = async (): Promise<number> => {
  const db = await getVocabDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(categories);
  return result[0]?.count ?? 0;
};

// Get categories grouped by their group (for UI display)
export const getCategoriesGrouped = async (): Promise<
  Map<CategoryGroup, Category[]>
> => {
  const groups = await getAllCategoryGroups();
  const allCategories = await getAllCategories();

  const grouped = new Map<CategoryGroup, Category[]>();

  for (const group of groups) {
    const categoriesInGroup = allCategories.filter(
      (c) => c.groupId === group.id,
    );
    if (categoriesInGroup.length > 0) {
      grouped.set(group, categoriesInGroup);
    }
  }

  return grouped;
};
