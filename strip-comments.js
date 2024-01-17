"use strict";

var ensureString = require("type/string/ensure")
  , repeat       = require("es5-ext/string/#/repeat")
  , parse        = require("./lib/parse-comments");

module.exports = exports = function (code/*, options*/) {
	var options = Object(arguments[1]), result, comments, i;

	code = ensureString(code);
	comments = parse(code);

	if (!comments.length) return code;
	i = 0;
	result = "";
	comments.forEach(function (range) {
		result += code.slice(i, range[0]);
		if (options.preserveLocation) result += repeat.call(" ", range[1] - range[0]);
		i = range[1];
	});
	result += code.slice(i);
	return result;
};
