import "server-only";
import type { Review } from "@/types";
import { USE_DASHBOARD_STORE } from "./mode";
import { db } from "@/lib/db";

/** Reviews are collected in the dashboard store for now (the database comes later). */
export const REVIEWS_ENABLED = USE_DASHBOARD_STORE;

/** Approved reviews for a product, newest first. */
export async function getReviews(productId: string): Promise<Review[]> {
  return USE_DASHBOARD_STORE ? db.shop.reviewsFor(productId) : [];
}
