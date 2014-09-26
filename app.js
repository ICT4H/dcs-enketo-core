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
        var loadErrors, global_data, submission_uuid;
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

            submissionPromise.then(function(submission){
                if(options.submission_id != "null"){
                    edit_xml = submission.xml;
                    submission_uuid = submission.submission_uuid;
                    console.log('loaded from db submission.xml: ' + submission.xml);
                }
                $( '.guidance' ).remove();
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
                    submission.submission_id = options.submission_id;
                    if (submission_uuid)
                        submission.submission_uuid = submission_uuid;

                    addMediaInfo(submission);
                    options.saveSubmission(submission, function() {
                        form.resetView();
                        initializeForm("");
                    });
            }

          });

        //initialize the form

        function initializeForm(dataStrToEdit ) {
            form = new Form( 'form.or:eq(0)', modelStr, dataStrToEdit );
            //for debugging
            window.form = form;
            //initialize form and check for load errors
            loadErrors = form.init();
            if ( loadErrors.length > 0 ) {
                alert( 'loadErrors: ' + loadErrors.join( ', ' ) );
            }
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
                console.log('unChangedFile + ' + unChangedFile);
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

