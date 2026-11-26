import "server-only";
import type { Collection, HomeContent, SizeChartData } from "@/types";
import { DEFAULT_HOME, DEFAULT_SIZE_CHART, withDefaults } from "@/lib/content/defaults";
import { USE_DASHBOARD_STORE } from "./mode";
import { db } from "@/lib/db";

/** Home page content from the dashboard (Homepage), with the built-in text and photos for anything left empty. */
export async function getHomeContent(): Promise<HomeContent> {
  if (!USE_DASHBOARD_STORE) return DEFAULT_HOME;
  return withDefaults(await db.content.get());
}

/** Active collections (dashboard Collections). */
export async function listCollections(): Promise<Collection[]> {
  return USE_DASHBOARD_STORE ? db.shop.collections() : [];
}

export async function getCollection(slug: string): Promise<Collection | null> {
  return USE_DASHBOARD_STORE ? db.shop.collectionBySlug(slug) : null;
}

/** The size chart linked to a category in the dashboard's Size guide, or the built-in chart. */
export async function getSizeChart(categorySlug: string): Promise<Omit<SizeChartData, "id"> | null> {
  if (!USE_DASHBOARD_STORE) return DEFAULT_SIZE_CHART;
  return db.shop.sizeChartFor(categorySlug);
}
