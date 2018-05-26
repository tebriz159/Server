'use strict';

// Dependencies
const Router	= require( './../../lib/server/router' );
const fs		= require( 'fs' );
const path		= require( 'path' );

let router		= new Router();

/**
 * @brief	Adds a '/upload' route with method POST
 *
 * @details	Saves the file async
 *
 * @details	Required Parameters: file
 * 			Optional Parameters: NONE
 *
 * @return	void
 */
router.add( '/upload', 'POST', ( event ) => {
	if ( typeof event.extra.files !== 'object' )
	{
		event.setError( 'No files were processed' );
	}

	let directory	= typeof event.body.directory === 'string'
					? event.body.directory
					: false;

	if ( directory === false )
	{
		event.setError( 'directory not supplied' );
		return ;
	}

	let files	= event.extra.files;

	for ( let index in files )
	{
		let file			= files[index];
		let fileLocation	= path.join( directory, file.filename );

		fs.writeFile( fileLocation, file.chunk , 'binary', ( err ) => {
			if ( err )
			{
				console.log( err );
			}

			console.log( 'file written' );
		});
	}

	event.redirect( '/browse?dir=' + directory );
});

// Export the module
module.exports	= router;