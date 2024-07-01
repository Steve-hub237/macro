const fs = require('fs');
const path = '/opt/render/.cache/puppeteer/chrome/linux-125.0.6422.78/chrome-linux64/chrome';

fs.access(path, fs.constants.F_OK, (err) => {
  console.log(`${path} ${err ? 'does not exist' : 'exists'}`);
});