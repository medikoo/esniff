'use strict';

var esprima = require('esprima')

  , isArray = Array.isArray, keys = Object.keys
  , walker;

walker = function (ast) {
	if (!ast || (typeof ast !== 'object')) return;
	if (isArray(ast)) {
		ast.forEach(walker, this);
		return;
	}
	keys(ast).forEach(function (key) {
		if (key !== 'range') walker.call(this, ast[key]);
	}, this);
	if (!ast.type) return;
	if ((ast.type === 'MemberExpression') &&
			(ast.object.name === 'foo')) {
		this.deps[ast.property.name] = true;
	}
};

module.exports = function (code) {
	var ctx = { code: code, deps: Object.create(null) };
	walker.call(ctx, esprima.parse(code, { range: true, loc: true }));
	return Object.keys(ctx.deps);
};
