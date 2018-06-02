'use strict';

// Dependencies
const fs				= require( 'fs' );
const path				= require( 'path' );
const setAdvTimeout		= require( './timeout' );
const BodyParser		= require( './middlewares/body_parser' );
const Session			= require( './middlewares/session_handler' );
const SessionHandler	= Session.SessionHandler;

// Define the object
let middlewaresContainer	= {};

middlewaresContainer.session	= ( options ) =>{
	return [( event ) =>{
		let sessionHandler	= new SessionHandler( event, options );
		sessionHandler.handle( ( err ) =>{
			if ( ! err )
			{
				event.next();
			}
			else
			{
				event.setError( err )
			}
		} );
	}];
};

/**
 * @brief	Middleware responsible for parsing the body data
 *
 * @param	Object options
 *
 * @return	Array
 */
middlewaresContainer.bodyParser	= ( options ) =>{
	return [( event ) =>
	{
		let bodyParser	= new BodyParser( event, options );
		bodyParser.parseBody( ( err ) =>{
			if ( ! err )
			{
				event.next();
			}
			else
			{
				event.setError( 'Could not parse the body' );
			}
		});
	}];
};

/**
 * @brief	Parses the given cookies and sets them to event.cookies
 *
 * @param	Object options
 * 			Accepts options:
 *
 * @return	Array
 */
middlewaresContainer.parseCookies	= ( options ) =>
{
	return [( event ) =>{
		let list = {},
			rc = event.headers.cookie;

		rc && rc.split( ';' ).forEach( function( cookie ) {
			let parts					= cookie.split( '=' );
			list[parts.shift().trim()]	= decodeURI( parts.join( '=' ) );
		});

		event.cookies	= list;
		event.next();
	}];
};

/**
 * @brief	Logs information about the current event
 *
 * @details	This should ideally be used after the static path middleware.
 * 			Accepts options:
 * 			- level - log level
 *
 * @param	Object options
 *
 * @return	Array
 */
middlewaresContainer.logger	= ( options ) => {
	return [( event ) => {
		event.logData( options.level );
		event.next();
	}];
};

/**
 * @brief	Sets the given path as the static path where resources can be delivered easily
 *
 * @param	string staticPath
 * 			Accepts options:
 * 			- path - the path to make static
 *
 * @return	Array
 */
middlewaresContainer.addStaticPath	= ( options ) => {
	let regExp	= new RegExp( '^(\/' + options.path + ')' );

	return [regExp, ( event ) => {
		let item	= path.join( __dirname + '/../../' + event.path );
		fs.readFile( item, {}, ( err, data ) => {
			if ( ! err && data )
			{
				event.send( data, 200, true );
			}
			else
			{
				event.setError( 'File not found' );
			}
		});
	}];
};

/**
 * @brief	Adds a timeout middleware that will cause the event to timeout after a sepcific time
 *
 * @param	string staticPath
 * 			Accepts options:
 * 			- timeout - the amount in seconds to cause the timeout defaults to 60
 *
 * @return	Array
 */
middlewaresContainer.timeout	= ( options ) =>
{
	let timeout	= typeof options.timeout === 'number' ? parseInt( options.timeout ) : 60;

	return [( event ) => {
		event.internalTimeout	= setAdvTimeout( () => {
				console.log( 'Request timed out', event.path );
				if ( ! event.isFinished() )
				{
					event.serverError( 'TIMEOUT' );
				}
			},
			timeout
		);

		event.next();
	}];
};

// Export the module
module.exports	= middlewaresContainer;
