module.exports = function(grunt) {
	grunt.config('shell', {
		opencoverage: {
			command: 'open ./.grunt/coverage/index.html'
		},

		openjsdoc: {
			command: 'open ./.grunt/jsdoc/index.html'
		}
	});

	grunt.loadNpmTasks('grunt-shell');
};
