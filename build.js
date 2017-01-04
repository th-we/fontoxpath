const peg = require('pegjs');
const fs = require('fs');
const Compiler = new require('google-closure-compiler').compiler;
const UglifyJS = require('uglify-js');
const path = require('path');

new Promise((resolve, reject) => fs.readFile('./src/parsing/xpath.pegjs', 'utf8', (err, file) => err ? reject(err) : resolve(file)))
	.then(pegJsString => peg.generate(pegJsString, {
		cache: true,
		output: 'source',
		format: 'globals',
		exportVar: 'xPathParser'
	}))
	.then(parserString => UglifyJS.minify([parserString], { fromString: true }).code)
	.then(parserString => `export default ${JSON.stringify(parserString)};`)
	.then(parserString => new Promise((resolve, reject) => fs.writeFile('./src/parsing/xPathParser.raw.js', parserString, (err) => err ? reject(err) : resolve())))
	.then(() => console.info('Parser generator done'))
	.then(() => {
		const compiler = new Compiler({
				  assume_function_wrapper: true,
				  language_in: 'ES6',
				  language_out: 'ES5',
				  create_source_map: './dist/selectors.js.map',
				  // jscomp_warning: ['accessControls', 'checkDebuggerStatement', 'const', 'deprecatedAnnotations', 'deprecated', 'missingReturn', 'neCheckTypes', 'uselessCode'],
				  // jscomp_error: ['checkVars', 'duplicate', 'missingProperties', 'undefinedVars'],
				  warning_level: 'VERBOSE',
				  debug: true,
				  compilation_level: 'ADVANCED',
				  externs: path.resolve('./externs/IDomFacade.js'),
				  output_wrapper: `
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.selectors = factory();
    }
})(this, function () {
	var workspace = {};
	%output%
	return workspace;
});
//# sourceMappingURL=./selectors.js.map`,
				js_output_file: './dist/selectors.js',
				js: './src/**.js'
			});
		return new Promise((resolve, reject) => compiler.run((exitCode, stdOut, stdErr) => {
			resolve({
				exitCode,
				stdOut,
				stdErr
			});
		}));
	})
	.then(({ exitCode, stdOut, stdErr }) => {
		console.log(stdOut);
		console.log(stdErr);
		console.log(exitCode);
	})
	.catch(console.error.bind(console));
