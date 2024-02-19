"use strict";

var readFile = require("fs").readFile
  , ast      = require("./_ast-index")
  , pg       = __dirname + "/__playground";

module.exports = function (t, a, d) {
	readFile(pg + "/index.js", "utf-8", function (err, str) {
		if (err) {
			d(err);
			return;
		}
		var plainR = t(str, function (emitter) {
			emitter.on("trigger:f", function (accessor) {
				if (accessor.previousToken === ".") return;
				if (!accessor.skipCodePart("foo")) return;
				accessor.skipWhitespace();
				if (!accessor.skipCodePart(".")) return;
				accessor.skipWhitespace();
				if (!accessor.skipCodePart("bar")) return;
				accessor.skipWhitespace();
				accessor.collectScope();
			});
		});
		var astR = ast(str);
		a(plainR.length, astR.length, "Length");
		astR.forEach(function (val, i) {
			if (!plainR[i]) return;
			delete plainR[i].raw;
			a.deep(plainR[i], val, i);
		});
		d();
	});
};
