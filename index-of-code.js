'use strict';

var value  = require('es5-ext/object/valid-value')
  , eolSet = require('./lib/ws-eol')
  , wsSet  = require('./lib/ws')

  , hasOwnProperty = Object.prototype.hasOwnProperty

  , $common, $comment, $multiComment, str, i, char;

$common = function () {
	char = str[i];
	if (!char) return;
	while (hasOwnProperty.call(wsSet, char)) {
		char = str[++i];
		if (!char) return;
	}
	if (char === '/') {
		char = str[++i];
		if (!char) return;
		if (char === '/') return $comment;
		if (char === '*') return $multiComment;
	}
};

$comment = function () {
	char = str[++i];
	if (!char) return;
	while (!hasOwnProperty.call(eolSet, char)) {
		char = str[++i];
		if (!char) return;
	}
	++i;
	return $common;
};

$multiComment = function () {
	char = str[++i];
	if (!char) return;
	while (true) {
		while (char === '*') {
			char = str[++i];
			if (!char) return;
			if (char === '/') {
				++i;
				return $common;
			}
		}
		char = str[++i];
		if (!char) return;
	}
	++i;
	return $common;
};

module.exports = function (code/*, fromIndex*/) {
	var state;
	i = arguments[1];
	if (!i || isNaN(i)) i = 0;
	str = String(value(code));
	state = $common;
	while (state) state = state();
	return i;
};
