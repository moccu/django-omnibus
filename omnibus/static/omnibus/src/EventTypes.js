define(function() {

	/**
	 * Defines all events which will be thrown by the library.
	 *
	 * @namespace EventTypes
	 */
	var EventTypes = {
		/**
		 * Notifies about the current channel subscription state.
		 *
		 * @constant
		 * @event CHANNEL_SUBSCRIBED
		 * @type Event
		 * @memberof EventTypes
		 */
		CHANNEL_SUBSCRIBED: 'subscribed',

		/**
		 * Notifies about the current channel unsubscription state.
		 *
		 * @constant
		 * @event CHANNEL_UNSUBSCRIBED
		 * @type Event
		 * @memberof EventTypes
		 */
		CHANNEL_UNSUBSCRIBED: 'unsubscribed',

		/**
		 * Notifies that the channel instance will be closed.
		 *
		 * @constant
		 * @event CHANNEL_CLOSE
		 * @type Event
		 * @memberof EventTypes
		 */
		CHANNEL_CLOSE: 'close',

		/**
		 * Notifies that the channel instance will be destroyed and
		 * isn't available further usage.
		 *
		 * @constant
		 * @event CHANNEL_DESTROY
		 * @type Event
		 * @memberof EventTypes
		 */
		CHANNEL_DESTROY: 'destroy',

		/**
		 * Notifies about an established connenction.
		 *
		 * @constant
		 * @event CONNECTION_CONNECTED
		 * @type Event
		 * @memberof EventTypes
		 */
		CONNECTION_CONNECTED: 'connected',

		/**
		 * Notifies about an (may be accidentally) closed connection.
		 *
		 * @constant
		 * @event CONNECTION_DISCONNECTED
		 * @type Event
		 * @memberof EventTypes
		 */
		CONNECTION_DISCONNECTED: 'disconnected',

		/**
		 * Notifies about a successful identification.
		 *
		 * @constant
		 * @event CONNECTION_AUTHENTICATED
		 * @type Event
		 * @memberof EventTypes
		 */
		CONNECTION_AUTHENTICATED: 'authenticated',

		/**
		 * Notifies about an occurred error throug the websocket implementation.
		 *
		 * @constant
		 * @event CONNECTION_ERROR
		 * @type Event
		 * @memberof EventTypes
		 */
		CONNECTION_ERROR: 'error'
	};

	return EventTypes;
});
