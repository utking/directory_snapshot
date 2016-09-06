# directory_snapshot

Script traversing a directory and writing its content into a 'dir.lst' file. Using recursion, creates a dir.lst file in a specified directory and each subdirectory in it.

## Requirements

* is-directory
* commander

## Installation

```
$ npm install
```

## Usage examples

```
// Show all usage options
$ node index.js -h

// create snapshot for a current directory
$ node index.js ./

// create snapshot for a current directory in a single-listing mode
$ node index.js ./ -s

```

## License

This code uses the [ISC License](https://opensource.org/licenses/ISC)
