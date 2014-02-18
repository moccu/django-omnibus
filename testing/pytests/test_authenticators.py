import pytest
from django.contrib.auth.models import User

from omnibus.authenticators import NoOpAuthenticator, UserAuthenticator


class TestNoOpAuthenticator:
    def setup(self):
        self.instance = NoOpAuthenticator('test123')

    def test_authenticate(self):
        obj = NoOpAuthenticator.authenticate('test123')

        assert isinstance(obj, NoOpAuthenticator) is True
        assert obj.identifier == 'test123'

    def test_get_identifier(self):
        assert self.instance.get_identifier() == 'test123'

    def test_can_subscribe(self):
        assert self.instance.can_subscribe('anychannel') is True

    def test_can_unsubscribe(self):
        assert self.instance.can_unsubscribe('anychannel') is True

    def test_can_publish(self):
        assert self.instance.can_publish('anychannel') is True


@pytest.mark.django_db
class TestUserAuthenticator:
    def setup(self):
        self.user = User.objects.create(username='testuser')
        self.authed_instance = UserAuthenticator('test123', self.user)
        self.unauthed_instance = UserAuthenticator('test123', None)

    def test_authenticate_no_user(self):
        obj = UserAuthenticator.authenticate('test123')

        assert isinstance(obj, UserAuthenticator) is True
        assert obj.identifier == 'test123'
        assert obj.user is None

    def test_authenticate_invalid_auth_data(self):
        obj = UserAuthenticator.authenticate('test123:broken')
        assert obj is None

    def test_authenticate_invalid_auth_token(self):
        obj = UserAuthenticator.authenticate('test123:123:invalidbrokentoken')
        assert obj is None

    def test_authenticate_invalid_user_id(self):
        obj = UserAuthenticator.authenticate(
            'test123:123:5570b1b049c7207a09fd22f587ed7019f8c50453')
        assert obj is None

    def test_authenticate_inactive_user(self):
        self.user.is_active = False
        self.user.save()

        obj = UserAuthenticator.authenticate('test123:{0}:{1}'.format(
            self.user.pk, UserAuthenticator.get_auth_token(self.user.pk)))

        assert obj is None

    def test_authenticate_user(self):
        obj = UserAuthenticator.authenticate('test123:{0}:{1}'.format(
            self.user.pk, UserAuthenticator.get_auth_token(self.user.pk)))

        assert obj.identifier == 'test123'
        assert obj.user == self.user

    def test_get_auth_token(self, settings):
        settings.SECRET_KEY = 'test123key'
        token = UserAuthenticator.get_auth_token(123)
        assert token == '5570b1b049c7207a09fd22f587ed7019f8c50453'

        other_user_idtoken = UserAuthenticator.get_auth_token(456)
        assert token != other_user_idtoken

        settings.SECRET_KEY = 'test123key456'
        other_secret_key_token = UserAuthenticator.get_auth_token(123)
        assert other_secret_key_token != token

    def test_validate_auth_token(self, settings):
        settings.SECRET_KEY = 'test123key'
        assert UserAuthenticator.validate_auth_token(
            123, '5570b1b049c7207a09fd22f587ed7019f8c50453') is True

        assert UserAuthenticator.validate_auth_token(
            456, '5570b1b049c7207a09fd22f587ed7019f8c50453') is False

        assert UserAuthenticator.validate_auth_token(
            123, '5570b1b049c7207a09fd22f587ed7019f8c50454') is False

    def test_get_identifier(self):
        assert self.authed_instance.get_identifier() == 'test123'
        assert self.unauthed_instance.get_identifier() == 'test123'

    def test_can_subscribe(self):
        assert self.authed_instance.can_subscribe('anychannel') is True
        assert self.unauthed_instance.can_subscribe('anychannel') is False

    def test_can_unsubscribe(self):
        assert self.authed_instance.can_unsubscribe('anychannel') is True
        assert self.unauthed_instance.can_unsubscribe('anychannel') is False

    def test_can_publish(self):
        # Normal users and unauthed
        assert self.authed_instance.can_publish('anychannel') is False
        assert self.unauthed_instance.can_publish('anychannel') is False

        # Now as staff user
        self.user.is_staff = True
        assert self.authed_instance.can_publish('anychannel') is True
