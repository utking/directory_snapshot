const fs = require("fs");
const path = require("path");
const isDirectory = require("is-directory");
const listFileName = "dir.lst";
const TAB_WIDTH = 2;
const listingRegex = new RegExp(listFileName);
const Utils = require(__dirname+"/directoryDiff");
const Modes = require(__dirname+"/modes");
const Logger = require(__dirname+"/Logger");

class DirProcessor {
  constructor(dirPrefix, filePrefix, otherPrefix) {
    this._dirPrefix = dirPrefix;
    this._filePrefix = filePrefix;
    this._otherPrefix = otherPrefix;
    this._mode = Modes.COMPARE_DEFAULT;
    this._logger = new Logger();
    this._cumulativeListing = {};
  }

  get cumulativeListing() {
    return this._cumulativeListing;
  }

  set mode(val) {
    this._mode = val;
  }

  get mode() {
    return this._mode;
  }

  _compareListings(prevList, curList) {
    return Utils.findDirectoriesDiff(prevList, curList);
  }

  process(dirPath) {
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
          this.process(newPath);
        }
        try {
          return isDir ? `${this._dirPrefix}:${f}` : `${this._filePrefix}:${f}`;
        } catch (ex) {
          return `${this._otherPrefix}:${f}`;
        }
      }).filter((f) => { return f && f.length; }).sort();
      if (this.mode === Modes.COMPARE_SINGLE || this.mode === Modes.CREATE_SINGLE) {
        this._cumulativeListing[dirPath] = filesList;
      } else {
        let curListingObject = {
          dirPath : filesList
        };
        if (this.mode === Modes.COMPARE_DEFAULT) {
          readPrevList(path.join(dirPath, listFileName))
            .then((prevList) => {
              let result = this._compareListings(prevList, curListingObject);
              if (result.fileDiff && result.fileDiff[dirPath]) {
                Logger.log(result.fileDiff);
              }
            })
            .catch(Logger.log);
        } else {
          fs.writeFile(`${dirPath}/${listFileName}`, JSON.stringify(curListingObject, null, TAB_WIDTH),
            (err) => {
              if (err) {
                this._logger.printMessage(dirPath, err);
              } else {
                this._logger.printMessage(null, `Directory "${dirPath}" is done!`);
              }
            });
        }
      }
    }
  };
}

module.exports = DirProcessor;

