module.exports = function(grunt) {
	grunt.config('clean', {
		options: {
			force: true /* delete files outside of current directory */
		},
		all: [
			'omnibus/**/*.min.js',
			'.temp'
		]
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
};
