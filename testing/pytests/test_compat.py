from omnibus.compat import split_domain_port


class TestCompat:

    def test_split_domain_port(self):
        assert split_domain_port('localhost:8000') == ('localhost', '8000')
        assert split_domain_port('invalid dasdaw  dawdad') == ('', '')
        assert split_domain_port('[fe80::bca9:68ff:feb4:bdc4]') == ('[fe80::bca9:68ff:feb4:bdc4]', '')  # noqa
        assert split_domain_port('[fe80::bca9:68ff:feb4:bdc4]:8000') == ('[fe80::bca9:68ff:feb4:bdc4]', '8000')  # noqa
