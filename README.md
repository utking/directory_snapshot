# directory_snapshot

Script traversing a directory and writing its content into a listing file. Using recursion, creates a listing file in a specified directory and each subdirectory in it.

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

// compare a snapshot for a current directory with a previously create one
$ node index.js ./ -c

// create snapshot for a current directory in a separate-listing mode
$ node index.js ./ -s

```

## License

This code uses the [ISC License](https://opensource.org/licenses/ISC)
