'use strict';

module.exports = function (t, a) {
	var code = ' /* sdfsdfs */  // fefefefe\n  /*sdfsd */foo() /* amr */ bar()';
	a(code.slice(t(code)), 'foo() /* amr */ bar()');
	a(code.slice(t(code, 14)), 'foo() /* amr */ bar()');
	a(code.slice(t(code, 45)), 'bar()');
};
