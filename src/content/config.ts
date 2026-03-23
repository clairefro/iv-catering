import { defineCollection, z } from "astro:content";

const testimonials = defineCollection({
  type: "content",
  schema: z.object({
    author: z.string(),
    isFeatured: z.boolean().default(false),
    quote: z.string(),
  }),
});

const menu = defineCollection({
  type: "content",
  schema: z.object({}),
});

const gallery = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    image: z.string(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = { testimonials, menu, gallery };
