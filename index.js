"use strict";

var ensureString        = require("type/string/ensure")
  , isValue             = require("type/value/is")
  , ensurePlainFunction = require("type/plain-function/ensure")
  , from                = require("es5-ext/array/from")
  , primitiveSet        = require("es5-ext/object/primitive-set")
  , d                   = require("d")
  , eolSet              = require("./lib/ws-eol")
  , wsSet               = require("./lib/ws")
  , objHasOwnProperty   = Object.prototype.hasOwnProperty
  , preRegExpSet        = primitiveSet.apply(null, from(";{=([,<>+-*/%&|^!~?:}"))
  , nonNameSet          = primitiveSet.apply(null, from(";{=([,<>+-*/%&|^!~?:})].`"));

var move, startCollect, endCollect, collectNest, $ws, $common, $string, $comment, $multiComment
  , $regExp, $template, index, char, line, columnIndex, afterWs, previousChar, nest, nestedTokens
  , results, userCode, userTriggerChar, isUserTriggerOperatorChar, userCallback, quote, collectIndex
  , data, nestRelease, handleEol, templateContextLength, templateContext;

handleEol = function () {
	if (char === "\r" && userCode[index + 1] === "\n") ++index;
	columnIndex = index + 1;
	++line;
};

move = function (j) {
	if (!char) return;
	if (index >= j) return;
	while (index < j) {
		if (!char) return;
		if (objHasOwnProperty.call(wsSet, char)) {
			if (objHasOwnProperty.call(eolSet, char)) handleEol();
		} else {
			previousChar = char;
		}
		char = userCode[++index];
	}
};

startCollect = function (oldNestRelease) {
	var isNewLine = objHasOwnProperty.call(eolSet, userCode[index]);
	if (isValue(collectIndex)) nestedTokens.push([data, collectIndex, oldNestRelease]);
	data = {
		point: index + 1,
		line: isNewLine ? line + 1 : line,
		column: isNewLine ? 0 : index + 1 - columnIndex
	};
	collectIndex = index;
};

endCollect = function () {
	var previous;
	data.raw = userCode.slice(collectIndex, index);
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
	move(index + 1);
	startCollect(old);
	return $ws;
};

$common = function () {
	if (char === "'" || char === "\"") {
		quote = char;
		char = userCode[++index];
		return $string;
	}
	if (char === "`") {
		char = userCode[++index];
		return $template;
	}
	if (char === "(" || char === "{" || char === "[") {
		++nest;
	} else if (char === ")" || char === "}" || char === "]") {
		if (nestRelease === --nest) endCollect();
		if (char === "}") {
			templateContextLength = templateContext.length;
			if (templateContextLength && templateContext[templateContextLength - 1] === nest + 1) {
				templateContext.pop();
				char = userCode[++index];
				return $template;
			}
		}
	} else if (char === "/") {
		if (objHasOwnProperty.call(preRegExpSet, previousChar)) {
			char = userCode[++index];
			return $regExp;
		}
	}
	if (
		char !== userTriggerChar ||
		// Exclude cases when trigger char is operator char
		// (as it cannot be the continuation of name we're in context of	)
		(!isUserTriggerOperatorChar &&
			// Exclude cases when trigger char is not preceded by whitespace
			// and previous char is not operator char (we're in middle of ongoing word token)
			!afterWs &&
			previousChar &&
			!objHasOwnProperty.call(nonNameSet, previousChar))
	) {
		previousChar = char;
		char = userCode[++index];
		return $ws;
	}

	return userCallback(index, previousChar, nest);
};

$comment = function () {
	while (char) {
		if (objHasOwnProperty.call(eolSet, char)) {
			handleEol();
			return;
		}
		char = userCode[++index];
	}
};

$multiComment = function () {
	while (char) {
		if (char === "*") {
			char = userCode[++index];
			if (char === "/") return;
			continue;
		}
		if (objHasOwnProperty.call(eolSet, char)) handleEol();
		char = userCode[++index];
	}
};

$ws = function () {
	afterWs = false;
	while (char) {
		if (objHasOwnProperty.call(wsSet, char)) {
			afterWs = true;
			if (objHasOwnProperty.call(eolSet, char)) handleEol();
		} else if (char === "/") {
			var next = userCode[index + 1];
			if (next === "/") {
				char = userCode[(index += 2)];
				afterWs = true;
				$comment();
			} else if (next === "*") {
				char = userCode[(index += 2)];
				afterWs = true;
				$multiComment();
			} else {
				break;
			}
		} else {
			break;
		}
		char = userCode[++index];
	}
	if (!char) return null;
	return $common;
};

$string = function () {
	while (char) {
		if (char === quote) {
			char = userCode[++index];
			previousChar = quote;
			return $ws;
		}
		if (char === "\\") {
			if (objHasOwnProperty.call(eolSet, userCode[++index])) handleEol();
		}
		char = userCode[++index];
	}
	return null;
};

$regExp = function () {
	while (char) {
		if (char === "/") {
			previousChar = "/";
			char = userCode[++index];
			return $ws;
		}
		if (char === "\\") ++index;
		char = userCode[++index];
	}
	return null;
};

$template = function () {
	while (char) {
		if (char === "`") {
			char = userCode[++index];
			previousChar = "`";
			return $ws;
		}
		if (char === "$") {
			if (userCode[index + 1] === "{") {
				char = userCode[(index += 2)];
				previousChar = "{";
				templateContext.push(++nest);
				return $ws;
			}
		}
		if (char === "\\") {
			if (objHasOwnProperty.call(eolSet, userCode[++index])) handleEol();
		}
		char = userCode[++index];
	}
	return null;
};

module.exports = exports = function (code, triggerChar, callback) {
	var state;

	userCode = ensureString(code);
	userTriggerChar = ensureString(triggerChar);
	if (userTriggerChar.length !== 1) {
		throw new TypeError(userTriggerChar + " should be one character long string");
	}
	userCallback = ensurePlainFunction(callback);
	isUserTriggerOperatorChar = objHasOwnProperty.call(nonNameSet, userTriggerChar);
	index = 0;
	char = userCode[index];
	line = 1;
	columnIndex = 0;
	afterWs = false;
	previousChar = null;
	nest = 0;
	nestedTokens = [];
	results = [];
	templateContext = [];
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
	index: d.gs(function () { return index; }),
	line: d.gs(function () { return line; }),
	nest: d.gs(function () { return nest; }),
	columnIndex: d.gs(function () { return columnIndex; }),
	next: d(function (step) {
		if (!char) return null;
		move(index + (step || 1));
		return $ws();
	}),
	resume: d(function () { return $common; })
});
