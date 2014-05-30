import hashlib
import hmac

from django.conf import settings
from django.utils.encoding import force_bytes


class NoOpAuthenticator(object):
    @classmethod
    def authenticate(cls, args):
        """
        Classmethod to authenticate a connection. Should return an
        Authenticator instance if the connection is authenticated or None if not.

        `args` contains the auth_token from the client library (can contain the
        connection identifier and/or additional data).
        """
        return cls(args)

    def __init__(self, identifier):
        self.identifier = identifier

    def get_identifier(self):
        """
        `get_identifier` should return the identifier of the connection.
        """
        return self.identifier

    def can_subscribe(self, channel):
        """
        `can_subscribe` is called everytime a connection wants to subscribe
        to a channel. Should return True or False, wether subscription is
        allowed or not.
        """
        return True

    def can_unsubscribe(self, channel):
        """
        `can_unsubscribe` is called everytime a connection wants to unsubscribe
        to a channel. Should return True or False, wether un-subscription is
        allowed or not.
        """
        return True

    def can_publish(self, channel):
        """
        `can_publish` is called everytime a connection wants to publish
        to a channel. Should return True or False, wether writing is
        allowed or not.
        """
        return True


class UserAuthenticator(object):
    @classmethod
    def authenticate(cls, args):
        # First of all, check if we found a auth_token (assuming the connection
        # is logged in.
        if ':' in args:
            # auth token available, try to validate.
            try:
                identifier, user_id, token = args.split(':')
            except ValueError:
                return None

            if not cls.validate_auth_token(user_id, token):
                return None

            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
            except ImportError:
                # Fall back to directly importing User
                # for backwards compatibility
                from django.contrib.auth.models import User

            # We validated the auth_token, fetch user from db for further use.
            try:
                user = User.objects.get(pk=int(user_id), is_active=True)
            except (ValueError, User.DoesNotExist):
                return None
        else:
            # No auth_token, assume anonymous connection.
            identifier = args
            user = None

        return cls(identifier, user)

    @classmethod
    def get_auth_token(cls, user_id):
        # Generate an auth token for the user id of a connection.
        return hmac.new(
            force_bytes(settings.SECRET_KEY),
            force_bytes(user_id),
            hashlib.sha1
        ).hexdigest()

    @classmethod
    def validate_auth_token(cls, user_id, token):
        # Compare generated auth token with received auth token.
        return cls.get_auth_token(user_id) == token

    def __init__(self, identifier, user):
        self.identifier = identifier
        self.user = user

    def get_identifier(self):
        return self.identifier

    def can_subscribe(self, channel):
        # If a user is authenticated, subscription is allowed.
        return self.user is not None

    def can_unsubscribe(self, channel):
        # If a user is authenticated, un-subscription is allowed.
        return self.user is not None

    def can_publish(self, channel):
        # If a user is authenticated and is staff member, publishing is allowed.
        return self.user is not None and self.user.is_staff is True
