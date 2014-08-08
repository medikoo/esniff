'use strict';

var traverse = require('./')

  , hasOwnProperty = Object.prototype.hasOwnProperty

  , $common = traverse.$common
  , collectNest = traverse.collectNest
  , wsSet = traverse.wsSet
  , move = traverse.move;

module.exports = function (name) {
	var l;
	name = String(name);
	l = name.length;
	return function (code) {
		code = String(code);
		return traverse(code, function (char, i, previous) {
			var j = 0;
			if (char !== name[j]) return $common;
			if (previous === '.') return $common;
			while (++j !== l) {
				if (code[i] !== name[j]) return $common;
				++i;
			}
			while (hasOwnProperty.call(wsSet, code[i])) ++i;
			if (code[i] !== '(') return $common;
			move(i + 1);
			return collectNest();
		});
	};
};
