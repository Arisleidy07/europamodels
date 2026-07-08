const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, "..", "public", "icon.svg");
const outputDir = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generate() {
  for (const size of sizes) {
    await sharp(inputSvg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
