const fs = require("fs");

let readPrevList = (fileName) => {
  return new Promise((resolve, reject) => {
    if (!fileName) {
      reject(Error("Filename should not be empty"));
      return;
    }
    fs.stat(fileName, (err, stats) => {
      if (!stats || !stats.isFile()) {
        reject(Error(`File ${fileName} does not exist or is not a listing file`));
        return;
      }
      let result = {};
      try {
        result = fs.readFileSync(fileName);
        resolve(JSON.parse(result));
      } catch (e) {
        reject (e);
      }
    });
  });
};

module.exports = readPrevList;

