from django.core.management.base import BaseCommand

from ...daamon import spawn_omnibusd


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        spawn_omnibusd()
