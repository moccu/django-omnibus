from example_project.settings import *


OMNIBUS_SERVER_PORT = 4252

# Dont direct, forward to upstream director.
OMNIBUS_DIRECTOR_ENABLED = False
OMNIBUS_FORWARDER_ENABLED = True

# Need to change this in order to run two omnibusd's in parallel
OMNIBUS_SUBSCRIBER_ADDRESS = 'inproc://ecslavesub'
OMNIBUS_PUBLISHER_ADDRESS = 'inproc://evslavepub'

# Upstream connectors.
OMNIBUS_DIRECTOR_SUBSCRIBER_ADDRESS = 'tcp://127.0.0.1:4243'
OMNIBUS_DIRECTOR_PUBLISHER_ADDRESS = 'tcp://127.0.0.1:4244'
