const ncp = require('ncp').ncp;
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'assets');
const destDir = path.join(__dirname, 'build', 'assets');

ncp(srcDir, destDir, function (err) {
    if (err) {
        console.error('Error copying assets:', err);
    } else {
        console.log('Assets copied successfully!');
    }
});
