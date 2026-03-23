/**
 * One-time migration script: Contentful gallery → local files
 * Downloads images to public/uploads/gallery/ and creates src/content/gallery/*.md
 *
 * Usage: node scripts/migrate-gallery.mjs
 */

import { createClient } from "contentful";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load .env manually (no dotenv dependency needed)
const envPath = path.join(root, ".env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.trim().split("=");
      return [k.trim(), v.join("=").trim()];
    })
);

const SPACE_ID = env.CONTENTFUL_SPACE_ID;
const ACCESS_TOKEN = env.CONTENTFUL_ACCESS_TOKEN;

if (!SPACE_ID || !ACCESS_TOKEN) {
  console.error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN in .env");
  process.exit(1);
}

const uploadDir = path.join(root, "public/uploads/gallery");
const contentDir = path.join(root, "src/content/gallery");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(contentDir, { recursive: true });

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      // Follow redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function extFromUrl(url) {
  const pathname = new URL("https:" + url).pathname;
  return path.extname(pathname) || ".jpg";
}

async function main() {
  const client = createClient({ space: SPACE_ID, accessToken: ACCESS_TOKEN });

  console.log("Fetching gallery entries from Contentful...");
  const entries = await client.getEntries({
    content_type: "galleryImage",
    limit: 200,
  });

  console.log(`Found ${entries.items.length} images.`);

  // Sort by updatedAt descending (same as original service)
  entries.items.sort(
    (a, b) => new Date(b.sys.updatedAt) - new Date(a.sys.updatedAt)
  );

  const usedSlugs = new Set();

  for (let i = 0; i < entries.items.length; i++) {
    const item = entries.items[i];
    const title = item.fields.title || `gallery-image-${i + 1}`;
    const imageUrl = item.fields.image?.fields?.file?.url;

    if (!imageUrl) {
      console.warn(`  [skip] "${title}" has no image URL`);
      continue;
    }

    // Unique slug
    let baseSlug = slugify(title) || `image-${i + 1}`;
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    usedSlugs.add(slug);

    const fullUrl = imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl;
    const ext = extFromUrl(fullUrl);
    const filename = `${slug}${ext}`;
    const destPath = path.join(uploadDir, filename);
    const publicPath = `/uploads/gallery/${filename}`;

    // Download image
    process.stdout.write(`  Downloading "${title}" → ${filename} ... `);
    try {
      await downloadFile(fullUrl, destPath);
      console.log("done");
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
      continue;
    }

    // Write .md collection file
    const mdPath = path.join(contentDir, `${slug}.md`);
    const md = `---\ntitle: "${title.replace(/"/g, '\\"')}"\nimage: "${publicPath}"\norder: ${i + 1}\n---\n`;
    fs.writeFileSync(mdPath, md, "utf-8");
    console.log(`  Created ${path.relative(root, mdPath)}`);
  }

  console.log("\nMigration complete!");
  console.log(`Images saved to: public/uploads/gallery/`);
  console.log(`Collection files saved to: src/content/gallery/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
