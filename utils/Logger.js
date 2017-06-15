const Console = require("console").Console;

class Logger {
  constructor(isVerbose) {
    this._isVerbose = !!isVerbose;
    this._log = new Console(process.stdout, process.stderr);
  }

  printMessage(dirPath, err) {
    if (this._isVerbose) {
      if (err && err.code && (err.code === "EPERM" || err.code === "EACCES")) {
        this._log.log(`${dirPath}: Permission denied`);
      } else {
        this._log.log(err);
      }
    }
  }

  log(...args) {
    this._log.log(args.join(", "));
  }
}

module.exports = Logger;

