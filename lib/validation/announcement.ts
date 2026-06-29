import { z } from "zod";

export const announcementFormSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(140, "Title is too long."),
  body: z.string().trim().min(10, "Body is required.").max(4000, "Body is too long."),
  category: z.string().trim().max(80, "Category is too long.").optional().or(z.literal("")),
  featuredImageUrl: z
    .preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().trim().url().max(300).optional()),
  attachmentUrl: z
    .preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().trim().url().max(300).optional()),
  publishedAt: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.coerce.date().optional()),
  isPublished: z.coerce.boolean().default(false),
});
