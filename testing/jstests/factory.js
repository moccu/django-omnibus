var dependencies = [
	'../../omnibus/static/omnibus/src/Connection',
	'./mockwebsocket'
];

define(dependencies, function(EventConnection, MockWebSocket) {
	function getConnection(host, transport) {
		return new EventConnection(
			transport || MockWebSocket,
			host || 'http://fakedomain:1234'
		);
	}

	return getConnection;
});
