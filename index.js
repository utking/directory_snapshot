/**
 * @author UtkinG <utking@mail.ru>
 * Traverse a directory and write its content into a dir.lst file.
 *
 */

const fs = require("fs");
const program = require("commander");
const path = require("path");
const isDirectory = require("is-directory");
const Console = require("console").Console;
const Logger = new Console(process.stdout, process.stderr);
const Utils = require(__dirname+"/utils/directoryDiff");

let compareMode = false;
let listFileName = "dir.lst";
let listingRegex = new RegExp(listFileName);
let filePrefix = "F";
let dirPrefix = "D";
let otherPrefix = "X";
let cumulativeListing = {};
let tabWidth = null;
let singleListing = true;

let _printMessage = (dirPath, err) => {
  if (program.verbose) {
    if (err && err.code && (err.code === "EPERM" || err.code === "EACCES")) {
      Logger.log(`${dirPath}: Permission denied`);
    } else {
      Logger.log(err);
    }
  }
};

let _processDirectory = (dirPath) => {
  let files = [];
  try {
    files = fs.readdirSync(dirPath);
  } catch (ex) {
    files = [];
  }
  if (files.length) {
    let filesList = files.map((f) => {
      // Skip listings and hidden files
      if (listingRegex.test(f) || f[0] === ".") {
        return null;
      }
      let newPath = path.join(dirPath, f);
      let isDir = false;
      try {
        isDir = isDirectory.sync(newPath);
      } catch (ex) { }
      if (isDir) {
        _processDirectory(newPath);
      }
      try {
        return isDir ? `${dirPrefix}:${f}` : `${filePrefix}:${f}`;
      } catch (ex) {
        return `${otherPrefix}:${f}`;
      }
    }).filter((f) => { return f && f.length; }).sort();
    if (singleListing) {
      cumulativeListing[dirPath] = filesList;
    } else {
      let curListingObject = {};
      curListingObject[dirPath] = filesList;
      if (compareMode) {
        readPrevList(path.join(dirPath, listFileName))
          .then((prevList) => {
            let result = compareListings(prevList, curListingObject);
            if (result.fileDiff && result.fileDiff[dirPath]) {
              Logger.log(result.fileDiff);
            }
          })
          .catch(Logger.log);
      } else {
        fs.writeFile(`${dirPath}/${listFileName}`, JSON.stringify(curListingObject, null, tabWidth),
          (err) => {
            if (err) {
              _printMessage(dirPath, err);
            } else {
              _printMessage(null, `Directory "${dirPath}" is done!`);
            }
          });
      }
    }
  }
};

let setFilePrefix = (val) => {
  filePrefix = val ? val.toString[0] : filePrefix;
};

let setDirPrefix = (val) => {
  dirPrefix = val ? val.toString()[0] : dirPrefix;
};

let setListingName = (val) => {
  listFileName = val || listFileName;
};

let compareListings = (prevList, curList) => {
  return Utils.findDirectoriesDiff(prevList, curList);
};

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

program
  .version("1.0.3")
  .usage("<directory_path> [options]")
  .option("-c, --compare", "Compare with the previous state")
  .option("-l, --listing-name <file_name>", "Set a listing file name", setListingName)
  .option("-s, --separate-listings", "Create a listing file for each directory")
  .option("-v, --verbose", "Verbose mode")
  .option("-p, --pretty-output", "Pretty JOSN output for listings")
  .option("-f, --file-prefix <prefix_letter>", "Set a prifix letter for file entries", setFilePrefix)
  .option("-d, --dir-prefix <prefix_letter>", "Set a prifix letter for directory entries", setDirPrefix)
  .parse(process.argv);

let _rootDirPath = process.argv[2];
compareMode = (program.compare ? true : false);
singleListing = (program.separateListings ? false : true);

if (!_rootDirPath) {
  _printMessage(null, "Missing argument");
} else {
  fs.stat(_rootDirPath, (err, stats) => {
    if (!stats || !stats.isDirectory()) {
      _printMessage(null, "<directory path> has to point to a valid directory");
    } else {
      _processDirectory(_rootDirPath);
      if (program.prettyOutput) {
        tabWidth = 2;
      }
      if (singleListing) {
        if (compareMode) {
          readPrevList(listFileName)
            .then((prevList) => {
              Logger.log(
                JSON.stringify(compareListings(prevList, cumulativeListing),
                  null, 2));
            })
            .catch(Logger.log);
        } else {
          fs.writeFile(listFileName, JSON.stringify(cumulativeListing, null, tabWidth), 
            (err) => {
              if (err) {
                _printMessage(_rootDirPath, err);
              } else {
                _printMessage(null, "Single listing is done!");
              }
            });
        }
      }
    }
  });
}

