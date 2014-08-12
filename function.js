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
	return function (code) {
		code = String(value(code));
		return esniff(code, function (char, i, previous) {
			if (char !== name[0]) return next();
			if (previous === '.') return next();
			if (code.indexOf(name, i) !== i) return next();
			next(l);
			i = esniff.index;
			if (code[i] !== '(') return resume();
			return collectNest();
		});
	};
};
