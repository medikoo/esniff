'use strict';

var value  = require('es5-ext/object/valid-value')
  , esniff = require('./')

  , next = esniff.next
  , resume = esniff.resume
  , collectNest = esniff.collectNest;

module.exports = function (name) {
	var l;
	name = String(value(name));
	l = name.length;
	if (!l) throw new TypeError(name + " is not valid function name");
	return function (code) {
		code = String(value(code));
		return esniff(code, name[0], function (char, i, previous) {
			if (previous === '.') return next();
			if (code.indexOf(name, i) !== i) return next();
			next(l);
			i = esniff.index;
			if (code[i] !== '(') return resume();
			return collectNest();
		});
	};
};
