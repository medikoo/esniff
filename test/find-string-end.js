'use strict';

module.exports = function (t, a) {
	var source = JSON.stringify('raz"dwa\'\'\\\\""\""elo\n\tsdfsdf\u3423sdfefe');
	a(t(source), source.length - 1);
	a(t(source + 'raz'), source.length - 1);
};
