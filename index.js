/**
 * @author UtkinG <utking@mail.ru>
 * Traverse a directory and write its content into a dir.lst file.
 *
 */

const fs = require("fs");
const program = require("commander");
const path = require("path");
const isDirectory = require("is-directory");
const Logger = require(__dirname+"/utils/Logger");
const DirProcessor = require(__dirname+"/utils/DirProcessor");
const Utils = require(__dirname+"/utils/directoryDiff");
const readPrevList = require(__dirname+"/utils/readPrevList");
const Modes = require(__dirname+"/utils/modes");
const TAB_WIDTH = 2;

let listFileName = "dir.lst";
let listingRegex = new RegExp(listFileName);
let filePrefix = "F";
let dirPrefix = "D";
let otherPrefix = "X";
let mode = Modes.CREATE_DEFAULT;


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

program
  .version("1.0.4")
  .usage("<directory_path> [options]")
  .option("-c, --compare", "Compare with the previous state")
  .option("-l, --listing-name <file_name>", "Set a listing file name", setListingName)
  .option("-s, --separate-listings", "Create a listing file for each directory")
  .option("-v, --verbose", "Verbose mode")
  .option("-f, --file-prefix <prefix_letter>", "Set a prifix letter for file entries", setFilePrefix)
  .option("-d, --dir-prefix <prefix_letter>", "Set a prifix letter for directory entries", setDirPrefix)
  .parse(process.argv);

const logger = new Logger(program.verbose);
const _rootDirPath = process.argv[2];

if (program.compare) {
  if (program.separateListings) {
    mode = Modes.COMPARE_SINGLE;
  } else {
    mode = Modes.COMPARE_DEFAULT;
  }
} else {
  if (program.separateListings) {
    mode = Modes.CREATE_SINGLE;
  } else {
    mode = Modes.CREATE_DEFAULT;
  }
}

if (!_rootDirPath) {
  logger.log("Missing argument");
} else {
  fs.stat(_rootDirPath, (err, stats) => {
    if (!stats || !stats.isDirectory()) {
      logger.printMessage(null, "<directory path> has to point to a valid directory" + _rootDirPath);
    } else {
      let dirProcessor = new DirProcessor(dirPrefix, filePrefix, otherPrefix);
      dirProcessor.mode = mode;
      dirProcessor.process(_rootDirPath, mode);
      if (mode === Modes.COMPARE_SINGLE || mode === Modes.CREATE_SINGLE) {
        if (mode === Modes.COMPARE_SINGLE || mode === Modes.COMPARE_DEFAULT) {
          readPrevList(listFileName)
            .then((prevList) => {
              logger.log(
                JSON.stringify(compareListings(prevList, dirProcessor.cumulativeListing), null, TAB_WIDTH));
            })
            .catch(logger.log);
        } else {
          fs.writeFile(listFileName, JSON.stringify(dirProcessor.cumulativeListing, null, TAB_WIDTH), 
            (err) => {
              if (err) {
                logger.printMessage(_rootDirPath, err);
              } else {
                logger.printMessage(null, "Single listing is done!");
              }
            });
        }
      }
    }
  });
}

