define( [
	"../core"
], function( jQuery ) {


jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};

} );
