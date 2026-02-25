import { createClient } from "contentful";
import constants from "../constants";
import {
  getGalleryCache,
  setGalleryCache,
  getMenuCache,
  setMenuCache,
} from "./devCache.js";

const client = createClient({
  space: constants.CONTENTFUL_SPACE_ID,
  accessToken: constants.CONTENTFUL_ACCESS_TOKEN,
});

const isDev = import.meta.env.DEV;

console.log({ isDev });

export async function getGalleryImages() {
  if (isDev) {
    const cached = getGalleryCache();
    if (cached) return cached;
  }
  const entries = await client.getEntries({ content_type: "galleryImage" });
  const images = entries.items.map((item) => ({
    id: item.sys.id,
    title: item.fields.title,
    image: item.fields.image?.fields?.file?.url
      ? `https:${item.fields.image.fields.file.url}`
      : "",
    updatedAt: item.sys.updatedAt,
  }));
  // Sort by updatedAt descending
  images.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (isDev) setGalleryCache(images);
  return images;
}

export async function getMenuRichText() {
  if (isDev) {
    const cached = getMenuCache();
    if (cached) return cached;
  }
  const entries = await client.getEntries({ content_type: "menu" });
  if (!entries.items.length) return null;
  const text = entries.items[0].fields.text;
  if (isDev) setMenuCache(text);
  return text;
}
