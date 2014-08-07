'use strict';

var readFile = require('fs').readFile
  , ast      = require('./_ast-function')

  , pg = __dirname + '/__playground';

module.exports = function (t) {
	return {
		Normal: function (a, d) {
			readFile(pg + '/function.js', 'utf-8', function (err, str) {
				var plainR, astR;
				if (err) {
					d(err);
					return;
				}
				plainR = t('require')(str);
				astR = ast(str);
				a(plainR.length, astR.length, "Length");
				astR.forEach(function (val, i) { a.deep(plainR[i], val, i); });
				d();
			});
		},
		"One character name": function (a, d) {
			readFile(pg + '/function.js', 'utf-8', function (err, str) {
				var plainR, astR;
				if (err) {
					d(err);
					return;
				}
				plainR = t('require')(str);
				astR = ast(str);
				a(plainR.length, astR.length, "Length");
				astR.forEach(function (val, i) { a.deep(plainR[i], val, i); });
				d();
			});
		}
	};
};
