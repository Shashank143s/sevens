import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Source sprite sheet – update this path if you move the file
  const sourcePath = path.resolve(
    '/Users/shashanksk/.cursor/projects/Users-shashanksk-Desktop-sevens-game/assets/cards-4794b7d8-b5c0-4a96-baef-41c0af7b6866.png'
  );

  // Output directory inside the client public folder so the app can serve the files
  const outputDir = path.resolve(__dirname, '../../client/public/cards');
  await fs.mkdir(outputDir, { recursive: true });

  const metadata = await sharp(sourcePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read sprite sheet dimensions.');
  }

  const totalCols = 14; // 1 column of jokers/backs + 13 ranks
  const totalRows = 4; // spades, hearts, clubs, diamonds

  const cardWidth = Math.floor(metadata.width / totalCols);
  const cardHeight = Math.floor(metadata.height / totalRows);

  const suits = ['spades', 'hearts', 'clubs', 'diamonds'];

  // We skip column 0 (jokers/backs) and export ranks A(1)–K(13)
  for (let row = 0; row < totalRows; row += 1) {
    const suit = suits[row];

    for (let rankIndex = 0; rankIndex < 13; rankIndex += 1) {
      const col = rankIndex + 1; // start at column 1
      const left = col * cardWidth;
      const top = row * cardHeight;
      const rank = rankIndex + 1; // 1–13

      const outPath = path.join(outputDir, `${suit}-${rank}.png`);

      // eslint-disable-next-line no-await-in-loop
      await sharp(sourcePath)
        .extract({ left, top, width: cardWidth, height: cardHeight })
        .toFile(outPath);
    }
  }

  // Also export a generic card back from the clubs row, column 0
  const backLeft = 0;
  const backTop = 2 * cardHeight; // clubs row
  await sharp(sourcePath)
    .extract({ left: backLeft, top: backTop, width: cardWidth, height: cardHeight })
    .toFile(path.join(outputDir, 'back.png'));

  // eslint-disable-next-line no-console
  console.log(`Exported individual cards to: ${outputDir}`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

