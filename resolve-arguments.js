'use strict';

var value  = require('es5-ext/object/valid-value')
  , esniff = require('./')

  , next = esniff.next;

module.exports = function (argumentsString/*, limit*/) {
	var args, fromIndex, limit = arguments[1] || Infinity;
	argumentsString = String(value(argumentsString));
	args = [];
	fromIndex = 0;
	esniff(argumentsString, ',', function (i, previous, nest) {
		if (nest) return next();
		if (args.push(argumentsString.slice(fromIndex, i)) === limit) return;
		fromIndex = i + 1;
		return next();
	});
	if (args.length < limit) args.push(argumentsString.slice(fromIndex));
	return args;
};
