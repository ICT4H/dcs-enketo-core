define( [ 'jquery', 'enketo-js/Widget', 'cordovaMediaManager' ], function( $, Widget, cordovaMediaManager ) {
    "use strict";

    var pluginName = 'cordovaFilepicker';

    function CordovaFilepicker( element, options, e ) {
        if ( e ) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.namespace = pluginName;
        Widget.call( this, element, options );
        this._init();
    }

    //copy the prototype functions from the Widget super class
    CordovaFilepicker.prototype = Object.create( Widget.prototype );

    //ensure the constructor is the new one
    CordovaFilepicker.prototype.constructor = CordovaFilepicker;

    /**
     * initialize
     *
     */
    CordovaFilepicker.prototype._init = function() {
        var $input = $( this.element ),
            existingFileName = $input.attr( 'data-loaded-file-name' ),
            that = this;
        
        this.mediaType = $input.attr( 'accept' );

        $input
            .attr( 'disabled', 'disabled' )
            .addClass( 'transparent' )
            .parent().addClass( 'with-media clearfix' );

        this.$widget = $(
            '<div class="widget file-picker">' +
            '<div class="media-buttons"></div>' +
            '<div class="fake-file-input"></div>' +
            '<div class="file-feedback"></div>' +
            '<div class="file-preview"></div>' +
            '</div>' )
            .insertAfter( $input );
        this.$feedback = this.$widget.find( '.file-feedback' );
        this.$mediaButtons = this.$widget.find( '.media-buttons' );
        this.$preview = this.$widget.find( '.file-preview' );
        this.$fakeInput = this.$widget.find( '.fake-file-input' );

        console.log('existingFileName : ' + existingFileName);
        if ( existingFileName ) {
            this._showFileName(existingFileName);
            cordovaMediaManager.fileNameToURL(existingFileName, function(url) {
                that._showPreview(url, that.mediaType);    
            });
        }

        if ( navigator && navigator.camera ) {
            addCustomMediaButtons(that);
        }
    };

    function addCustomMediaButtons(that) {
        addCameraHandlers(that);
        addGalleryHandlers(that);
    }

    function addCameraHandlers(that) {
        var callbacks = _getFileSeletedCallbacks(that);

        var captureButton = createCameraButton(callbacks);
        that.$mediaButtons.append(captureButton);
    }

    function addGalleryHandlers(that) {
        var callbacks = _getFileSeletedCallbacks(that);

        var galleryButton = createGalleryButton(callbacks);
        that.$mediaButtons.append(galleryButton);
    }

    function _getFileSeletedCallbacks(that) {
        return {
            success: function(newFileUrl, newFileName) {
                updateView(that, newFileUrl, newFileName)
            }, error: function() {
                console.log('error in postCapture');
            }
        };
    }

    function createCameraButton(callbacks) {
        return getButton({
            label: 'Camera',
            clickHandler: function() {
                cordovaMediaManager.captureAndMove(callbacks);
            }
        });
    }

    function createGalleryButton(callbacks) {
        return getButton({
            label: 'Gallery',
            clickHandler: function() {
                cordovaMediaManager.copyFromGallery(callbacks);
            }
        });
    }

    function getButton(options) {
        return $('<button />', {
            type  : 'button',
            html : options.label,
            id    : 'btn_capture',
            on    : {
                click: options.clickHandler
            }
        });
    }

    function updateView(that, imageUrl, newFileName) {
        console.log('in updateView');
        var $input = $( that.element );

        $input.attr('data-previous-file-name', newFileName);
        $input.removeAttr( 'data-loaded-file-name' );
        that._showPreview( imageUrl, that.mediaType );
        that._showFeedback( '' );
        that._showFileName( newFileName );
        $input.trigger( 'change.file' );

    }

    CordovaFilepicker.prototype._getMaxSubmissionSize = function() {
        var maxSize = $( document ).data( 'maxSubmissionSize' );
        return maxSize || 5 * 1024 * 1024;
    };


    CordovaFilepicker.prototype._showFileName = function( file ) {
        var fileName = ( typeof file === 'object' && file.name ) ? file.name : file;
        this.$fakeInput.text( fileName );
    };

    CordovaFilepicker.prototype._showFeedback = function( message, status ) {
        message = message || '';
        status = status || '';
        // replace text and replace all existing classes with the new status class
        this.$feedback.text( message ).attr( 'class', 'file-feedback ' + status );
    };

    CordovaFilepicker.prototype._showPreview = function( url, mediaType ) {
        var $el;

        this.$widget.find( '.file-preview' ).empty();

        switch ( mediaType ) {
            case 'image/*':
                $el = $( '<img />' );
                break;
            case 'audio/*':
                $el = $( '<audio controls="controls"/>' );
                break;
            case 'video/*':
                $el = $( '<video controls="controls"/>' );
                break;
            default:
                $el = $( '<span>No preview for this mediatype</span>' );
                break;
        }

        if ( url ) {
            this.$preview.append( $el.attr( 'src', url ) );
        }
    };

    CordovaFilepicker.prototype.destroy = function( element ) {
        $( element )
        //data is not used elsewhere by enketo
        .removeData( this.namespace )
        //remove all the event handlers that used this.namespace as the namespace
        .off( '.' + this.namespace )
        //show the original element
        .show()
        //remove elements immediately after the target that have the widget class
        .next( '.widget' ).remove().end()
        //console.debug( this.namespace, 'destroy' );
        .siblings( '.file-feedback, .file-preview, .file-loaded' ).remove();
    };

    /**
     *
     */
    $.fn[ pluginName ] = function( options, event ) {

        options = options || {};

        return this.each( function() {
            var $this = $( this ),
                data = $this.data( pluginName );

            //only instantiate if options is an object (i.e. not a string) and if it doesn't exist already
            if ( !data && typeof options === 'object' ) {
                $this.data( pluginName, ( data = new CordovaFilepicker( this, options, event ) ) );
            }
            //only call method if widget was instantiated before
            else if ( data && typeof options == 'string' ) {
                //pass the element as a parameter as this is used in fix()
                data[ options ]( this );
            }
        } );
    };

} );
