define(function() {

	/**
	 * Defines fixed values used in code.
	 *
	 * @namespace Constants
	 */
	var Constants = {

		/**
		 * Is the indicator which defines a command message.
		 *
		 * @constant
		 * @type {String}
		 * @default
		 * @memberof Constants
		 */
		INDICATOR: '!',

		/**
		 * Is the delimiter which seperates command- or channel-name from the
		 * message payload.
		 *
		 * @constant
		 * @type {String}
		 * @default
		 * @memberof Constants
		 */
		DELIMITER: ':',

		/**
		 * Is the commandname that specifies an authentication.
		 *
		 * @constant
		 * @type {String}
		 * @default
		 * @memberof Constants
		 */
		AUTHENTICATE: 'authenticate',

		/**
		 * Is the commandname that specifies a subscription.
		 *
		 * @constant
		 * @type {String}
		 * @default
		 * @memberof Constants
		 */
		SUBSCRIBE: 'subscribe',

		/**
		 * Is the commandname that specifies a unsubscription.
		 *
		 * @constant
		 * @type {String}
		 * @default
		 * @memberof Constants
		 */
		UNSUBSCRIBE: 'unsubscribe'
	};

	return Constants;
});
