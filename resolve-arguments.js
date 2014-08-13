'use strict';

var value  = require('es5-ext/object/valid-value')
  , esniff = require('./')

  , next = esniff.next;

module.exports = function (argumentsString) {
	var args, fromIndex;
	argumentsString = String(value(argumentsString)).slice();
	args = [];
	fromIndex = 0;
	esniff(argumentsString, ',', function (i, previous, nest) {
		if (nest) return next();
		args.push(argumentsString.slice(fromIndex, i));
		fromIndex = i + 1;
		return next();
	});
	args.push(argumentsString.slice(fromIndex));
	return args;
};
