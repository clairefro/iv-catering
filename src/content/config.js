import { defineCollection, z } from "astro:content";

const galleryCollection = defineCollection({
  type: "data",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      cover: image(), // Astro's image helper
      alt: z.string(),
    }),
});

export const collections = { gallery: galleryCollection };
