import json
import logging


logger = logging.getLogger(__name__)

LOG_LEVELS = {
    'debug': logger.debug,
    'info': logger.info,
    'error': logger.error,
}


class MessageConnection(object):
    authenticator_class = None
    pubsub = None

    def __init__(self, *args, **kwargs):
        # Initialize authenticator and subscriber attributes to make sure we
        # have a clean instance.
        self.authenticator = None
        self.subscriber = None
        super(MessageConnection, self).__init__(*args, **kwargs)

    def log(self, level, message):
        # Helper to log stuff.
        LOG_LEVELS[level](u'[%s] %s' % (id(self), message))

    # MESSAGES ---------------------------------------------------------------

    def on_open(self, info):
        self.log('debug', 'CON: Connecting..')
        self.open_connection()
        self.log('info', 'CON: Connected.')

    def on_close(self):
        self.log('debug', 'CON: Disconnecting..')
        self.close_connection()
        self.log('info', 'CON: Disconnected.')

    def on_error(self, exception):
        self.log('error', u'CON: Error: {0}'.format(exception))
        self.close_connection()

    def on_message(self, msg):
        self.log('debug', u'IN: {0}'.format(msg))

        # Command messages start with "!", lets see if the have a command here.
        if msg[0] == '!':
            command, args = msg[1:].split(':', 1)
            # We have a command, handle it.
            self.on_command_message(command, args)
        elif self.is_authenticated():
            # Handle incoming channel messages only when connection is
            # authenticated.
            channel = msg[:msg.index(':')]
            self.on_channel_message(channel, msg)

    def on_subscriber_message(self, msg):
        # Message from subscriber zmq connection
        self.send(msg[0])

    def on_command_message(self, command, args):
        """
        `on_command` is called after a command was received from a client
        connection.
        """

        # Check if we have a handler for this command
        handler = getattr(self, 'command_{0}'.format(command), None)
        if not handler:
            # No handler, respond to client and tell them.
            self.respond_command(command, False)
        else:
            self.log('info', u'CON: {0} with {1}'.format(command, args))
            handler(args)

    def on_channel_message(self, channel, payload):
        """
        `on_channel_message` is called after a message was received from a client
        connection.
        """

        # Only forward this message if connection is subscribed to this channel
        # and the connection is allowed to publish to the requested channel.
        if (
            channel in self.subscriber.channels
            and self.authenticator.can_publish(channel)
        ):
            # Connection is subscribed and allowed to publish.
            self.publish(payload)

    # CONNECTION -------------------------------------------------------------

    def open_connection(self):
        # Initializing a zmq subscriber socket to handle messages from other
        # connection or from python-api calls.
        self.subscriber = self.pubsub.get_subscriber(
            self.on_subscriber_message)

    def close_connection(self):
        # Check if we have a initialized subscriber connection, if yes - close!
        if self.subscriber is not None:
            self.pubsub.close_subscriber(self.subscriber)

    def publish(self, msg):
        """
        `publish` is used to publish client-connection messages to other
        connections.
        """
        self.log('debug', u'PUB: {0}'.format(msg))
        self.pubsub.send(msg)

    def send(self, msg):
        """
        `send` is used to deliver messages and command responses to client/browser.
        """
        self.log('debug', u'OUT: {0}'.format(msg))
        return super(MessageConnection, self).send(msg)

    def respond_command(self, command, success, payload=None):
        """
        `respond_command` is a helper method for command responses.
        """
        self.send('!{0}:{1}'.format(
            command,
            json.dumps({
                'type': command,
                'success': success,
                'payload': payload
            })
        ))

    # AUTHENTICATION ---------------------------------------------------------

    def is_authenticated(self):
        return self.authenticator is not None

    def command_authenticate(self, args):
        """
        `command_authenticate` is called when a client connection has sent the
        `authenticate` command.
        """
        self.authenticator = self.authenticator_class.authenticate(args)

        # The authenticator classmethod authenticate returns None if the connection
        # cannot be authenticated.
        if self.authenticator is None:
            self.respond_command('authenticate', False)
        else:
            self.respond_command('authenticate', True)

    # PUBSUB -----------------------------------------------------------------

    def command_subscribe(self, args):
        """
        `command_subscribe` handles subscribe commands from client connections.
        """
        channel = str(args)
        # Ensure the connection isn't already subscribed and is allowed to
        # subscribe.
        if (
            channel not in self.subscriber.channels
            and self.authenticator.can_subscribe(channel)
        ):
            # We're allowed to subscribe, try.
            result = self.pubsub.subscribe(self.subscriber, channel)
        else:
            result = False

        # Tell the client wether subscription was successful or not.
        self.respond_command('subscribe', result, {'channel': channel})

    def command_unsubscribe(self, args):
        """
        `command_subscribe` handles subscribe commands from client connections.
        """
        channel = str(args)
        # Ensure the connection is subscribed to the requested channel and is
        # allowed to unsubscribe.
        if (
            channel in self.subscriber.channels
            and self.authenticator.can_unsubscribe(channel)
        ):
            # Go, try it.
            result = self.pubsub.unsubscribe(self.subscriber, channel)
        else:
            result = False

        # Tell the client wether the unsubscribe was successful or not.
        self.respond_command('unsubscribe', result, {'channel': channel})
