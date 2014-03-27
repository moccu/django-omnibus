from .pubsub import PubSub


pubsub = PubSub()


def publish(channel, payload_type, payload=None, sender=None):
    """ API method to publish messages to pubsub subsystem. """
    return pubsub.publish(channel, payload_type, payload, sender)
