'use strict';

module.exports = function (t, a) {
	a.deep(t('"raz", "dwa", [\'raz\', \'dwa\'], "trzy"'),
		['"raz"', ' "dwa"', ' [\'raz\', \'dwa\']', ' "trzy"']);
};
