'use strict';

var value = require('es5-ext/object/valid-value');

module.exports = function (str) {
	var quote, i, char;
	str = String(value(str));
	i = 0;
	quote = str[i];
	if ((quote !== '\'') && (quote !== '"')) {
		throw new TypeError("Source code doesn\'t start with string");
	}
	do {
		char = str[++i];
		while (char === '\\') char = str[i += 2];
		if (!char) throw new TypeError("Non terminated string");
	} while (char !== quote);
	return i;
};
