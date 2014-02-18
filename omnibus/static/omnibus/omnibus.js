/*!
 * Django-Omnibus
 * Django/JavaScript WebSocket Connections
 *
 * @version 0.0.1
 * @author Moccu GmbH & Co. KG, Kreativagentur für digitale Medien <http://www.moccu.com/>
 * @author Stephan Jaekel <https://github.com/stephrdev>
 * @author Norman Rusch <https://github.com/schorfES>
 */

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
	};

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
	};


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

	/**
	 * Basic event object to transport data throug the eventbus implementation.
	 *
	 * @constructor Event
	 * @param {Object} sender
	 *		is the eventbus instance which fired the event
	 * @param {String} eventName
	 *		is the name/type of the event
	 * @param {Object} eventData
	 *		is the data which should be transported
	 */
	var Event = function(sender, eventName, eventData) {
		this.sender = sender;
		this.name = eventName;
		this.data = eventData;
	};

	/**
	 * A eventbus system which implements the pubsub/observer pattern.
	 *
	 * @constructor EventBus
	 */
	var EventBus = function() {
		/* Dictionary to store all registered eventNames and eventHandlers.
		 * All eventHandlers will be referenced in an array. Each array is a
		 * property with the name of the eventName. */
		this._events = {};
	};

	// Extend the EventBus protoype with functions and properties:
	extend(EventBus.prototype, {

		/**
		 * Registers an eventHandler to a particular eventName.
		 *
		 * This function is chainable to call multiple functions on an
		 * instance of the eventbus.
		 *
		 * To handle all events triggered through an eventbus instance by a
		 * single eventHandler use the value '*' as wildcard eventName.
		 *
		 * @instance
		 * @function on
		 * @memberof EventBus
		 * @param {String} eventName
		 *		is the name/type of a event
		 * @param {Function} eventHandler
		 *		is the function to be executed when event is triggerd
		 * @returns {Object}
		 *		is the current eventbus instance
		 */
		on: function(eventName, eventHandler) {
			if (!this._events[eventName]) {
				this._events[eventName] = [];
			}

			this._events[eventName].push(eventHandler);
			return this;
		},

		/**
		 * Removes registered eventHandler(s) from the eventbus instance.
		 *
		 * This function is chainable to call multiple functions on an
		 * instance of the eventbus.
		 *
		 * When called without any parameters all registered eventHandlers are
		 * removed.
		 *
		 * When called with eventName parameter all registered eventHandlers
		 * according this particular eventName are removed.
		 *
		 * When called with eventName and a reference to an eventHandler
		 * function this given handler for the particular eventName will be
		 * removed.
		 *
		 * @instance
		 * @function off
		 * @memberof EventBus
		 * @param {String} [eventName]
		 *		is the name/type of an event
		 * @param {Function} [eventHandler]
		 *		is the handler function which should be removed
		 * @returns {Object}
		 *		is the current eventbus instance
		 */
		off: function(eventName, eventHandler) {
			var i; // iterator for loops

			if (eventName === undefined) {
				// Remove all registered eventHandlers:
				for (i in this._events) {
					this._events[i] = undefined;
					delete(this._events[i]);
				}
			} else if (typeof this._events[eventName] === 'object') {
				if (typeof eventHandler === 'function') {
					// Remove specific eventHandler:
					for (i = 0; i < this._events[eventName].length; i++) {
						if (this._events[eventName][i] === eventHandler) {
							this._events[eventName].splice(i, 1);
						}
					}
				} else {
					// Remove all eventHandlers
					this._events[eventName] = undefined;
					delete(this._events[eventName]);
				}
			}
			return this;
		},

		/**
		 * Triggers all registered eventHandlers on a particular eventName.
		 * EventData can be send through each call to each handler.
		 *
		 * This function is chainable to call multiple functions on an
		 * instance of the eventbus.
		 *
		 * All eventHandlers registered with the wildcard eventName '*' will
		 * be triggered as well.
		 *
		 * @instance
		 * @function trigger
		 * @memberof EventBus
		 * @param {String} eventName
		 *		is the name/type of an event
		 * @param {Object} [eventData]
		 *		the data to be send through the event
		 * @returns {Object}
		 *		is the current eventbus instance
		 */
		trigger: function(eventName, eventData) {
			this._trigger(eventName, eventData);

			if (eventName !== '*') {
				this._trigger('*', eventData, eventName);
			}

			return this;
		},

		/**
		 * Finally triggers registered eventHandlers on given eventName.
		 *
		 * @private
		 * @instance
		 * @function _trigger
		 * @memberof EventBus
		 * @param {String} eventName
		 *		is the name/type of an event
		 * @param {Object} [eventData]
		 *		the data to be send through the event
		 * @param {String} [overwriteEventName]
		 *		can be used to overwrite the eventName for the triggered Event
		 *		instance. This is used for the wildcard eventName '*'
		 */
		_trigger: function(eventName, eventData, overwriteEventName) {
			var
				index,
				instance = new Event(this, overwriteEventName || eventName, eventData)
			;

			if (typeof this._events[eventName] === 'object') {
				for (index = 0; index < this._events[eventName].length; index++) {
					this._events[eventName][index](instance);
				}
			}
		}
	});


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
}));