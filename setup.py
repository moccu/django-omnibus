import codecs
import os
import sys
from setuptools import setup, find_packages
from setuptools.command.test import test as TestCommand


def read(*parts):
    filename = os.path.join(os.path.dirname(__file__), *parts)
    with codecs.open(filename, encoding='utf-8') as fp:
        return fp.read()


test_requires = [
    'pytest>=2.5.2',
    'pytest-cov>=1.6',
    'pytest-flakes>=0.2',
    'pytest-pep8>=1.0.5',
    'pytest-django>=2.6',
    'mock==1.0.1',
    'pep8==1.4.6'
]


install_requires = [
    'Django>=1.4',
    'pyzmq==14.1.1',
    'tornado==3.1.1',
    'sockjs-tornado>=1.0.0',
]


dev_requires = [
    'tox',
]


docs_requires = [
    'sphinx',
    'sphinx_rtd_theme'
]


class PyTest(TestCommand):
    user_options = [('cov=', None, 'Run coverage'),
                    ('cov-xml=', None, 'Generate junit xml report'),
                    ('cov-html=', None, 'Generate junit html report'),
                    ('junitxml=', None, 'Generate xml of test results'),
                    ('clearcache', None, 'Clear cache first')]
    boolean_options = ['clearcache']

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.cov = None
        self.cov_xml = False
        self.cov_html = False
        self.junitxml = None
        self.clearcache = False

    def run_tests(self):
        import pytest

        params = {'args': self.test_args}

        if self.cov is not None:
            params['plugins'] = ['cov']
            params['args'].extend(['--cov', self.cov, '--cov-report', 'term-missing'])
            if self.cov_xml:
                params['args'].extend(['--cov-report', 'xml'])
            if self.cov_html:
                params['args'].extend(['--cov-report', 'html'])
        if self.junitxml is not None:
            params['args'].extend(['--junitxml', self.junitxml])
        if self.clearcache:
            params['args'].extend(['--clearcache'])

        self.test_suite = True

        errno = pytest.main(**params)
        sys.exit(errno)


setup(
    name='django-omnibus',
    version='0.1.0',
    description='Django/JavaScript WebSocket Connections',
    long_description=read('README.md'),
    author='Stephan Jaekel, Norman Rusch',
    author_email='info@moccu.com',
    url='https://github.com/moccu/django-omnibus/',
    packages=find_packages(exclude=[
        'testing',
        'testing.pytests',
        'examples',
    ]),
    include_package_data=True,
    extras_require={
        'docs': docs_requires,
        'tests': test_requires,
        'dev': dev_requires,
    },
    test_suite='.',
    install_requires=install_requires,
    cmdclass={'test': PyTest},
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: Implementation :: PyPy',
        'Programming Language :: Python :: Implementation :: CPython',
        'Framework :: Django',
    ],
    zip_safe=False,
)
