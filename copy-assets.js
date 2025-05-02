const path = require('path');
const ncp = require('ncp').ncp;

const copyAssets = (filename) => {
    const srcAssets = path.join(__dirname, 'src', 'assets');
    const destAssets = path.join(__dirname, 'build', 'assets');

    ncp(srcAssets, destAssets, function (err) {
        if (err) {
            console.error('Error copying assets:', err);
        } else {
            console.log('Assets copied successfully!');
        }
    });
};

copyAssets();
