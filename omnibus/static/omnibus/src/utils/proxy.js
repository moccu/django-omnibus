define(function() {
	/**
	 * This function returns a function which executes a given function in
	 * a particular context.
	 *
	 * The name and functionality is reimplementation on the
	 * proxy()-function of the jQuery Library.
	 *
	 * @function proxy
	 * @param {Function} method
	 *		is the function to be executed
	 * @param {Object} context
	 *		is the context of the executed function
	 * @returns {Function}
	 *		is an other function which calls the given function
	 */
	function proxy(method, context) {
		return function() {
			if (typeof method === 'function') {
				method.apply(context, arguments);
			}
		};
	}

	return proxy;
});
