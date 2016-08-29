/**
 * @author UtkinG <utking@mail.ru>
 * Traverse a directory and write its content into a dir.lst file.
 *
 */

const fs = require('fs');
const path = require('path');
const isDirectory = require('is-directory');

const listFileName = 'dir.lst';

var _rootDirPath = process.argv[2];
if (!_rootDirPath) {
	console.error('Missing argument.');
	console.info(`Usage: ${process.argv[0]} ${process.argv[1]} <directory path>`);
}

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
						`D:${f}` : `F:${f}`;
				} catch (ex) {
					return `X:${f}`;
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
}

fs.stat(_rootDirPath, function(err, stats) {
	if (!stats || !stats.isDirectory()) {
		console.error('<directory path> has to point to a valid directory');
	} else {
		_processDirectory(_rootDirPath);
	}
});


