'use strict';

var readFile = require('fs').readFile
  , ast      = require('./_ast-index')

  , pg = __dirname + '/__playground';

module.exports = function (t, a, d) {
	readFile(pg + '/index.js', 'utf-8', function (err, str) {
		var plainR = [], astR;
		if (err) {
			d(err);
			return;
		}
		t(str, function (char, i, previous, line, column) {
			var j = i;
			if (char !== 'f') return t.$common;
			if (previous === '.') return t.$common;
			if (str[i] !== 'o') return t.$common;
			if (str[++i] !== 'o') return t.$common;
			while (t.wsSet[str[++i]]) continue; //jslint: ignore
			if (str[i] !== '.') return t.$common;
			while (t.wsSet[str[++i]]) continue; //jslint: ignore
			if (str[i] !== 'b') return t.$common;
			if (str[++i] !== 'a') return t.$common;
			if (str[++i] !== 'r') return t.$common;
			while (t.wsSet[str[++i]]) continue; //jslint: ignore
			if (str[i] !== '(') return t.$common;
			t.move(i);
			plainR.push({ point: i + 2, line: line, column: column + (i - j) + 2 });
			return t.$common;
		});
		astR = ast(str);
		a(plainR.length, astR.length, "Length");
		astR.forEach(function (val, i) { a.deep(plainR[i], val, i); });
		d();
	});
};
