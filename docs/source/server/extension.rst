.. _server-extension:

Extending django-omnibus
========================

To extend `django-omnibus` lets have a look at the mousemove example.

In this example project, we subclassed the connection handler and replaced the
method ``close_connection`` to send an event to all other connected clients
when the connection is closed.

.. code-block:: python

    # Example connection.py

    from omnibus.factories import websocket_connection_factory


    # Our factory function
    def mousemove_connection_factory(auth_class, pubsub):
        # Generate a new connection class using the default websocket connection
        # factory (we have to pass an auth class - provided by the server and a
        # pubsub singleton, also provided by the omnibusd server
        class GeneratedConnection(websocket_connection_factory(auth_class, pubsub)):
            def close_connection(self):
                # We subclassed the `close_connection` method to publish a
                # message. Afterwards, we call the parent's method.
                self.pubsub.publish(
                    'mousemoves', 'disconnect',
                    sender=self.authenticator.get_identifier()
                )
                return super(GeneratedConnection, self).close_connection()

        # Return the generated connection class
        return GeneratedConnection

As you can see, we wrote a new connection factory which returns the extended
connection handler. This factory is used in the settings like this

.. code-block:: python

    OMNIBUS_CONNECTION_FACTORY = 'example_project.connection.mousemove_connection_factory'

This is all you have to do to send a "disconnect" event when a client closes
the connection.
