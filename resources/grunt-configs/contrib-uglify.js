module.exports = function(grunt) {
	grunt.config('uglify', {
		all: {
			files: [{
				expand: true,
				src: 'omnibus/**/omnibus/*.js',
				ext: '.min.js'
			}]
		},
		options: {
			preserveComments: 'some',
			report: 'min'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};
