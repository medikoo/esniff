'use strict';

var from         = require('es5-ext/array/from')
  , primitiveSet = require('es5-ext/object/primitive-set')
  , d            = require('d')
  , eolSet       = require('./lib/ws-eol')
  , wsSet        = require('./lib/ws')

  , hasOwnProperty = Object.prototype.hasOwnProperty

  , move, startCollect, endCollect, collectNest
  , $ws, $common, $string, $comment, $multiComment, $regExp

  , str, i, char, line, columnIndex, afterWs, previousChar
  , nest, nestedTokens, results
  , callback

  , quote
  , collectIndex, data, nestRelease
  , preDeclSet, ambigSet, preExpSet;

// Opens declaration blocks
preDeclSet = primitiveSet.apply(null, from(';{'));
// May open decl block
ambigSet = primitiveSet.apply(null, from(':}'));
// Opens expression blocks
preExpSet = primitiveSet.apply(null, from('=([,<>+-*/%&|^!~?'));

move = function (j) {
	if (!char) return;
	if (i >= j) return;
	while (i !== j) {
		if (!char) return;
		if (hasOwnProperty.call(wsSet, char)) {
			if (hasOwnProperty.call(eolSet, char)) {
				columnIndex = i;
				++line;
			}
		} else {
			previousChar = char;
		}
		char = str[++i];
	}
};

startCollect = function (oldNestRelease) {
	if (collectIndex != null) nestedTokens.push([data, collectIndex, oldNestRelease]);
	data = { point: i + 1, line: line, column: i + 1 - columnIndex };
	collectIndex = i;
};

endCollect = function () {
	var previous;
	data.raw = str.slice(collectIndex, i);
	results.push(data);
	if (nestedTokens.length) {
		previous = nestedTokens.pop();
		data = previous[0];
		collectIndex = previous[1];
		nestRelease = previous[2];
		return;
	}
	data = null;
	collectIndex = null;
	nestRelease = null;
};

collectNest = function () {
	var old = nestRelease;
	nestRelease = nest;
	++nest;
	move(i + 1);
	startCollect(old);
	return $ws;
};

$common = function () {
	if ((char === '\'') || (char === '"')) {
		quote = char;
		char = str[++i];
		return $string;
	}
	if (char === '(') {
		++nest;
	} else if (char === ')') {
		if (nestRelease === --nest) endCollect();
	} else if (char === '{') {
		++nest;
	} else if (char === '}') {
		if (nestRelease === --nest) endCollect();
	} else if (char === '/') {
		if (hasOwnProperty.call(preExpSet, previousChar) ||
				hasOwnProperty.call(preDeclSet, previousChar) || (previousChar === '}')) {
			char = str[++i];
			return $regExp;
		}
	}
	if (previousChar && !afterWs && !hasOwnProperty.call(preExpSet, previousChar) &&
			!hasOwnProperty.call(preDeclSet, previousChar) &&
			!hasOwnProperty.call(ambigSet, previousChar)) {
		previousChar = char;
		char = str[++i];
		return $ws;
	}

	return callback(char, i, previousChar, line, i - columnIndex);
};

$comment = function () {
	while (true) {
		if (!char) return;
		if (hasOwnProperty.call(eolSet, char)) {
			columnIndex = i + 1;
			++line;
			return;
		}
		char = str[++i];
	}
};

$multiComment = function () {
	while (true) {
		if (!char) return;
		if (char === '*') {
			char = str[++i];
			if (!char) return;
			if (char === '/') return;
		}
		if (hasOwnProperty.call(eolSet, char)) {
			columnIndex = i + 1;
			++line;
		}
		char = str[++i];
	}
};

$ws = function () {
	var next;
	while (true) {
		if (!char) return;
		if (hasOwnProperty.call(wsSet, char)) {
			afterWs = true;
			if (hasOwnProperty.call(eolSet, char)) {
				columnIndex = i + 1;
				++line;
			}
		} else if (char === '/') {
			next = str[i + 1];
			if (next === '/') {
				char = str[i += 2];
				afterWs = true;
				$comment();
			} else if (next === '*') {
				char = str[i += 2];
				afterWs = true;
				$multiComment();
			} else {
				break;
			}
		} else {
			break;
		}
		char = str[++i];
	}
	return $common;
};

$string = function () {
	while (true) {
		if (!char) return;
		if (char === quote) {
			char = str[++i];
			previousChar = quote;
			return $ws;
		}
		if (char === '\\') {
			if (hasOwnProperty.call(eolSet, str[++i])) {
				columnIndex = i + 1;
				++line;
			}
		}
		char = str[++i];
	}
};

$regExp = function () {
	while (true) {
		if (!char) return;
		if (char === '/') {
			previousChar = '/';
			char = str[++i];
			return $ws;
		}
		if (char === '\\') ++i;
		char = str[++i];
	}
};

module.exports = exports = function (code, cb) {
	var state;

	str = String(code);
	i = 0;
	char = str[i];
	line = 1;
	columnIndex = 0;
	afterWs = false;
	previousChar = null;
	nest = 0;
	nestedTokens = [];
	results = [];
	callback = cb;
	exports.forceStop = false;
	state = $ws;
	while (state) state = state();
	return results;
};

Object.defineProperties(exports, {
	$ws: d($ws),
	$common: d($common),
	collectNest: d(collectNest),
	move: d(move),
	index: d.gs(function () { return i; }),
	line: d.gs(function () { return line; }),
	columnIndex: d.gs(function () { return columnIndex; }),
	next: d(function (step) {
		if (!char) return;
		move(i + (step || 1));
		return $ws();
	}),
	resume: d(function () { return $common; })
});
