var loadEnketo = function(options){

    requirejs( [ 'require-config' ], function( rc ) {
        requirejs( [ 'jquery', 'Modernizr', 'enketo-js/Form', 'file-manager' ],
            function( $, Modernizr, Form, fileManager ) {

        var loadErrors, global_data, submission_uuid;
        if ( getURLParameter( 'touch' ) === 'true' ) {
            Modernizr.touch = true;
            $( 'html' ).addClass( 'touch' );
        }

        var resetForm = function() {
            if(typeof(form) == "undefined") return;
            form.resetView();
            form.resetHTML();
        };

        resetForm();
        var data = options.xform;
        var edit_xml = options.submissionXml;
        $( '.guidance' ).remove();
        data = data.replace( /jr\:template=/gi, 'template=' );
        $data = $( $.parseXML( data ) );
        $($data.find( 'form:eq(0)' )[0]).find("#form-title").remove();
        formStr = ( new XMLSerializer() ).serializeToString( $data.find( 'form:eq(0)' )[ 0 ] );
        modelStr = ( new XMLSerializer() ).serializeToString( $data.find( 'model:eq(0)' )[ 0 ] );
        $( '.form-header' ).after( formStr );
        initializeForm(edit_xml);

        var button = $( '#validate-form' );
        if(options.hideButton)
            button.hide();

        button.html(options.buttonLabel);
        button.on( 'click', function() {
            form.validate();
            if ( !form.isValid() )
                options.onError('error!!!');
            else {
                var submission = {};
                submission.xml = form.getDataStr();
                submission.created = new Date().toJSON();
                var parsedData = xmlToJson.xml_str2json(submission.xml);
                for(k in parsedData) // this will loop once
                    var json_data = parsedData[k];

                delete json_data.meta;

                var value;
                // TODO update to support repeat inside group
                for (var dataIndex in json_data) {
                    value = json_data[dataIndex];
                    // hack to make single repeat data in array as xml_to_json for single child converts to object than object array
                    if (typeof value == "object" && !(value instanceof Array))
                        json_data[dataIndex] = [value];
                };

                submission.data = JSON.stringify(json_data);
                addMediaInfo(submission);
                options.onButtonClick(submission, resetForm);
            }
          });

        var addMediaInfo = function(submission) {
            var newFilesAdded = [], unChangedFiles = [];
            var mediaInputs = $('form.or input[type="file"]') || [];
            console.log('mediaInputs + ' + mediaInputs + '; length: ' + mediaInputs.length);

            $.each(mediaInputs, function() {
                var newFileInputed = $(this).attr('data-previous-file-name');
                console.log('newFileInputed + ' + newFileInputed);
                if (newFileInputed) {
                    newFilesAdded.push(newFileInputed);
                }
                var unChangedFile = $(this).attr('data-loaded-file-name');
                console.log('unChangedFile + ' + unChangedFile);
                if (unChangedFile) {
                    unChangedFiles.push(unChangedFile);
                }
            });
            console.log('newFilesAdded: ' + newFilesAdded.join(',') + '; unChangedFiles: ' + unChangedFiles.join(','));
            submission.new_files_added = newFilesAdded.join(',');
            submission.un_changed_files = unChangedFiles.join(',');
            console.log('submission keys in addMediaInfo: ' + Object.keys(submission));
        };

        function initializeForm(dataStrToEdit ) {
            form = new Form( 'form.or:eq(0)', {
                modelStr: modelStr,
                instanceStr: dataStrToEdit
            } );
            //for debugging
            window.form = form;
            //initialize form and check for load errors
            loadErrors = form.init();
            if ( loadErrors.length > 0 ) {
                alert( 'loadErrors: ' + loadErrors.join( ', ' ) );
            }
        };

        function getURLParameter( name ) {
            return decodeURI(
                ( RegExp( name + '=' + '(.+?)(&|$)' ).exec( location.search ) || [ , null ] )[ 1 ]
            );
        }
    } );
    } );
};
