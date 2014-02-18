module.exports = function(grunt) {
	grunt.config('jscs', {
		all: [
			'Gruntfile.js',
			'resources/grunt-configs/*.js',
			'omnibus/**/src/*.js',
			'testing/jstests/**/*.js'
		]
	});

	grunt.loadNpmTasks('grunt-jscs-checker');
};
