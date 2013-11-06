# esniff
## JavaScript source code scanner

Low footprint, fast code analyzer, which allows you to find all occurencies of given function/method calls without a need to generate full syntax tree.

### Usage

```javascript
var findRequires = require('esniff/function')('require');

findRequires('var x = require(\'foo/bar\')');
// [{ point: 17, column: 17, line: 1, raw: '\'foo/bar\'' }]
```

### Installation
#### npm

In your project path:

	$ npm install esniff

##### Browser

You can easily bundle _esniff_ for browser with [modules-webmake](https://github.com/medikoo/modules-webmake)

## Tests [![Build Status](https://travis-ci.org/medikoo/esniff.png)](https://travis-ci.org/medikoo/esniff)

	$ npm test
