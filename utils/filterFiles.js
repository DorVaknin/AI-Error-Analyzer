const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

function filterFiles(directory, extension) {
    return new Promise((resolve, reject) => {
        glob(path.join(directory, `**/*.${extension}`), (err, files) => {
            if (err) {
                return reject(err);
            }
            resolve(files);
        });
    });
}

module.exports = filterFiles;
