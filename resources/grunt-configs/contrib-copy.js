module.exports = function(grunt) {
	grunt.config('copy', {
		all: {
			src: '.temp/omnibus.js',
			dest: 'omnibus/static/omnibus/omnibus.js'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
};
