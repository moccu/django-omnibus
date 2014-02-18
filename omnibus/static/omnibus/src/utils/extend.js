define(function() {
	/**
	 * This function copies all properties into an target-object (target) from
	 * all given source-objects (source). Target and source are given as
	 * parameters. The first param is used as target. If more than one source
	 * contain the same property, the property of the last given param is
	 * taken.
	 *
	 * This function does't perform a deep copy of all properties.
	 *
	 * The name and functionality is reimplementation on the
	 * extend()-function of the jQuery Library.
	 *
	 * This function is used to utilize prototype based inheritance.
	 *
	 * @function extend
	 * @param {Object} target
	 *		the target-object
	 * @param {...Object} sources
	 *		the source-objects
	 * @returns {Object}
	 *		is the target-object with all properties from the source-objects.
	 */
	function extend() {
		var
			target = Array.prototype.shift.call(arguments),
			source,
			key
		;

		if (typeof target === 'object' && arguments.length > 0) {
			while (arguments.length > 0) {
				source = Array.prototype.shift.call(arguments);
				if (source) {
					for (key in source) {
						target[key] = source[key];
					}
				}
			}
		}

		return target;
	}

	return extend;
});
