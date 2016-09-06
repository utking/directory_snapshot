/**
 * @author UtkinG <utking@mail.ru>
 * Traverse a directory and write its content into a dir.lst file.
 *
 */

const fs = require('fs');
const program = require('commander');
const path = require('path');
const isDirectory = require('is-directory');

var listFileName = 'dir.lst';
var filePrefix = 'F';
var dirPrefix = 'D';
var otherPrefix = 'X';
var cumulativeListing = {};

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
	if (files) {
		var filesList = files.map((f) => {
			// Skip listings and hidden files
			if (f === listFileName || f[0] === '.') {
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
		}).filter(f => { return f; }).sort();
		if (program.singleListing) {
			cumulativeListing[dirPath] = filesList;
		} else {
			fs.writeFile(`${dirPath}/${listFileName}`, filesList.join('\n'), 
					function (err) {
						if (err) {
							_printMessage(dirPath, err);
						} else {
							_printMessage(null, `Directory '${dirPath}' is done!`);
						}
					});
		}
	}
};

function setFilePrefix (val) {
	filePrefix = val ? val.toString[0] : filePrefix;
}

function setDirPrefix (val) {
	dirPrefix = val ? val.toString()[0] : dirPrefix;
}

function setListingName (val) {
	listFileName = val || listFileName;
}

program
	.version('1.0.2')
	.usage('[options] <directory_path>')
	.option('-l, --listing-name <file_name>', 'Set a listing file name', setListingName)
	.option('-s, --single-listing', 'Create only one cumulative listing file')
	.option('-q, --quiet', 'Quiet mode')
	.option('-f, --file-prefix <prefix_letter>', 'Set a prifix letter for file entries', setFilePrefix)
	.option('-d, --dir-prefix <prefix_letter>', 'Set a prifix letter for directory entries', setDirPrefix)
	.parse(process.argv);

var _rootDirPath = process.argv[2];
if (!_rootDirPath) {
	_printMessage(null, 'Missing argument');
} else {
	fs.stat(_rootDirPath, function(err, stats) {
		if (!stats || !stats.isDirectory()) {
			_printMessage(null, '<directory path> has to point to a valid directory');
		} else {
			_processDirectory(_rootDirPath);
			fs.writeFile(listFileName, JSON.stringify(cumulativeListing, null, 2), 
					function (err) {
						if (err) {
							_printMessage(_rootDirPath, err);
						} else {
							_printMessage(null, 'Single listing is done!');
						}
					});
		}
	});
}


