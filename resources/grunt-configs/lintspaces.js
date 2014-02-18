module.exports = function(grunt) {
	grunt.config('lintspaces', {
		all: {
			src: [
				'Gruntfile.js',
				'resources/grunt-configs/*.js',
				'omnibus/**/src/*.js',
				'testing/jstests/**/*.js'
			],
			options: {
				editorconfig: '.editorconfig',
				ignores: ['js-comments']
			}
		}
	});

	grunt.loadNpmTasks('grunt-lintspaces');
};
