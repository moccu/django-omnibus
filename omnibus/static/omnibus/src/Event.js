define(function() {
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

	return Event;
});
