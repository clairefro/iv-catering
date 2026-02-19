import { createClient } from 'contentful';

const client = createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.CONTENTFUL_ACCESS_TOKEN,
});

export async function getMenuRichText() {
  const entries = await client.getEntries({ content_type: 'menu' });
  if (!entries.items.length) return null;
  return entries.items[0].fields.text;
}
