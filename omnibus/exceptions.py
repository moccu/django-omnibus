class OmnibusException(Exception):
    pass


class OmnibusPublisherException(OmnibusException):
    pass


class OmnibusSubscriberException(OmnibusException):
    pass


class OmnibusDataException(OmnibusException):
    pass
