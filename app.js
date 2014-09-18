<<<<<<< HEAD
/**
 * This file is just meant to facilitate enketo-core development as a standalone library.
 *
 * When using enketo-core as a library inside your app, it is recommended to just **ignore** this file.
 * Place a replacement for this controller elsewhere in your app.
 */


requirejs( [ 'require-config' ], function( rc ) {
    requirejs( [ 'jquery', 'Modernizr', 'enketo-js/Form', 'file-manager' ],
        function( $, Modernizr, Form, fileManager ) {
            var loadErrors, form, formStr, modelStr;

            // if querystring touch=true is added, override Modernizr
            if ( getURLParameter( 'touch' ) === 'true' ) {
                Modernizr.touch = true;
                $( 'html' ).addClass( 'touch' );
            }
=======
requirejs.config( {
    baseUrl: "enketo-core/lib",
    paths: {
        "enketo-js": "../src/js",
        "enketo-widget": "../src/widget",
        "enketo-config": "../config.json",
        "text": "text/text",
        "xpath": "xpath/build/xpathjs_javarosa",
        "file-manager": "../src/js/file-manager",
        "jquery": "bower-components/jquery/dist/jquery",
        "jquery.xpath": "jquery-xpath/jquery.xpath",
        "jquery.touchswipe": "jquery-touchswipe/jquery.touchSwipe",
        "leaflet": "leaflet/leaflet",
        "bootstrap-slider": "bootstrap-slider/js/bootstrap-slider",
        "q": "bower-components/q/q"
    },
    shim: {
        "xpath": {
            exports: "XPathJS"
        },
        "bootstrap": {
            deps: [ "jquery" ],
            exports: "jQuery.fn.popover"
        },
        "widget/date/bootstrap3-datepicker/js/bootstrap-datepicker": {
            deps: [ "jquery" ],
            exports: "jQuery.fn.datepicker"
        },
        "widget/time/bootstrap3-timepicker/js/bootstrap-timepicker": {
            deps: [ "jquery" ],
            exports: "jQuery.fn.timepicker"
        },
        "Modernizr": {
            exports: "Modernizr"
        },
        "leaflet": {
            exports: "L"
        }
    }
} );

define('jquery', [], function() {
    return jQuery;
});

define('cordovaMediaManager', [], function() {
    return cordovaMediaManager;
});

var loadEnketo = function(options){
    var localStore = options.localStore;

    requirejs( [ 'jquery', 'Modernizr', 'enketo-js/Form'],
    function( $, Modernizr, Form) {
        var loadErrors;
        var global_data;
        //if querystring touch=true is added, override Modernizr
        if ( getURLParameter( 'touch' ) === 'true' ) {
            Modernizr.touch = true;
            $( 'html' ).addClass( 'touch' );
        }

        localStore.getProjectById(options.project_uuid).then(function(project){
            var data = project.xform;
            var edit_xml = "";
            
            var submissionPromise;
            if(options.isServerSubmission)
                submissionPromise = options.getSubmissionFromServer(options.submission_id);
            else
                submissionPromise = localStore.getSubmissionById(options.submission_id);
>>>>>>> Yogesh || Photo initial changes

            // check if HTML form is hardcoded or needs to be retrieved
            if ( getURLParameter( 'xform' ) !== 'null' ) {
                $( '.guidance' ).remove();
<<<<<<< HEAD
                $.getJSON( 'http://xslt-dev.enketo.org/transform?xform=' + getURLParameter( 'xform' ), function( survey ) {
                    formStr = survey.form;
                    modelStr = survey.model;
                    $( '.form-header' ).after( formStr );
                    initializeForm();
                } );
            } else if ( $( 'form.or' ).length > 0 ) {
                $( '.guidance' ).remove();
                modelStr = globalModelStr;
                initializeForm();
=======
                data = data.replace( /jr\:template=/gi, 'template=' );
                $data = $( $.parseXML( data ) );
                $($data.find( 'form:eq(0)' )[0]).find("#form-title").remove();
                formStr = ( new XMLSerializer() ).serializeToString( $data.find( 'form:eq(0)' )[ 0 ] );
                modelStr = ( new XMLSerializer() ).serializeToString( $data.find( 'model:eq(0)' )[ 0 ] );
                $( '#validate-form' ).before( formStr );
                initializeForm(edit_xml);
            });
        });

        //validate handler for validate button

        var button = $( '#validate-form' );
        if(options.isServerSubmission)
            button.hide();

        button.html(options.buttonLabel);
        button.on( 'click', function() {
            form.validate();
            if ( !form.isValid() ) {
                options.onError('error!!!');
            } else {
                    var submission = {};
                    submission.project_uuid = options.project_uuid;
                    submission.xml = form.getDataStr();
                    console.log('output submission.xml: ' + submission.xml);

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
                    submission.created = options.getDate();
                    addMediaInfo(submission);

                    if (options.submission_id == 'null') {
                        console.log('submission keys after addMediaInfo: ' + Object.keys(submission));
                        console.log('saving submission: ' + JSON.stringify(submission));
                        localStore.createSubmission(submission).then(function(submission) {
                            console.log('submission keys while saving: ' + Object.keys(submission));
                            form.resetView();
                            initializeForm("");
                            options.onSuccess('Saved');
                        }, function(error) {
                            console.log(error);
                        });
                    } else {
                        localStore.updateSubmission(options.submission_id, submission).then(function() {
                            options.onSuccess('Updated');
                            options.redirect("/submission-list/" + options.project_uuid);
                        }, function(error) {
                            console.log(error);
                        }); 
                    }
>>>>>>> Yogesh || Photo initial changes
            }

            // validate handler for validate button
            $( '#validate-form' ).on( 'click', function() {
                form.validate();
                if ( !form.isValid() ) {
                    alert( 'Form contains errors. Please see fields marked in red.' );
                } else {
                    alert( 'Form is valid! (see XML record and media files in the console)' );
                    console.log( 'record:', form.getDataStr() );
                    console.log( 'media files:', fileManager.getCurrentFiles() );
                }
            } );

            // initialize the form
            function initializeForm() {
                form = new Form( 'form.or:eq(0)', {
                    modelStr: modelStr
                } );
                // for debugging
                window.form = form;
                //initialize form and check for load errors
                loadErrors = form.init();
                if ( loadErrors.length > 0 ) {
                    alert( 'loadErrors: ' + loadErrors.join( ', ' ) );
                }
            }
<<<<<<< HEAD
=======
        }

        function addMediaInfo(submission) {
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
                if (unChangedFile) {
                    unChangedFiles.push(unChangedFile);
                }
            });
            console.log('newFilesAdded: ' + newFilesAdded.join(',') + '; unChangedFiles: ' + unChangedFiles.join(','));
            submission.new_files_added = newFilesAdded.join(',');
            submission.un_changed_files = unChangedFiles.join(',');
            console.log('submission keys in addMediaInfo: ' + Object.keys(submission));
        }

        //get query string parameter

        function getURLParameter( name ) {
            return decodeURI(
                ( RegExp( name + '=' + '(.+?)(&|$)' ).exec( location.search ) || [ , null ] )[ 1 ]
            );
        }
    });
};
>>>>>>> Yogesh || Photo initial changes

            // get query string parameter
            function getURLParameter( name ) {
                return decodeURI(
                    ( new RegExp( name + '=' + '(.+?)(&|$)' ).exec( location.search ) || [ null, null ] )[ 1 ]
                );
            }
        } );
} );
