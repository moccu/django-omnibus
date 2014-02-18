from omnibus.factories import websocket_connection_factory


def mousemove_connection_factory(auth_class, pubsub):
    class GeneratedConnection(websocket_connection_factory(auth_class, pubsub)):
        def close_connection(self):
            self.pubsub.publish(
                'mousemoves', 'disconnect',
                sender=self.authenticator.get_identifier()
            )
            return super(GeneratedConnection, self).close_connection()

    return GeneratedConnection
