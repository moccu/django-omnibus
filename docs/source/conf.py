import os
import pkg_resources

extensions = []

templates_path = ['_templates']

source_suffix = '.rst'
master_doc = 'index'

project = u'django-omnibus'
copyright = u'2014, Moccu GmbH & Co. KG'

dist = pkg_resources.get_distribution('django_omnibus')
version = dist.version
release = dist.version

exclude_patterns = ['build']

pygments_style = 'sphinx'

# on_rtd is whether we are on readthedocs.org,
# this line of code grabbed from docs.readthedocs.org
on_rtd = os.environ.get('READTHEDOCS', None) == 'True'

if not on_rtd:
    # only import and set the theme if we're building docs locally
    import sphinx_rtd_theme
    html_theme = 'sphinx_rtd_theme'
    html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]

# html_theme_options = {}
# html_static_path = ['_static']
htmlhelp_basename = 'django-omnibusdoc'

latex_elements = {
    'papersize': 'a4paper',
    #'pointsize': '10pt',
}
latex_documents = [(
    'index', 'django-omnibus.tex', u'django-omnibus Documentation',
    'Moccu GmbH & Co. KG', 'manual'
)]

man_pages = [(
    'index', 'django-omnibus', u'django-omnibus Documentation',
    ['Moccu GmbH & Co. KG'], 1
)]

texinfo_documents = [(
    'index', 'django-omnibus', u'django-omnibus Documentation',
    'Moccu GmbH & Co. KG', 'django-omnibus',
    'Django/JavaScript WebSocket Connections', 'Miscellaneous'
)]
