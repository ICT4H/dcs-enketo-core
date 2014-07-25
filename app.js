<<<<<<< HEAD
/**
 * This file is just meant to facilitate enketo-core development as a standalone library.
 *
 * When using enketo-core as a library inside your app, it is recommended to just **ignore** this file.
 * Place a replacement for this controller elsewhere in your app.
 */

=======
requirejs.config( {
    baseUrl: "../lib",
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

        var edit_xml = "";
        var data, generatedName;
            localStore.getProjectById(options.project_id).then(function(project){
                data = project.xform;
                localStore.getSubmissionById(options.submission_id).then(function(submission){
                    if(submission != undefined){
                        edit_xml = submission.xml;
                    }
                    $( '.guidance' ).remove();
                    // global to support update
                    // global_data = result;
                    //this replacement should move to XSLT after which the GET can just return 'xml' and $data = $(data)
                    data = data.replace( /jr\:template=/gi, 'template=' );
                    $data = $( $.parseXML( data ) );
                    var titleNode = $($data.find( 'form:eq(0)' )[0]).find("#form-title");
                    generatedName = titleNode.text();
                    titleNode.remove();
                    formStr = ( new XMLSerializer() ).serializeToString( $data.find( 'form:eq(0)' )[ 0 ] );
                    modelStr = ( new XMLSerializer() ).serializeToString( $data.find( 'model:eq(0)' )[ 0 ] );
                    $( '#validate-form' ).before( formStr );
                    initializeForm(edit_xml);
                });
            });

        //validate handler for validate button
        var button = $( '#validate-form' );
        button.html(options.buttonLabel);
        button.on( 'click', function() {
            form.validate();
            if ( !form.isValid() ) {
                options.onError('error!!!');
            } else {
                    var submission = {};
                    submission.project_id = options.project_id;
                    submission.xml = form.getDataStr();
                    var json_data = xmlToJson.xml_str2json(submission.xml)[generatedName];
                    delete json_data.meta;
                    submission.data = JSON.stringify(json_data);
                    submission.created = options.getDate();
>>>>>>> Suraj/Yogesh || Fix empty project name during edit/save of submission

requirejs( [ 'require-config' ], function( rc ) {
    requirejs( [ 'jquery', 'Modernizr', 'enketo-js/Form', 'file-manager' ],
        function( $, Modernizr, Form, fileManager ) {
            var loadErrors, form, formStr, modelStr;

            // if querystring touch=true is added, override Modernizr
            if ( getURLParameter( 'touch' ) === 'true' ) {
                Modernizr.touch = true;
                $( 'html' ).addClass( 'touch' );
            }

            // check if HTML form is hardcoded or needs to be retrieved
            if ( getURLParameter( 'xform' ) !== 'null' ) {
                $( '.guidance' ).remove();
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

            // get query string parameter
            function getURLParameter( name ) {
                return decodeURI(
                    ( new RegExp( name + '=' + '(.+?)(&|$)' ).exec( location.search ) || [ null, null ] )[ 1 ]
                );
            }
        } );
} );
