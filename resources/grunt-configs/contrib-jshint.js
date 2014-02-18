module.exports = function(grunt) {
	grunt.config('jshint', {
		all: [
			'Gruntfile.js',
			'resources/grunt-configs/*.js',
			'omnibus/**/src/*.js',
			'testing/jstests/**/*.js'
		],
		options: {
			jshintrc: '.jshintrc'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
};
