import logging

from django.core.management.base import BaseCommand
from django.utils.module_loading import import_by_path
from tornado import ioloop

from ...pubsub import PubSub
from ...settings import (
    SERVER_PORT, AUTHENTICATOR_FACTORY, CONNECTION_FACTORY, WEBAPP_FACTORY,
    DIRECTOR_ENABLED, FORWARDER_ENABLED)


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # Initialize pubsub helper.
        pubsub = PubSub()

        if DIRECTOR_ENABLED:
            logger.info('Starting director.')
            pubsub.init_director()

        if FORWARDER_ENABLED:
            logger.info('Starting forwarder.')
            pubsub.init_forwarder()

        # Get factories for connection and tornado webapp.
        authenticator_factory = import_by_path(AUTHENTICATOR_FACTORY)
        connection_factory = import_by_path(CONNECTION_FACTORY)
        webapp_factory = import_by_path(WEBAPP_FACTORY)

        # Create app and listen on SEVER_PORT
        app = webapp_factory(connection_factory(authenticator_factory(), pubsub))
        app.listen(SERVER_PORT)

        # Go, run!
        logger.info('Starting omnibusd.')
        ioloop.IOLoop.instance().start()
