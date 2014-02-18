.. _server-usage:

Usage (server and API)
======================

Before you can use `django-omnibus`, you have to install the library,
please see :ref:`server-installation` for more details.

Starting the server
-------------------

Because we use Tornado on the server side to maintain the connections, you have
to start the ``omnibusd`` server in addition to the wsgi application::

    python manage.py omnibusd

In production, you should use ``supervisord`` or any other process manager to start
and stop the omnibus server.

Sending messages to a channel
-----------------------------

To send a message to a specific channel, you can use the provided highlevel API.

Let's start with an example:

.. code-block:: python

    from omnibus.api import publish

    def send_hello_world():
        publish(
            'mychannel',  # the name of the channel
            'hello',  # the `type` of the message/event, clients use this name
                      # to register event handlers
            {'text': 'Hello world'},  # payload of the event, needs to be
                                      # a dict which is JSON dumpable.
            sender='server'  # sender id of the event, can be None.
        )

    send_hello_world()

This would send an message with the type ``hello`` to the channel ``mychannel``.
The payload is delivered to all connections which are subscribed to the channel.

A short note about the sender id. Every connection generates an unique id upon connecting.
The server-side can decide wether to send an identifier or not and it heavily depends
on your application if it is needed or not.
