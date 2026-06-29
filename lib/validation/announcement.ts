import { z } from "zod";

export const announcementFormSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(140, "Title is too long."),
  body: z.string().trim().min(10, "Body is required.").max(4000, "Body is too long."),
  category: z.string().trim().max(80, "Category is too long.").optional().or(z.literal("")),
  isPublished: z.coerce.boolean().default(false),
});
