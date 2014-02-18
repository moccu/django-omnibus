define(['./utils/extend', './utils/proxy', './Constants', './EventBus', './EventTypes', './Channel'], function(extend, proxy, Constants, EventBus, EventTypes, Channel) {

	var
		Defaults = { // Default configuration for a Connection instance.
			ignoreSender: true,
			debug: false,
			autoReconnect: true,
			autoReconnectTimeout: 500
		},
		Connection
	;

	/**
	 * An instance of this class capsules a particular websocket connection
	 * which implements the standard websocket interface. It handles the defined
	 * django-omnibus websocket message format and serves an api to
	 * communicate with the remote.
	 *
	 * @constructor Connection
	 * @extends EventBus
	 * @param {WebSocket|SockJS} transport
	 *		is a constructor of a websocket implementation of the
	 *		standard websocket interface
	 * @param {String} remote
	 *		is the url to remote connection
	 * @param {Object} [options]
	 *		in an object which properties overwrites the default settings
	 */
	Connection = function(transport, remote, options) {
		// Call super constructor of EventBus class:
		EventBus.call(this);

		this._socketOpen = false;
		this._authenticated = false;
		this._identifier = this._getUid();
		this._transport = transport;
		this._remote = remote;
		this._options = extend({}, Defaults, options);
		this._channels = {};
		this._sendQueue = [];
		this._initializeConnection();
	};

	// Extend the Connection protoype by inherit from EventBus and
	// with functions and properties:
	extend(Connection.prototype, EventBus.prototype, {

		/**
		 * This function generates an unique identifier which describes the
		 * connection at the remote.
		 *
		 * @private
		 * @instance
		 * @function _getUid
		 * @memberof Connection
		 * @param {String} [a]
		 *		this parameter is used to recursively call this function to
		 *		generate a unique identifier
		 */
		_getUid: function(a) {
			if (a) {
				return (a ^ Math.random() * 16 >> a / 4).toString(16);
			} else {
				return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, this._getUid);
			}
		},

		/**
		 * This function logs the given message at a given loglevel.
		 *
		 * @private
		 * @instance
		 * @function _log
		 * @memberof Connection
		 */
		_log: function(level, message) {
			if (this._options.debug && window && window.console && typeof window.console.log === 'function') {
				window.console.log('[' + (new Date()).toISOString() + '|' + level + '] ', message);
			}
		},

		/**
		 * This function initializes the connection to the remote.
		 *
		 * @private
		 * @instance
		 * @function _initializeConnection
		 * @memberof Connection
		 */
		_initializeConnection: function() {
			if (!(this._transport instanceof Object)) {
				throw new Error('Provide a Websocket API as constructor argument.');
			}

			if (this._socket) {
				throw new Error('Connection already initialized.');
			}

			this._log('info', 'Connecting');
			this._socket = new this._transport(this._remote);
			this._socket.onopen = proxy(this._onSocketOpen, this);
			this._socket.onclose = proxy(this._onSocketClose, this);
			this._socket.onmessage = proxy(this._onSocketMessage, this);
			this._socket.onerror = proxy(this._onSocketError, this);
		},

		/**
		 * Retuns the unique identifier of this connection which is used to
		 * communicate with the remote.
		 *
		 * @instance
		 * @function getId
		 * @memberof Connection
		 * @returns {String}
		 *		is the unique id
		 */
		getId: function() {
			return this._identifier;
		},

		/**
		 * Returns if the connection is established.
		 *
		 * @instance
		 * @function isConnected
		 * @memberof Connection
		 * @returns {Boolean}
		 *		describes if the instance is connected
		 */
		isConnected: function() {
			return this._socketOpen;
		},

		/**
		 * Returns whether the connection was authenticated at the remote.
		 *
		 * @instance
		 * @function isAuthenticated
		 * @memberof Connection
		 * @returns {Boolean}
		 *		describes if the instance is autheticated
		 */
		isAuthenticated: function() {
			return this._authenticated;
		},

		/**
		 * This function returns a channel with the given name.
		 * When a channel with the same name was opend previously, then it
		 * returns the same channel instance as before. Otherwise it instanciates
		 * a new channel with the given name.
		 *
		 * When a previously returned channel instance is already closed, a
		 * new instance will be generated.
		 *
		 * @instance
		 * @function openChannel
		 * @memberof Connection
		 * @param {String} name
		 *		is the name of the channel instance
		 * @returns {Channel}
		 *		is the opened or already opened channel instance
		 */
		openChannel: function(name) {
			return this.getChannel(name) || this._createChannel(name);
		},

		/**
		 * Checks the channel name and finally creates a channel instance.
		 * The created instance will be registered in this connection.
		 *
		 * @private
		 * @instance
		 * @function _createChannel
		 * @memberof Connection
		 * @param {String} name
		 *		is the name of the channel instance which should be created
		 * @returns {Channel}
		 *		is the created channel instance
		 */
		_createChannel: function(name) {
			if (typeof name !== 'string' || name.length === 0) {
				throw new Error('Channel name must be a valid String.');
			}

			if (name.indexOf(Constants.DELIMITER) > -1 || name.indexOf(Constants.INDICATOR) > -1) {
				throw new Error('Channel name contains invalid characters.');
			}

			var channel = new Channel(name, this);
			this._channels[name] = channel;
			return channel;
		},

		/**
		 * Closes and finally destroys a channel which was opened through this
		 * connenction.
		 *
		 * @instance
		 * @function closeChannel
		 * @memberof Connection
		 * @param {Channel|String} instanceOrName
		 *		is an instance or name of a channel which should be closed
		 */
		closeChannel: function(instanceOrName) {
			var
				result = false,
				instance = instanceOrName
			;

			if (typeof instanceOrName !== 'string' && !(instance instanceof Channel)) {
				throw new Error('To close channel provide channel instance or channel name.');
			}

			if (typeof instanceOrName === 'string') {
				instance = this.getChannel(instanceOrName);
			}

			if (instance instanceof Channel) {
				result = instance._handleClose();
				this.sendCommandMessage(Constants.UNSUBSCRIBE, instance.getName());
			}

			return result;
		},

		/**
		 * Finally removes a channel with the given name from the channel
		 * registration in this connection. When a channel with the same name
		 * is requestet later through any public function such as openChannel
		 * an new instance will be returned.
		 *
		 * @private
		 * @instance
		 * @function _removeChannel
		 * @memberof Connection
		 */
		_removeChannel: function(name) {
			if (typeof name === 'string' && this._channels[name] instanceof Channel) {
				this._channels[name]._destroy();
				this._channels[name] = null;
				delete(this._channels[name]);
			}
		},

		/**
		 * Returns a channel instance which was opend previously through this
		 * connection. If there was not opened a channel with the given name
		 * before the function returns 'undefined'.
		 *
		 * @instance
		 * @function getChannel
		 * @memberof Connection
		 * @param {String} name
		 *		is the name of the channel instance which should be returned
		 * @returns {Channel}
		 *		is an instance of the channel with the given name or 'undefined'
		 */
		getChannel: function(name) {
			return this._channels[name];
		},

		/**
		 * Sends a command to the remote. It ensures the django-omnibus
		 * websocket command-message format.
		 *
		 * @instance
		 * @function sendCommandMessage
		 * @memberof Connection
		 * @param {String} command
		 *		is the command name to be send
		 * @param {String} argument
		 *		is the argument to be send
		 * @param {Boolean} [force]
		 *		forces sending of this command whether the connection
		 *		is autheticated or not.
		 * @returns {Boolean}
		 *		describes if the command was send or is queued to be send
		 *		in the future. If the connection is misconfigured it returns
		 *		'false'.
		 */
		sendCommandMessage: function(command, argument, force) {
			return this._send(Constants.INDICATOR + command + Constants.DELIMITER + argument, force);
		},

		/**
		 * Sends a message through a channel to the remote. It ensures the
		 * django-omnibus websocket message format.
		 *
		 * @instance
		 * @function sendChannelMessage
		 * @memberof Connection
		 * @param {String} channel
		 *		is the name of the channel the message should be send through
		 * @param {String} type
		 *		is the type of the message. It is the identifier for the remote
		 *		implementation to handle the message to be send.
		 * @param {*} [payload]
		 *		is the payload/data which sould be send with this message
		 * @param {Boolean} [force]
		 *		forces sending of this message whether the connection
		 *		is autheticated or not
		 * @returns {Boolean}
		 *		describes if the message was send or is queued to be send
		 *		in the future. If the connection is misconfigured it returns
		 *		'false'.
		 */
		sendChannelMessage: function(channel, type, payload, force) {
			var dumped = JSON.stringify({
				type: type,
				sender: this._identifier,
				payload: payload
			});

			return this._send(channel + Constants.DELIMITER + dumped, force);
		},

		/**
		 * Sends a predefined message (command-message or channel-message) to
		 * the remote. It finally ensures if the connection is created,
		 * connected and successfully autheticated. If those connditions didn't
		 * match, the message will be queued up and flushed later on.
		 *
		 * @private
		 * @instance
		 * @function _send
		 * @memberof Connection
		 * @param {String} message
		 *		is the message to be send.
		 * @param {Boolean} [force]
		 *		forces sending of the message whether the connection
		 *		is autheticated or not.
		 * @returns {Boolean}
		 */
		_send: function(message, force) {
			this._log('debug', 'Out: ' + message);
			if (this._socket && this.isConnected() && (this.isAuthenticated() || force)) {
				this._socket.send(message);
			} else {
				this._sendQueue.push(message);
			}
			return !!this._socket;
		},

		/**
		 * Flushes the send queue when messages previously couldn't be send.
		 *
		 * @private
		 * @instance
		 * @function _flushQueue
		 * @memberof Connection
		 */
		_flushQueue: function() {
			while (this._sendQueue.length > 0) {
				// ToDo: can end up in busy wait / blocking...
				this._send(this._sendQueue.shift());
			}
		},

		/**
		 * Handles incomming command messages and delegates them.
		 * It handles 'authenticate' and 'subscribe' and 'unsubscribe' command
		 * types.
		 *
		 * @private
		 * @instance
		 * @function _handleCommandMessage
		 * @memberof Connection
		 * @param {String} name
		 *		is the name of the command message
		 * @param {Object} message
		 *		is the command message to be handled
		 */
		_handleCommandMessage: function(name, message) {
			switch (name) {
				case Constants.AUTHENTICATE:
					this._handleCommandAuthenticate(message);
					break;
				case Constants.SUBSCRIBE:
					this._handleCommandSubscribe(message);
					break;
				case Constants.UNSUBSCRIBE:
					this._handleCommandUnsubscribe(message);
					break;
			}
		},

		/**
		 * Handles the authentication command message.
		 *
		 * @private
		 * @instance
		 * @function _handleCommandAuthenticate
		 * @memberof Connection
		 * @fires CONNECTION_AUTHENTICATED
		 * @param {Object} message
		 *		is the command message to be handled
		 */
		_handleCommandAuthenticate: function(message) {
			if (message.success) {
				this._authenticated = true;
				this.trigger(EventTypes.CONNECTION_AUTHENTICATED);
				this._flushQueue();
			}
		},

		/**
		 * Handles the channel subscription command message.
		 *
		 * @private
		 * @instance
		 * @function _handleCommandSubscribe
		 * @memberof Connection
		 * @param {Object} message
		 *		is the command message to be handled
		 */
		_handleCommandSubscribe: function(message) {
			if (message.success && typeof message.payload.channel === 'string') {
				var channel = this.getChannel(message.payload.channel);
				if (channel) {
					channel._handleSubscribed(message);
				}
			}
		},

		/**
		 * Handles the channel unsubscription command message.
		 *
		 * @private
		 * @instance
		 * @function _handleCommandUnsubscribe
		 * @memberof Connection
		 * @param {Object} message
		 *		is the command message to be handled
		 */
		_handleCommandUnsubscribe: function(message) {
			if (message.success && typeof message.payload.channel === 'string') {
				var channel = this.getChannel(message.payload.channel);
				if (channel) {
					channel._handleUnsubscribed(message);
					this._removeChannel(channel.getName());
				}
			}
		},

		/**
		 * Delegates incomming messages to their channels.
		 *
		 * @private
		 * @instance
		 * @function _handleChannelMessage
		 * @memberof Connection
		 * @param {String} channelName
		 *		is the name of the channel which receives the message.
		 * @param {Object} message
		 *		is the message object which contains all relevant data
		 *		of the message send by the remote
		 */
		_handleChannelMessage: function(channelName, message) {
			if (this._options.ignoreSender && message.sender === this._identifier) {
				return;
			}

			var channel = this.getChannel(channelName);
			if (channel) {
				channel.trigger(message.type, message);
			}
		},

		/**
		 * This performs the reconnection when a connection was closed before.
		 * All registered channels will be subscribed again.
		 *
		 * @private
		 * @instance
		 * @function _handleReconnect
		 * @memberof Connection
		 */
		_handleReconnect: function() {
			var
				channel,
				channelName
			;

			this._initializeConnection();

			// Handle re-subscribtion on each channel:
			for (channelName in this._channels) {
				channel = this._channels[channelName];
				channel._subscribe();
			}
		},

		/**
		 * Is the eventhandler which is executed when the socket connection
		 * was opened. It performs the identification and authentification at
		 * the remote.
		 *
		 * @private
		 * @instance
		 * @function _onSocketOpen
		 * @memberof Connection
		 * @fires CONNECTION_CONNECTED
		 */
		_onSocketOpen: function() {
			this._log('info', 'Connected');
			this._socketOpen = true;

			// Identify and send auth data if available.
			var authData = this._identifier;
			if (this._options.authToken) {
				authData = authData + Constants.DELIMITER + this._options.authToken;
			}

			this.trigger(EventTypes.CONNECTION_CONNECTED);
			this.sendCommandMessage(Constants.AUTHENTICATE, authData, true);
		},

		/**
		 * Is the eventhandler which is executed when the socket connection
		 * closes, accidentally or not. When the 'autoReconnect' option is
		 * enabled, the reconnect will be performed with the defined
		 * 'autoReconnectTimeout'.
		 *
		 * @private
		 * @instance
		 * @function _onSocketClose
		 * @memberof Connection
		 * @fires CONNECTION_DISCONNECTED
		 */
		_onSocketClose: function() {
			var
				channel,
				channelName
			;

			this._log('info', 'Disconnected');
			this._socket = null;
			this._socketOpen = false;
			this._authenticated = false;

			this.trigger(EventTypes.CONNECTION_DISCONNECTED);

			// Handle unsubscribtion on each channel:
			for (channelName in this._channels) {
				channel = this._channels[channelName];
				channel._handleUnsubscribed();
			}

			if (this._options.autoReconnect) {
				// Perform auto reconnect:
				window.setTimeout(
					proxy(this._handleReconnect, this),
					this._options.autoReconnectTimeout
				);
			}
		},

		/**
		 * Is the eventhandler for incomming messages. It parses the incomming
		 * message data according the django-omnibus message format,
		 * identifies the type (command-mesage or channel-message) and delegates
		 * them to their handlers.
		 *
		 * @private
		 * @instance
		 * @function _onSocketMessage
		 * @memberof Connection
		 * @param {Object} message
		 *		is the message data send from the socket connection
		 */
		_onSocketMessage: function(message) {
			this._log('debug', 'In: ' + message.data);
			var
				data = message.data,
				delimiter = data.indexOf(Constants.DELIMITER),
				name = data.substring(0, delimiter),
				payload = JSON.parse(data.substring(delimiter + 1))
			;

			if (name.indexOf(Constants.INDICATOR) === 0) {
				name = name.substr(1);
				this._handleCommandMessage(name, payload);
			} else {
				this._handleChannelMessage(name, payload);
			}
		},

		/**
		 * Is the eventhandler for occurring errors through the websocket
		 * implementation. It just sends an event for external handlers.
		 *
		 * @private
		 * @instance
		 * @function _onSocketError
		 * @memberof Connection
		 * @fires CONNECTION_ERROR
		 */
		_onSocketError: function(event) {
			this.trigger(EventTypes.CONNECTION_ERROR, event);
		}
	});

	/**
	 * Dirctionary of available connection and channel events.
	 *
	 * @readonly
	 * @memberof Connection
	 */
	Connection.events = extend({}, EventTypes);

	/**
	 * Dictionary of the connection default settings.
	 *
	 * @readonly
	 * @memberof Connection
	 */
	Connection.defaults = extend({}, Defaults);

	return Connection;
});
