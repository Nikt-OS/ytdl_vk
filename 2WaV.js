
convertMp3ToWav = function (input) {
	let segments = input.split('/');

	let filename = segments[segments.length - 1];
	let extension = filename.split('.')[1];

	let name = filename.split('.')[0];

	let folder = input.replace(filename, '');
	let output = folder + name + '.wav';
	console.log("\Converting file %s", output)

	var ffmpeg = require('fluent-ffmpeg');
	var command = ffmpeg(input)
		.inputFormat('mp3')
		.audioCodec('pcm_s16le')
		.format('wav')
		.save(output)

	return output;
}


convertFiles = function (path, options) {
	return new Promise((resolve, reject) => {

		// Load modules
		const fs = require('fs');

		// Is argument a file?
		if (fs.statSync(path).isFile()) {

			// mp3
			if (path.endsWith(options.from)) {
				let result = convertMp3ToWav(path, options);
				console.log(result);
				resolve()
			}

		}

		console.log('\nCrawling directory \'%s\'', path);

		// Search for all audio files in folder
		fs.readdir(path, (err, files) => {

			let readFolderActions = [];

			// Process all found files
			if (files) {
				files.forEach(file => {
					let filePath = path + '/' + file;
					let readItem = null;

					// is folder
					if (fs.statSync(filePath).isDirectory()) {
						readItem = convertFiles(filePath, options);
					}
					// Not folder
					else {
						// is PDF
						if (file.endsWith(options.from)) {
							convertMp3ToWav(filePath, options);
						}
					}

					readFolderActions.push(readItem);
				});
			} else {
				reject('Directorio %s not found.', path);
			}

			// Wait for all actions to be processed
			Promise.all(readFolderActions).then((results) => {
				resolve();
			})
		})
	});
}
module.exports.convertFiles
convertFiles(process.argv[2], {from: 'mp3'});