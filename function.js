"use strict";

var ensureString = require("type/string/ensure")
  , isValue      = require("type/value/is")
  , esniff       = require("./")
  , next         = esniff.next
  , resume       = esniff.resume
  , collectNest  = esniff.collectNest;

module.exports = function (name/*, options*/) {
	var options = Object(arguments[1])
	  , asProperty = options.asProperty
	  , asPlain = isValue(options.asPlain) ? options.asPlain : true;
	var length, names;
	name = ensureString(name);
	names = name.split(".").map(function (prop) {
		prop = prop.trim();
		if (!prop) throw new TypeError(name + " is not valid function name");
		return prop;
	});
	length = names.length;
	return function (code) {
		code = ensureString(code);
		return esniff(code, names[0][0], function (i, previous) {
			var j = 0, prop;
			if (previous === ".") {
				if (!asProperty) return next();
			} else if (!asPlain) {
				return next();
			}
			while (j < length) {
				prop = names[j];
				if (code.indexOf(prop, i) !== i) return next();
				next(prop.length);
				i = esniff.index;
				++j;
				if (j < length) {
					if (code[i] !== ".") return resume();
					next();
					i = esniff.index;
				}
			}
			if (code[i] !== "(") return resume();
			return collectNest();
		});
	};
};
