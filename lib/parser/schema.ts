import { z } from "zod";

export const stringListItemSchema = z.looseObject({
  href: z.string().optional(),
  value: z.string().optional(),
  timestamp: z.number().optional(),
});

export const relationshipEntrySchema = z.looseObject({
  title: z.string().optional(),
  string_list_data: z.array(stringListItemSchema).optional(),
});

export type RelationshipEntry = z.infer<typeof relationshipEntrySchema>;

/** Either a bare array of entries or an object wrapping one, e.g. `{ relationships_following: [...] }`. */
export const relationshipFileSchema = z.union([
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);
