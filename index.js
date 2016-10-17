/**
 * @author UtkinG <utking@mail.ru>
 * Traverse a directory and write its content into a dir.lst file.
 *
 */

const fs = require('fs');
const program = require('commander');
const path = require('path');
const isDirectory = require('is-directory');

var compareMode = false;
var listFileName = 'dir.lst';
var listingRegex = new RegExp(listFileName);
var filePrefix = 'F';
var dirPrefix = 'D';
var otherPrefix = 'X';
var cumulativeListing = {};
var tabWidth = null;

var _printMessage = function (dirPath, err) {
  if (program.quiet) {
    return;
  }
  if (err && err.code && (err.code === 'EPERM' || err.code === 'EACCES')) {
    console.log(`${dirPath}: Permission denied`);
  } else {
    console.log(err);
  }
};

var _processDirectory = function (dirPath) {
  var files = [];
  try {
    files = fs.readdirSync(dirPath);
  } catch (ex) {
    files = [];
  }
  if (files.length) {
    var filesList = files.map((f) => {
      // Skip listings and hidden files
      if (listingRegex.test(f) || f[0] === '.') {
        return null;
      }
      var newPath = path.join(dirPath, f);
      var isDir = false;
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
    if (program.singleListing) {
      cumulativeListing[dirPath] = filesList;
    } else {
      var curListingObject = {};
      curListingObject[dirPath] = filesList;
      if (compareMode) {
        readPrevList(path.join(dirPath, listFileName))
          .then(function (prevList) {
            var result = compareListings(prevList, curListingObject);
            if (result.fileDiff && result.fileDiff[dirPath]) {
              console.log(result.fileDiff);
            }
          })
        .catch(console.log);
      } else {
        fs.writeFile(`${dirPath}/${listFileName}`, JSON.stringify(curListingObject, null, tabWidth),
            function (err) {
              if (err) {
                _printMessage(dirPath, err);
              } else {
                _printMessage(null, `Directory '${dirPath}' is done!`);
              }
            });
      }
    }
  }
};

var setFilePrefix = function (val) {
  filePrefix = val ? val.toString[0] : filePrefix;
};

var setDirPrefix = function (val) {
  dirPrefix = val ? val.toString()[0] : dirPrefix;
};

var setListingName = function (val) {
  listFileName = val || listFileName;
};

var _findDirectoriesDiff = function (prevList, curList) {
  var dirDiff = [];
  var fileDiff = {};
  Object.keys(prevList).forEach((p) => {
    if (!curList[p]) {
      dirDiff.push(' --- ' + p);
    } else {
      var result = _findFilesDiff(prevList[p], curList[p]);
      if (result.length) {
        fileDiff[p] = result;
      }
    }
  });
  Object.keys(curList).forEach((p) => {
    if (!prevList[p]) {
      dirDiff.push(' +++ ' + p);
    }
  });
  return {dirDiff, fileDiff};
};

var _findFilesDiff = function (dirPrevList, dirCurList) {
  var result = [];
  dirPrevList.forEach((p) => {
    if (dirCurList.find((i) => { return i === p; }) === undefined) {
      result.push(' --- ' + p);
    }
  });
  dirCurList.forEach((c) => {
    if (dirPrevList.find((i) => { return i === c; }) === undefined) {
      result.push(' +++ ' + c);
    }
  });
  return result;
};

var compareListings = function (prevList, curList) {
  return _findDirectoriesDiff(prevList, curList);
};

function readPrevList(fileName) {
  return new Promise(function(resolve, reject) {
    if (!fileName) {
      reject(Error('Filename should not be empty'));
      return;
    }
    fs.stat(fileName, function(err, stats) {
      if (!stats || !stats.isFile()) {
        reject(Error(`File ${fileName} does not exist or is not a listing file`));
        return;
      }
      var result = {};
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
.version('1.0.2')
.usage('[options] <directory_path>')
.option('-c, --compare', 'Compare with the previous state')
.option('-l, --listing-name <file_name>', 'Set a listing file name', setListingName)
.option('-s, --single-listing', 'Create only one cumulative listing file')
.option('-q, --quiet', 'Quiet mode')
.option('-p, --pretty-output', 'Pretty JOSN output for listings')
.option('-f, --file-prefix <prefix_letter>', 'Set a prifix letter for file entries', setFilePrefix)
.option('-d, --dir-prefix <prefix_letter>', 'Set a prifix letter for directory entries', setDirPrefix)
.parse(process.argv);

var _rootDirPath = process.argv[2];
compareMode = (program.compare ? true : false);
if (!_rootDirPath) {
  _printMessage(null, 'Missing argument');
} else {
  fs.stat(_rootDirPath, function(err, stats) {
    if (!stats || !stats.isDirectory()) {
      _printMessage(null, '<directory path> has to point to a valid directory');
    } else {
      _processDirectory(_rootDirPath);
      if (program.prettyOutput) {
        tabWidth = 2;
      }
      if (program.singleListing) {
        if (compareMode) {
          readPrevList(listFileName)
            .then(function (prevList) {
              console.log(
                  JSON.stringify(compareListings(prevList, cumulativeListing),
                    null, 2));
            })
          .catch(console.log);
        } else {
          fs.writeFile(listFileName, JSON.stringify(cumulativeListing, null, tabWidth), 
              function (err) {
                if (err) {
                  _printMessage(_rootDirPath, err);
                } else {
                  _printMessage(null, 'Single listing is done!');
                }
              });
        }
      }
    }
  });
}


