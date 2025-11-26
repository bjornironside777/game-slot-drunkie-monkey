var fs = require('fs-extra');
var archiver = require('archiver');
const { name, version } = require("../package.json");

// Configuration
const REMOVE_FOLDER_ON_COMPLETE = true;

// Paths
const canonicalName = name;
const buildFolderPath = "./build/";
const temporaryFolderPath = './package_temp';
const zipFileName = `${buildFolderPath}${canonicalName}-${version}.zip`;
const unzippedFolderPath = `${buildFolderPath}${canonicalName}-${version}`;

// Ensure the build folder is clean
if (fs.existsSync(buildFolderPath)) {
    fs.removeSync(buildFolderPath);
}
fs.mkdirSync(buildFolderPath);
console.log('Cleaned and recreated build folder:', buildFolderPath);

// Clean up temporary folder if it exists
if (fs.existsSync(temporaryFolderPath)) {
    fs.removeSync(temporaryFolderPath);
}

// Copy game items to temporary folder
console.log('Preparing temporary folder for game package...');
const listOfGameItems = [
    'assets',
    'dist'
];
listOfGameItems.forEach(function (itemPath) {
    if (fs.existsSync(itemPath)) {
        const stats = fs.lstatSync(itemPath);
        if (stats.isFile()) {
            fs.copySync(itemPath, `${temporaryFolderPath}/${itemPath}`);
        } else if (stats.isDirectory()) {
            fs.copySync(itemPath, `${temporaryFolderPath}/${itemPath}`, {
                filter: function (src) {
                    return !src.endsWith(".ts");
                }
            });
        }
    } else {
        console.warn('Path does not exist and will be skipped:', itemPath);
    }
});

// Copy temporary folder to create an unzipped version
fs.copySync(temporaryFolderPath, unzippedFolderPath);
console.log('Unzipped game package created at:', unzippedFolderPath);

// Create a zip archive
console.log('Creating zipped game package:', zipFileName);
const output = fs.createWriteStream(zipFileName);
const zipArchive = archiver('zip');
zipArchive.pipe(output);

output.on('close', function () {
    console.log('Zipped game package created at:', zipFileName);
    if (REMOVE_FOLDER_ON_COMPLETE) {
        fs.removeSync(temporaryFolderPath);
        console.log('Temporary folder removed:', temporaryFolderPath);
    }
});

zipArchive.directory(temporaryFolderPath, false);
zipArchive.finalize().catch(err => {
    console.error('Error while finalizing archive:', err);
});
