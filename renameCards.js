const fs = require('fs');
const path = require('path');

// Directory containing the card images
const directoryPath = path.resolve('./client-vue/assets/images/cards'); // Update this path to your directory

// Mapping for special card names
const rankMapping = {
  ace: 1,
  jack: 11,
  queen: 12,
  king: 13,
};

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log('Error reading directory:', err);
    return;
  }
  console.log('here');
  files.forEach((file) => {
    const match = file.match(/^(\w+)_of_(\w+)\.png$/); // Match files like "2_of_clubs.png"
    if (match) {
      const [_, rank, suit] = match;
      const normalizedRank = rankMapping[rank.toLowerCase()] || rank; // Convert special names
      const newFileName = `${suit}-${normalizedRank}.png`;
      const oldFilePath = path.join(directoryPath, file);
      const newFilePath = path.join(directoryPath, newFileName);
    console.log(oldFilePath, newFilePath);
      fs.rename(oldFilePath, newFilePath, (renameErr) => {
        if (renameErr) {
          console.log(`Error renaming file ${file}:`, renameErr);
        } else {
          console.log(`Renamed: ${file} -> ${newFileName}`);
        }
      });
    }
  });
});