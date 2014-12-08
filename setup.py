import codecs
import os
from setuptools import setup, find_packages


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
    'ws4py==0.3.4',
    'mock==1.0.1',
    'pep8==1.4.6'
]


install_requires = [
    'Django>=1.4',
    'pyzmq==14.4.1',
    'tornado==4.0.2',
    'sockjs-tornado>=1.0.0',
]


dev_requires = [
    'tox',
]


docs_requires = [
    'sphinx',
    'sphinx_rtd_theme'
]


setup(
    name='django-omnibus',
    version='0.2.0',
    description='Django/JavaScript WebSocket Connections',
    long_description=read('README.md'),
    author='Moccu GmbH & Co. KG',
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
    install_requires=install_requires,
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
