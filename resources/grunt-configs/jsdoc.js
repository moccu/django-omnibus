module.exports = function(grunt) {
	grunt.config('jsdoc', {
		all: {
			src: [
				'omnibus/**/src/*.js'
			],
			options: {
				destination: '.grunt/jsdoc'
			}
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');
};
