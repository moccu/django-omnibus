from .pubsub import PubSub


def publish(channel, payload_type, payload=None, sender=None):
    """ API method to publish messages to pubsub subsystem. """
    return PubSub().publish(channel, payload_type, payload, sender)
