import json
import logging

import zmq
from zmq.error import ZMQError
from zmq.eventloop.zmqstream import ZMQStream
from zmq.eventloop import ioloop

from django.utils.encoding import force_bytes

from . import exceptions as ex
from .settings import (
    SUBSCRIBER_ADDRESS, PUBLISHER_ADDRESS,
    DIRECTOR_SUBSCRIBER_ADDRESS, DIRECTOR_PUBLISHER_ADDRESS)


logger = logging.getLogger(__name__)


LOG_LEVELS = {
    'debug': logger.debug,
    'info': logger.info,
    'error': logger.error,
}


class PubSub(object):
    BIND = 'bind'
    CONNECT = 'connect'

    ioloop_installed = False
    connections = None
    bridges = None

    def __init__(self, loop=None):
        self.context = zmq.Context()
        self.connections = {}
        self.bridges = {}
        self.loop = loop or ioloop.IOLoop.instance()

    def log(self, level, message):
        LOG_LEVELS[level](u'[%s] %s' % (id(self), message))

    # CONNECTION -------------------------------------------------------------

    def get_connection(self, mode, address, bind=False):
        # Lets see if we have a connection to the address already (also respect
        # if we should bind or connect and the zmq socket mode)
        connection = self.connections.setdefault(
            mode, {}).setdefault(address, {}).get(bind, None)

        if connection is None:
            try:
                connection = self.context.socket(mode)
                if bind:
                    connection.bind(address)
                else:
                    connection.connect(address)
            except ZMQError as e:
                raise ex.OmnibusException(e)

            # Remember connection in central dict.
            self.connections[mode][address][bind] = connection

        # Return the requested connection.
        return connection

    def send(self, msg):
        """
        `send` is used to publish a message to a zmq connection. A specific
        publisher can be provided, if no publisher is provived, we request
        the default one.
        """
        try:
            self.log('debug', 'send {0} to {1}'.format(msg, PUBLISHER_ADDRESS))
            publisher = self.get_connection(zmq.PUB, PUBLISHER_ADDRESS)
            publisher.send_unicode(msg)
        except ZMQError as e:
            raise ex.OmnibusPublisherException(e)

        return True

    def publish(self, channel, payload_type, payload=None, sender=None):
        """
        `publish` is a highlevel method to publish stuff. It handles the json
        converting and ensures the payload has the correct data type.
        """
        if payload is None:
            payload = {}

        if not isinstance(payload, dict):
            raise ex.OmnibusDataException(
                'Invalid payload, needs to be a dict: {0}'.format(type(payload)))

        try:
            self.log(
                'debug',
                'publish to {0} (payload_type:{1}, payload:{2}, sender:{3})'.format(
                    channel, payload_type, payload, sender))

            return self.send(u'{0}:{1}'.format(
                channel,
                json.dumps({
                    'sender': sender,
                    'type': payload_type,
                    'payload': payload
                })
            ))
        except (TypeError, ValueError) as e:
            raise ex.OmnibusDataException(e)

    # SUBSCRIBING ------------------------------------------------------------

    def get_subscriber(self, callback, address=None):
        """
        `get_subscriber` creates a new zmq subscriber stream. If no address is
        provided, the default subscriber address is used.
        """
        if address is None:
            address = SUBSCRIBER_ADDRESS

        try:
            subscriber_socket = self.context.socket(zmq.SUB)
            subscriber_socket.connect(address)

            subscriber = ZMQStream(subscriber_socket, io_loop=self.loop)
            subscriber.on_recv(callback)
        except ZMQError as e:
            raise ex.OmnibusSubscriberException(e)

        # Initialize channel list
        subscriber.channels = []

        return subscriber

    def close_subscriber(self, subscriber):
        """
        `close_subscriber` closes the subscriber stream and the socket below.
        """
        try:
            subscriber_socket = subscriber.socket
            subscriber.close()
            subscriber_socket.close()
        except ZMQError as e:
            raise ex.OmnibusSubscriberException(e)

        return True

    def subscribe(self, subscriber, channel):
        """
        `subscribe` is called after client connection wants to subscribe to a
        channel. If the subcriber is already subscribed to a channel, it fails.
        """
        if channel in subscriber.channels:
            return False

        try:
            subscriber.setsockopt(zmq.SUBSCRIBE, force_bytes(channel))
            subscriber.channels.append(channel)
        except ZMQError as e:
            raise ex.OmnibusSubscriberException(e)

        return True

    def unsubscribe(self, subscriber, channel):
        """
        `unsubscribe` is called after client connection wants to unsubscribe
        from a channel. If the subcriber isn't subscribed to the channel, it fails.
        """
        if channel not in subscriber.channels:
            return False

        try:
            subscriber.setsockopt(zmq.UNSUBSCRIBE, force_bytes(channel))
            subscriber.channels.remove(channel)
        except ZMQError as e:
            raise ex.OmnibusSubscriberException(e)

        return True

    # BRIDGING ---------------------------------------------------------------

    def init_bridge(self, in_mode, in_address, out_mode, out_address):
        assert in_mode in (self.BIND, self.CONNECT), 'Invalid in_mode'
        assert out_mode in (self.BIND, self.CONNECT), 'Invalid out_mode'

        instances = self.bridges.setdefault(in_address, {}).setdefault(
            in_mode, {}).setdefault(out_address, {}).get(out_mode, None)

        if instances is None:
            instances = {}

            try:
                instances['in'] = self.context.socket(zmq.SUB)
                if in_mode == self.BIND:
                    instances['in'].bind(in_address)
                elif in_mode == self.CONNECT:
                    instances['in'].connect(in_address)
                instances['in'].setsockopt(zmq.SUBSCRIBE, b'')

                instances['out'] = self.context.socket(zmq.PUB)
                if out_mode == self.BIND:
                    instances['out'].bind(out_address)
                elif out_mode == self.CONNECT:
                    instances['out'].connect(out_address)

                # Transfer data from subscriber to publisher.
                instances['bridge'] = ZMQStream(instances['in'], io_loop=self.loop)
                instances['bridge'].on_recv(lambda msg: instances['out'].send(msg[0]))

            except ZMQError as e:
                raise ex.OmnibusException(e)

            self.bridges[in_address][in_mode][out_address][out_mode] = instances

        return instances

    def init_director(self):
        return self.init_bridge(
            self.BIND, PUBLISHER_ADDRESS, self.BIND, SUBSCRIBER_ADDRESS)

    def init_forwarder(self):
        sub_forwarder = self.init_bridge(
            self.CONNECT, DIRECTOR_SUBSCRIBER_ADDRESS, self.BIND, SUBSCRIBER_ADDRESS)
        pub_forwarder = self.init_bridge(
            self.BIND, PUBLISHER_ADDRESS, self.CONNECT, DIRECTOR_PUBLISHER_ADDRESS)

        return pub_forwarder, sub_forwarder
