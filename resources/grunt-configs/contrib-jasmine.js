module.exports = function(grunt) {
	grunt.config('jasmine', {
		all: {
			src: ['omnibus/static/**/src/**/*.js'],
			options: {
				specs: ['testing/jstests/specs-*.js'],
				keepRunner: true,
				outfile: '.specsrunner.html',
				template: require('grunt-template-jasmine-istanbul'),
				templateOptions: {
					coverage: '.grunt/coverage/coverage.json',
					report: '.grunt/coverage/',
					template: require('grunt-template-jasmine-requirejs')
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jasmine');
};
