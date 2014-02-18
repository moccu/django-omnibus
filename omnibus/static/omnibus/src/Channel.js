define(['./utils/extend', './utils/proxy', './Constants', './EventBus', './EventTypes'], function(extend, proxy, Constants, EventBus, EventTypes) {
	/**
	 * An instance of this class represents a channel inside a websocket
	 * connection. The instance will be created through the websocket connection
	 * itself.
	 *
	 * On instantiation the channel will automaticly subscribe to its remote.
	 *
	 * @constructor Channel
	 * @extends EventBus
	 * @param {String} name
	 *		is the name of the created channel
	 * @param {Connection} connection
	 *		is the connection to communicate with the remote
	 */
	var Channel = function(name, connection) {
		// Call super constructor of EventBus class:
		EventBus.call(this);

		this._closed = true;
		this._subscribed = false;
		this._name = name;
		this._connection = connection;
		this._subscribe();
	};

	// Extend the Channel protoype by inherit from EventBus and
	// with functions and properties:
	extend(Channel.prototype, EventBus.prototype, {

		/**
		 * Initiates the initial channel subscription at the remote.
		 *
		 * @private
		 * @instance
		 * @function _subscribe
		 * @memberof Channel
		 */
		_subscribe: function() {
			if (!this.isSubscribed()) {
				this._connection.sendCommandMessage(Constants.SUBSCRIBE, this._name);
			}
		},

		/**
		 * Returns the name which is used to open this channel.
		 *
		 * @instance
		 * @function getName
		 * @memberof Channel
		 * @returns {String}
		 *		is the name of the channel instance
		 */
		getName: function() {
			return this._name;
		},

		/**
		 * Returns whether the subscription is already done.
		 *
		 * @instance
		 * @function isSubscribed
		 * @memberof Channel
		 * @returns {Boolean}
		 *		a boolean that defines whether this subscription was successful
		 */
		isSubscribed: function() {
			return this._subscribed || false;
		},

		/**
		 * Handles a subscription response from the connection. This function
		 * is called from the connection self.
		 *
		 * Will be called by connection.
		 *
		 * @private
		 * @instance
		 * @function handleSubscribed
		 * @memberof Channel
		 * @fires CHANNEL_SUBSCRIBED
		 */
		_handleSubscribed: function() {
			if (!this._subscribed) {
				this._closed = false;
				this._subscribed = true;
				this.trigger(EventTypes.CHANNEL_SUBSCRIBED);
			}
		},

		/**
		 * Handles a unsubscription response from the connection. This function
		 * is called from the connection self.
		 *
		 * Will be called by connection.
		 *
		 * @private
		 * @instance
		 * @function handleUnsubscribed
		 * @memberof Channel
		 * @fires CHANNEL_SUBSCRIBED
		 */
		_handleUnsubscribed: function() {
			if (this._subscribed) {
				this._subscribed = false;
				this.trigger(EventTypes.CHANNEL_UNSUBSCRIBED);
			}
		},

		/**
		 * Sends a message containing type and optional data through this
		 * channel instance.
		 *
		 * @instance
		 * @function send
		 * @memberof Channel
		 * @param {String} type
		 *		is the name of the channel type which should be handled by
		 *		the remote
		 * @param {*} [data]
		 *		is additional data which can be send with the message
		 * @retuns {Boolean}
		 *		indicates wether the message was send or not.
		 */
		send: function(type, data) {
			if (this._subscribed) {
				return this._connection.sendChannelMessage(this._name, type, data);
			}

			return false;
		},

		/**
		 * This function triggers an unsubscription from the connection.
		 * Finally it closes the channel from the remote and calls destroy()
		 * indirectly.
		 *
		 * @instance
		 * @function close
		 * @memberof Channel
		 */
		close: function() {
			if (!this.isDestroyed() && !this._closed) {
				this._connection.closeChannel(this);
			}
		},

		/**
		 * This hanles all necessary tasks to be done when closing this channel.
		 *
		 * @private
		 * @instance
		 * @function _handleClose
		 * @memberof Channel
		 * @fires CHANNEL_CLOSE
		 * @returns {Boolean}
		 *		indicates if the channel could be closed
		 */
		_handleClose: function() {
			if (!this.isDestroyed() && !this._closed) {
				this._closed = true;
				this.trigger(EventTypes.CHANNEL_CLOSE);
				return true;
			}

			return false;
		},

		/**
		 * This function destroys any property of the instance. All registered
		 * eventhandlers will be removed.
		 *
		 * Will be called by connection.
		 *
		 * @private
		 * @instance
		 * @function _destroy
		 * @memberof Channel
		 * @fires CHANNEL_DESTROY
		 */
		_destroy: function() {
			// Detect if the channel destroy() was called before...
			// ...this can happen when the destroy function is call through the
			// instance itself. The implementation of the connection itself
			// of the closeChannel() function ensures that this channel
			// will be destroyed.
			if (!this.isDestroyed()) {
				this._destroyCalledBefore = true;
				this.trigger(EventTypes.CHANNEL_DESTROY);

				this._name = undefined;
				this._subscribed = undefined;
				this._connection = undefined;
				this.off();

				delete(this._name);
				delete(this._subscribed);
				delete(this._connection);
				return true;
			}

			return false;
		},

		/**
		 * Returns whether the channel is destroyed before.
		 *
		 * @instance
		 * @function isDestroyed
		 * @memberof Channel
		 * @return {Channel}
		 *		defines if the channel is destroyed.
		 */
		isDestroyed: function() {
			return this._destroyCalledBefore || false;
		}
	});

	return Channel;
});
