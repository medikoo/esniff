'use strict';

var value  = require('es5-ext/object/valid-value')
  , esniff = require('./')

  , next = esniff.next;

module.exports = function (code/*, fromIndex*/) {
	var args, fromIndex;
	code = String(value(code)).slice(arguments[1] || 0);
	args = [];
	fromIndex = 0;
	esniff(code, ',', function (i, previous, nest) {
		if (nest) return next();
		args.push(code.slice(fromIndex, i));
		fromIndex = i + 1;
		return next();
	});
	args.push(code.slice(fromIndex));
	return args;
};
