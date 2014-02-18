.. _server-configuration:

Configuration reference
=======================

``OMNIBUS_ENDPOINT_SCHEME``
---------------------------

This setting is used to construct the connection endpoint for the client connections.
You should use ``ws`` for the default websocket transport layer. If you use SockJS,
you have to switch the scheme to ``http``, because SockJS starts with a http connection
and tries to upgrade to websockets if possible.

``OMNIBUS_SERVER_HOST``
-----------------------

Used to decide on which address the ``omnibusd`` server binds.
Defaults to all addresses.

``OMNIBUS_SERVER_PORT``
-----------------------

Sets the port on which the ``omnibusd`` listens. Defaults to ``4242``.

``OMNIBUS_SERVER_BASE_URL``
---------------------------

The base url of the Tornado handler. If you use the ``omnibusd`` server,
you normally don't have to change this setting. If you want to integrate the
omnibus web app in an existing Torndo server, feel free to alter this.
Defaults to ``/ec``.

``OMNIBUS_DIRECTOR_ENABLED``
----------------------------

This flag decides if the ``omnibusd`` process acts as a master node. This means
that the process will bind to the ``OMNIBUS_PUBLISHER_ADDRESS`` instead of
connecting. The director is also used as the api endpoint for publishing messages.
If you run ``omnibusd`` with a single instance, you don't have to change this
setting. Default is ``True``.

To get more information about multi-server setups, please read :ref:`server-multiserver`.

``OMNIBUS_FORWARDER_ENABLED``
-----------------------------

If this flag is changed to ``True`` (defaults to ``False``), the ``omnibusd``
will start a forwarding proxy for all websocket-clients connecting to the node.
The forwarding proxy is used to reduce the amount of connections between ``omnibusd``
processes. In a single server setup, you don't need this feature.

More details on this topic can be found in the :ref:`server-multiserver` section.

``OMNIBUS_SUBSCRIBER_ADDRESS``
------------------------------

This is the address, all client connection connect to. Using this connection,
the clients receive all their events. Defaults to a local ``tcp`` address.

If you have a multi-server setup, you can change this address to a remote endpoint.
However it is recommended to use the forwarding proxy feature.
See ``OMNIBUS_FOWARDER_ENABLED``.

``OMNIBUS_PUBLISHER_ADDRESS``
-----------------------------

This address is used to connect to when publishing events. This setting is also
used by other python code to publish messages into the `django-omnibus` system.
Defaults to a local ``tcp`` address.

For multi-server setups, you can change this setting to a remote address but you
should consider to use the forwarding proxy.

``OMNIBUS_DIRECTOR_SUBSCRIBER_ADDRESS``
---------------------------------------

This address is the forwarding destination for local subscriber connections.
If a client connects to the local subscriber address, it will receive messages
from this upstream server. You need this setting for multi-server setups.

``OMNIBUS_DIRECTOR_PUBLISHER_ADDRESS``
--------------------------------------

This address is the forwarding destination for local publisher connections.
If a client connection wants to publish and connects to the local publisher
address, the forwarding proxy will forward the message to this address.
You need this setting for multi-server setups.

``OMNIBUS_AUTHENTICATOR_FACTORY``
---------------------------------

This module path decides which ``Authenticator`` class is used for authenticating
connections. Defaults to ``omnibus.factories.noopauthenticator_factory``.
This Authenticator does nothing and lets everyone in.

Another valid option is ``omnibus.factories.userauthenticator_factory``.
This Authenticator identifies Django users including an auth token validation
mechanism.

If you want to create your own Authenticator please refer to the existing code to
see how it works. The factory is supposed to return a class, not an instance!

``OMNIBUS_WEBAPP_FACTORY``
--------------------------

This factory returns the Tornado web application which is used by the
``omnibsd`` server. The shipped options are:

 * ``omnibus.factories.websocket_webapp_factory`` for a websocket app
 * ``omnibus.factories.sockjs_webapp_factory`` for a SockJS app

You can change the factory to extend the way the web application works.

``OMNIBUS_CONNECTION_FACTORY``
------------------------------

This factory returns the connection class which is used by the web application
to handle the connections. One instance is created for every connection.
The shipped options are:

 * ``omnibus.factories.websocket_connection_factory`` for a websocket connection
 * ``omnibus.factories.sockjs_connection_factory`` for a SockJS connection

You can change the factory to extend the way the client connection is handled.
For example, you could trigger messages when a client connects or disconnects to
all other connected clients.

Please refer to the ``mousmove`` code example and the code itself to see how
this works.
