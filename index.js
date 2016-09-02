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

var _printError = function (dirPath, err) {
	if (err.code && (err.code === 'EPERM' || err.code === 'EACCES')) {
		console.log(`${dirPath}: Permission denied`);
	} else {
		console.log(err);
	}
};

var _processDirectory = function (dirPath) {
	fs.readdir(dirPath, function (err, files) {
		if (err) {
			_printError(dirPath, err);
		} else {
			var filesList = files.map((f) => {
				// Skip listings and hidden files
				if (f === listFileName || f[0] === '.') {
					return null;
				}
				isDirectory(`${dirPath}/${f}`, function (err, dir) {
					if (err) {
						_printError(dirPath, err);
					} else if (dir) {
						_processDirectory(path.join(dirPath, f));
					}
				});
				try {
					return isDirectory.sync(`${dirPath}/${f}`) ? 
						`${dirPrefix}:${f}` : `${filePrefix}:${f}`;
				} catch (ex) {
					return `${otherPrefix}:${f}`;
				}
			}).filter(f => { return f; }).sort();
			fs.writeFile(`${dirPath}/${listFileName}`, filesList.join('\n'), 
					function (err) {
						if (err) {
							_printError(dirPath, err);
						} else {
							console.info(`Directory '${dirPath}' is done!`);
						}
					});
		}
	});
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
	.option('-f, --file-prefix <prefix_letter>', 'Set a prifix letter for file entries', setFilePrefix)
	.option('-d, --dir-prefix <prefix_letter>', 'Set a prifix letter for directory entries', setDirPrefix)
	.parse(process.argv);

var _rootDirPath = process.argv[2];
if (!_rootDirPath) {
	console.error('Missing argument');
} else {
	fs.stat(_rootDirPath, function(err, stats) {
		if (!stats || !stats.isDirectory()) {
			console.error('<directory path> has to point to a valid directory');
		} else {
			_processDirectory(_rootDirPath);
		}
	});
}


