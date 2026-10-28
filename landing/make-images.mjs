// Draws the favicon, the home screen icon and the share picture (the preview WhatsApp, LinkedIn and X show).
// Run it after changing "place" in site.config.json:  node make-images.mjs
// It needs one package, once:  npm install --save-dev sharp
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "src");
const PLACE = String(
  JSON.parse(readFileSync(join(HERE, "site.config.json"), "utf8")).place ??
    "Lagos",
)
  .trim()
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;");

const cross = "M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z";

// favicon: the Prima logo
writeFileSync(
  join(SRC, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#0F766E"/><path d="${cross}" fill="#fff"/></svg>\n`,
);

// apple touch icon: full-bleed teal, the phone rounds the corners itself
await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#0F766E"/><g transform="translate(20 20) scale(1.1) translate(-20 -20)"><path d="${cross}" fill="#fff"/></g></svg>`,
  ),
)
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(join(SRC, "apple-touch-icon.png"));

// the share image shown by WhatsApp, LinkedIn and X: 1200 x 630
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="DejaVu Sans, Arial, sans-serif">
<rect width="1200" height="630" fill="#0F766E"/>
<g transform="translate(70 70)"><rect width="64" height="64" rx="16" fill="#fff"/><g transform="scale(1.6)"><path d="${cross}" fill="#0F766E"/></g></g>
<text x="152" y="118" font-size="46" font-weight="700" fill="#fff">Prima</text>
<text x="70" y="270" font-size="70" font-weight="700" fill="#fff">A patient register</text>
<text x="70" y="352" font-size="70" font-weight="700" fill="#fff">that works with</text>
<text x="70" y="434" font-size="70" font-weight="700" fill="#fff">no internet.</text>
<text x="70" y="520" font-size="30" fill="#CCFBF1">For primary health centres in Nigeria</text>
<text x="70" y="568" font-size="26" fill="#CCFBF1">Built in public in ${PLACE}</text>
<g transform="translate(830 70)">
  <rect width="290" height="490" rx="44" fill="#0b1f1d"/>
  <rect x="14" y="14" width="262" height="462" rx="32" fill="#FFFBEB"/>
  <rect x="14" y="14" width="262" height="96" rx="32" fill="#0F766E"/><rect x="14" y="70" width="262" height="40" fill="#0F766E"/>
  <text x="40" y="78" font-size="26" font-weight="700" fill="#fff">Prima</text>
  <rect x="150" y="52" width="102" height="34" rx="17" fill="#F59E0B"/><text x="164" y="75" font-size="15" font-weight="700" fill="#1C1917">Offline · 1</text>
  <rect x="34" y="132" width="222" height="100" rx="18" fill="#0F766E"/><text x="50" y="170" font-size="20" font-weight="700" fill="#fff">Good morning</text>
  <rect x="50" y="184" width="190" height="32" rx="10" fill="#fff"/><text x="86" y="206" font-size="15" font-weight="700" fill="#134E4A">Register patient</text>
  <rect x="34" y="250" width="106" height="64" rx="14" fill="#fff" stroke="#D6D3D1" stroke-width="3"/><text x="48" y="292" font-size="30" font-weight="700" fill="#1C1917">129</text>
  <rect x="150" y="250" width="106" height="64" rx="14" fill="#fff" stroke="#D6D3D1" stroke-width="3"/><text x="164" y="292" font-size="30" font-weight="700" fill="#1C1917">4</text>
  <rect x="34" y="340" width="222" height="104" rx="16" fill="#fff" stroke="#0F766E" stroke-width="3"/>
  <text x="50" y="378" font-size="17" font-weight="700" fill="#1C1917">Ngozi Okafor</text><text x="50" y="404" font-size="15" font-weight="700" fill="#0F766E">ANK-7K3F9Q</text>
  <text x="50" y="430" font-size="13" fill="#57534E">Saved on this phone</text>
</g>

</svg>`;
await sharp(Buffer.from(og))
  .png({ compressionLevel: 9, palette: true })
  .toFile(join(SRC, "og.png"));
console.log(`images written for ${PLACE}`);
