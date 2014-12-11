define( [ 'jquery', 'enketo-js/Widget', 'fileSystem', 'deviceHandler' ], function( $, Widget, fileSystem, deviceHandler ) {
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
        var $fileInput = $( this.element ),
            existingFileName = $fileInput.attr( 'data-loaded-file-name' ),
            that = this;

        this.mediaType = $fileInput.attr( 'accept' );
        console.log('mediatype: ' + this.mediaType)

        initViewElements(this);

        console.log('existingFileName : ' + existingFileName);
        if ( existingFileName ) {
            this._showFileName(existingFileName);
            fileSystem.fileNameToURL(existingFileName, function(url) {
                that._showPreview(url, that.mediaType);
            });
        }

        addMediaButtons(this, fileSystem);
    };

    function initViewElements(that) {
        var $fileInput = $( that.element );
        $fileInput
            .attr( 'disabled', 'disabled' )
            .addClass( 'transparent' )
            .parent().addClass( 'with-media clearfix' );

        that.$widget = $(
            '<div class="widget file-picker">' +
            '<div class="media-buttons"></div>' +
            '<div class="fake-file-input"></div>' +
            '<div class="file-feedback"></div>' +
            '<div class="file-preview"></div>' +
            '</div>' )
            .insertAfter( $fileInput );
        that.$feedback = that.$widget.find( '.file-feedback' );
        that.$buttonContainer = that.$widget.find( '.media-buttons' );
        that.$preview = that.$widget.find( '.file-preview' );
        that.$fakeInput = that.$widget.find( '.fake-file-input' );
    }

    function addMediaButtons(that, fileSystem) {
        // TODO based on media type do the navigator check
        if ( navigator && navigator.device.capture.captureVideo ) {
            // this object should be a dependency
            var buttonFactory = new ButtonFactory(deviceHandler, fileSystem);
            var $buttons = buttonFactory.getButtons(that.mediaType, widgetCallbacks(that));

            appendButtons(that.$buttonContainer, $buttons);
        }
    }

    function appendButtons($containter, $buttons) {
        $.each($buttons, function(i, $button) {
            $containter.append($button);
        })
    }

    function widgetCallbacks(that) {
        return {
            success: function(fileUrl, fileName) {
                updateView(that, fileUrl, fileName);
            },
            error: function() {
                //TODO fix when fail to load media, but previous preview & file_name exists
                that._showFeedback( 'Media not selected.', 'warning' );
            }
        };
    }

    function updateView(that, mediaUrl, fileName) {
        console.log('in updateView');
        var $input = $( that.element );

        $input.attr('data-previous-file-name', fileName);
        $input.removeAttr( 'data-loaded-file-name' );
        that._showPreview( mediaUrl, that.mediaType );
        that._showFeedback( '' );
        that._showFileName( fileName );
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
