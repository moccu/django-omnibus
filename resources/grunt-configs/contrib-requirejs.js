function removeTrailingWhiteSpaces(content) {
	return content.replace(/\s*$/, '');
}

module.exports = function(grunt) {
	grunt.config('requirejs', {
		all: {
			options: {
				name: 'omnibus/static/omnibus/src/Connection',
				out: '.temp/omnibus.js',
				optimize: 'none',
				onBuildWrite: function (moduleName, path, content) {
					grunt.log.ok('processing ' + path);

					// Replace only keep content between AMD define-definition
					// and the last return statement:
					// (also remove trailing white spaces)
					content = content.replace(/define\([\w\W]*?\{([\w\W]*)return[\w\W]*?$/, '$1');
					content = removeTrailingWhiteSpaces(content);
					return content;
				},
				onModuleBundleComplete: function(data) {
					// Wrap generated content with template
					var
						pkg = grunt.file.readJSON('package.json'),
						templatePath = 'omnibus/static/omnibus/src/wrapper/wrapper.js.tpl',
						template = grunt.file.read(templatePath),
						content = grunt.file.read(data.path),
						context = {
							content: content,
							version: pkg.version,
							author: pkg.author,
							contributors: pkg.contributors
						},
						out = grunt.template.process(
							template,
							{data: context}
						)
					;

					out = removeTrailingWhiteSpaces(out);
					grunt.file.write(data.path, out);
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-requirejs');
};
