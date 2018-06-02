'use strict';

// Dependencies
const FileStream	= require( './file_stream' );
const path			= require( 'path' );
const fs			= require( 'fs' );

/**
 * @brief	Used to stream mp4 files
 */
class Mp4FileStream extends FileStream
{
	constructor( event )
	{
		super( event );
		this.SUPPORTED_FORMATS	= ['.mp4'];
	}

	/**
	 * @brief	Returns whether this file stream supports the given file
	 *
	 * @param	String file
	 *
	 * @return	Boolean
	 */
	supports( file )
	{
		file	= path.parse( file );
		return this.SUPPORTED_FORMATS.indexOf( file.ext ) !== -1;
	}

	/**
	 * @brief	Streams the file given
	 *
	 * @param	String file
	 *
	 * @return	void
	 */
	stream( file )
	{
		if ( ! fs.existsSync( file ) )
		{
			this.event.setError( 'File not found' );
			return;
		}

		let stat		= fs.statSync( file );
		let fileSize	= stat.size;
		let range		= this.event.headers.range;

		this.event.clearTimeout();
		if ( range )
		{
			let parts	= range.replace( /bytes=/, "" ).split( "-" );
			let start	= parseInt( parts[0], 10 );
			let end		= parts[1]
						? parseInt(parts[1], 10)
						: fileSize - 1;

			this.event.setHeader( 'Content-Range', `bytes ${start}-${end}/${fileSize}` );
			this.event.setHeader( 'Accept-Ranges', 'bytes' );
			this.event.setHeader( 'Content-Length', ( end - start ) + 1 );
			this.event.setHeader( 'Content-Type', 'video/mp4' );
			this.event.response.statusCode	= 206;

			file	= fs.createReadStream( file, { start, end } );
			file.pipe( this.event.response );
		}
		else
		{
			this.event.setHeader( 'Content-Length', fileSize );
			this.event.setHeader( 'Content-Type', 'video/mp4' );
			this.event.response.statusCode	= 200;

			file	= fs.createReadStream( file );
			file.pipe( this.event.response );
		}
	}
}

module.exports	= Mp4FileStream;
