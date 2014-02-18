.. _server-internals:

Internals / behind the scenes
=============================

This document describes some of the internals of `django-omnibus`.

The libary uses Tornado and ZMQ for handling the connections and message delivery.

.. _server-internals-message-envelop:

Message envelop and structure
-----------------------------

Let's have a look on a full event blob

.. code-block:: js

    mychannel:{"type":"foobar","sender":"44b0b696-8048-4ac3-9219-ca8d81a26879",
    "payload":{"arg1":123,"example":"string"}}

The deconstructed envelope:

.. code-block:: js

    mychannel  // the channel name
    :  // a colon to split channel and message.
    {"type":"foobar","sender":"44b0b696-8048-4ac3-9219-ca8d81a26879",
    "payload":{"arg1":123,"example":"string"}}  // the json message

In this message, ``mychannel`` is the destination channel of the message. The
colon divides the destination and the message.

The deconstructed event body:

 * ``type`` which is used to trigger the right event handlers on the client side.
 * ``sender`` identifies the origin of the event
 * ``payload`` can be anything from simple key-value pairs to large JSON blobs.

Commands
--------

There is a special case if the channel starts with a bang ``!``. All messages which
start with a bang are considered commands from the client to the server and are never
forwarded.

An example, this is used to subscribe to a channel::

    !subscribe:mychannel

Here is the response

.. code-block:: js

    !subscribe:{"type":"subscribe","success":true,"payload":{"channel":"mychannel"}}

The response to a command looks the same as normal messages with some notes:

 * the destination channel is ``!`` + command name, e.g. ``subscribe``
 * the message type is the command name, e.g. ``subscribe``
 * there is an additional field ``success`` indicating whether the command was
   successful or not.

The payload can contain various things. In the case of subscribe it contains the
channel which was subscribed.
