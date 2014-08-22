'use strict';

var value  = require('es5-ext/object/valid-value')
  , esniff = require('./')

  , next = esniff.next;

module.exports = function (code/*, limit*/) {
	var expressions, fromIndex, limit = arguments[1] || Infinity;
	code = String(value(code));
	expressions = [];
	fromIndex = 0;
	esniff(code, '+', function (i, previous, nest) {
		if (nest) return next();
		if (expressions.push(code.slice(fromIndex, i)) === limit) return;
		fromIndex = i + 1;
		return next();
	});
	if (expressions.length < limit) expressions.push(code.slice(fromIndex));
	return expressions;
};
