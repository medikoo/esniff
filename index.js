'use strict';

var from         = require('es5-ext/array/from')
  , primitiveSet = require('es5-ext/object/primitive-set')
  , eolSet       = require('./lib/ws-eol')
  , wsSet        = require('./lib/ws')

  , hasOwnProperty = Object.prototype.hasOwnProperty

  , next, move, startCollect, endCollect, collectNest
  , $common, $string, $comment, $multiComment, $regExp

  , str, i, char, line, column, afterWs, previous
  , blocks, nest, tenaryNest, lastBlock, lastTenary, nestedTokens, results
  , callback

  , quote
  , collect, data, nestRelease, token
  , preDeclSet, ambigSet, preExpSet;

// Opens declaration blocks
preDeclSet = primitiveSet.apply(null, from(';{'));
// May open decl block
ambigSet = primitiveSet.apply(null, from(':}'));
// Opens expression blocks
preExpSet = primitiveSet.apply(null, from('=([,<>+-*/%&|^!~?'));

next = function () {
	if (!char) return;
	if (collect) token += char;
	if (!hasOwnProperty.call(wsSet, char)) {
		previous = char;
		++column;
		afterWs = false;
	} else if (hasOwnProperty.call(eolSet, char)) {
		column = 1;
		++line;
		afterWs = true;
	} else {
		afterWs = true;
		++column;
	}
	char = str[i];
	++i;
	return char;
};

move = function (j) {
	if (!char) return;
	if (i >= j) return;
	--j;
	while (i !== j) {
		if (!char) return;
		if (collect) token += char;
		if (!hasOwnProperty.call(wsSet, char)) {
			++column;
		} else if (hasOwnProperty.call(eolSet, char)) {
			column = 1;
			++line;
		} else {
			++column;
		}
		char = str[i];
		++i;
	}
	next();
};

startCollect = function (oldNestRelease) {
	if (token != null) nestedTokens.push([data, token, oldNestRelease]);
	data = { line: line, column: column, point: i };
	token = '';
	collect = true;
};

endCollect = function () {
	var previous;
	data.raw = token;
	results.push(data);
	if (nestedTokens.length) {
		previous = nestedTokens.pop();
		data = previous[0];
		token = previous[1] + token;
		nestRelease = previous[2];
		return;
	}
	collect = false;
	token = null;
	nestRelease = null;
};

collectNest = function () {
	var old = nestRelease;
	nestRelease = nest;
	++nest;
	if (!next()) return $common;
	startCollect(old);
	return $common();
};

$common = function () {
	var prev, val;
	while (char && hasOwnProperty.call(wsSet, char)) next();
	if (char === '.') return $common;
	if ((char === '\'') || (char === '"')) {
		quote = char;
		return $string;
	}
	if (char === '(') {
		++nest;
		return $common;
	}
	if (char === ')') {
		if (nestRelease === --nest) endCollect();
		return $common;
	}
	if (char === '{') {
		++nest;
		if (!previous) val = true;
		else if (preExpSet[previous]) val = false;
		else if ((previous === ':') && lastTenary) val = false;
		else val = true;
		blocks.push(val);
		return $common;
	}
	if (char === '}') {
		if (nestRelease === --nest) {
			nestRelease = null;
			endCollect();
			if (exports.forceStop) {
				i = Infinity;
				return $common;
			}
		}
		lastBlock = blocks.pop();
		return $common;
	}
	if (char === '?') {
		++tenaryNest;
		return $common;
	}
	if (char === ':') {
		if (tenaryNest) {
			--tenaryNest;
			lastTenary = true;
		} else {
			lastTenary = false;
		}
		return $common;
	}
	if (char === '/') {
		prev = previous;
		if (!next()) return $common;
		if (char === '/') return $comment;
		if (char === '*') return $multiComment;
		if (hasOwnProperty.call(preExpSet, prev) ||
				hasOwnProperty.call(preDeclSet, prev)) {
			return $regExp();
		}
		if ((prev === '}') && lastBlock) return $regExp();
		if ((prev === ':') && lastTenary) return $regExp();
		return $common();
	}
	if (previous) {
		if (!afterWs && !hasOwnProperty.call(preExpSet, previous) &&
				!hasOwnProperty.call(preDeclSet, previous) &&
				!hasOwnProperty.call(ambigSet, previous)) {
			return $common;
		}
	}

	return callback(char, i, previous, line, column);
};

$string = function () {
	if (char === '\\') {
		next();
		return $string;
	}
	if (char === quote) return $common;
	return $string;
};

$comment = function () {
	if (hasOwnProperty.call(eolSet, char)) return $common;
	return $comment;
};

$multiComment = function () {
	if (char !== '*') return $multiComment;
	if (str[i] !== '/') return $multiComment;
	next();
	return $common;
};

$regExp = function () {
	if (char === '\\') {
		next();
		return $regExp;
	}
	if (char === '/') return $common;
	return $regExp;
};

module.exports = exports = function (code, cb) {
	var state;

	str = String(code);
	i = 1;
	char = str[0];
	line = 1;
	column = 1;
	afterWs = false;
	previous = null;
	blocks = [];
	nest = tenaryNest = 0;
	lastBlock = lastTenary = false;
	nestedTokens = [];
	results = [];
	callback = cb;
	exports.forceStop = false;
	state = $common;
	while (char) {
		state = state();
		next();
	}
	return results;
};

exports.$common = $common;
exports.collectNest = collectNest;
exports.wsSet = wsSet;
exports.move = move;
