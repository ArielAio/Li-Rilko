const fs = require('fs');
const path = require('path');

const imgPath = path.join(process.cwd(), 'public/li-rilko-icon-page.png');
const imgData = fs.readFileSync(imgPath);
const base64 = imgData.toString('base64');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <defs>
    <clipPath id="circleView">
      <circle cx="96" cy="96" r="96" />
    </clipPath>
  </defs>
  <image width="192" height="192" href="data:image/png;base64,${base64}" clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice" />
</svg>`;

fs.writeFileSync(path.join(process.cwd(), 'app/icon.svg'), svg);
console.log('App Icon SVG created successfully!');
