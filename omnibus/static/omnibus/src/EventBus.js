define(['./utils/extend','./Event'], function(extend, Event) {
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

	return EventBus;
});
