module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
	});

	grunt.loadTasks('resources/grunt-configs');

	grunt.registerTask(
		'validate',
		'Validate client code.',
		['jshint', 'jscs', 'lintspaces']
	);

	grunt.registerTask(
		'test',
		'Test client code.',
		['jasmine', 'shell:opencoverage']
	);

	grunt.registerTask(
		'build',
		'Create a bundled and minified version.',
		['requirejs', 'copy', 'clean', 'uglify']
	);

	grunt.registerTask(
		'doc',
		'Create a documentation',
		['jsdoc', 'shell:openjsdoc']
	);

	grunt.registerTask(
		'default',
		'Run all tasks.',
		['validate', 'test', 'build', 'doc']
	);
};
