import { createClient } from "contentful";

import constants from "../constants";

const client = createClient({
  space: constants.CONTENTFUL_SPACE_ID,
  accessToken: constants.CONTENTFUL_ACCESS_TOKEN,
});

export async function getGalleryImages() {
  const entries = await client.getEntries({ content_type: "galleryImage" });

  return entries.items.map((item) => ({
    id: item.sys.id,
    title: item.fields.title,
    image: item.fields.image?.fields?.file?.url
      ? `https:${item.fields.image.fields.file.url}`
      : "",
  }));
}
