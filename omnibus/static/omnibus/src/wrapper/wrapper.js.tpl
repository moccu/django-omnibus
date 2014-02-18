/*!
 * Django-Omnibus
 * Django/JavaScript WebSocket Connections
 *
 * @version <%= version %>
 * @author <%= author.name %> <<%= author.url %>>
<% for (var k in contributors) { %> * @author <%= contributors[k].name %> <<%= contributors[k].url %>>
<% } %> */

/* The Library is designed to use as an AMD Module, a CommonJS Module or with
 * plain JavaScript. To get this working the following lines are taken from
 * the Universal Module Definitions pattens for JavaScript:
 * https://github.com/umdjs/umd/blob/master/returnExports.js */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory); // retun as AMD Module
	} else if (typeof exports === 'object') {
		module.exports = factory(); // return as CommonJS
	} else {
		root.Omnibus = factory(); // return as plain JS, root === window
	}
}(this, function () {

<%= content %>

	return Connection;
}));
