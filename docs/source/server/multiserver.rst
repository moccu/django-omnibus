.. _server-multiserver:

Multi-server setups
===================

Multi-server setups help you to handle many client connections. Using the
forwarding proxy feature, you can have multiple servers accepting omnibus
connections.

How it works
------------

.. code-block:: text

    +---------------+                                   +-------------------+
    |omnibusd Master|                                   |omnibusd Slave1    |
    |PUB: *:4244    |<---------------------------------+|Web clients connect|
    |SUB: *:4243    |                                   |to this node.      |
    +---------------+                                   +-------------------+
               ^
               |                                   FORWARDER_ENABLED
               |                                   True
               |                                   DIRECTOR_SUBSCRIBER_ADDRESS
               |                                   masterip:4243
               |                                   DIRECTOR_PUBLISHER_ADDRESS
               |                                   masterip:4244
               |
               |                                        +-------------------+
               |                                        |omnibusd Slave2    |
               +---------------------------------------+|Web clients connect|
                                                        |to this node.      |
                                                        +-------------------+

This is how you can build a multi server setup.

Assume you have one `master` server which has ``OMNIBUS_DIRECTOR_ENABLED`` set
to ``True`` and ``OMNIBUS_FORWARDER_ENABLED`` set to ``False``. This server will
be your main message hub. Now, you can have one or more `slave` servers, which
connect to your `master` server.

On the `slave` servers you then have the ``OMNIBUS_FORWARDER_ENABLED`` set to
``True`` and ``OMNIBUS_DIRECTOR_ENABLED`` set to ``False``. Together with the
right settings for  ``OMNIBUS_DIRECTOR_SUBSCRIBER_ADDRESS`` and
``OMNIBUS_DIRECTOR_PUBLISHER_ADDRESS`` the forwarding proxy establishes one
subscriber and one publisher connection to your `master` server.

The client connections to the different `slave` servers only connect to local
addresses reducing the network IO. This is possible because the forwarding proxy
fetches all messages from the `master` and publishes all messages back to the
`master` instance.

.. hint::

    Remember to rebind the publisher and subscriber addresses of your `master`
    servers. The defaults only bind to localhost. Remote servers can't connect
    to these sockets.

Example configuration with 4 servers
------------------------------------

Assuming you have four servers with the ip addresses 192.168.1.10, .11, .12
and .13. This is, how your configuration could look like.

.. code-block:: python

    # Master server
    OMNIBUS_SUBSCRIBER_ADDRESS = 'tcp://192.168.1.10:4243'
    OMNIBUS_PUBLISHER_ADDRESS = 'tcp://192.168.1.10:4243'

.. code-block:: python

    # slave servers
    OMNIBUS_DIRECTOR_ENABLED = False
    OMNIBUS_FORWARDER_ENABLED = True
    OMNIBUS_DIRECTOR_SUBSCRIBER_ADDRESS = 'tcp://192.168.1.10:4243'
    OMNIBUS_DIRECTOR_PUBLISHER_ADDRESS = 'tcp://192.168.1.10:4243'

You now could define a DNS round-robin entry like "omnibus.myfancydomain.com"
pointing to 192.168.1.11, 192.168.1.12 and 192.168.1.13 to create some kind of
a poor man's load balancing.
