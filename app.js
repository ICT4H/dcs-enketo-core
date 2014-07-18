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
        var loadErrors;
        var global_data;
            // if querystring touch=true is added, override Modernizr
            if ( getURLParameter( 'touch' ) === 'true' ) {
                Modernizr.touch = true;
                $( 'html' ).addClass( 'touch' );
            }

            // check if HTML form is hardcoded or needs to be retrieved
            if ( getURLParameter( 'xform' ) !== 'null' ) {
            localStore.getProjectById(options.project_id).then(function(project){
                data = project.xform;
                localStore.getSubmissionById(options.submission_id).then(function(submission){
                    if(submission != undefined){
                        edit_xml = submission.xml;
                    }
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
        button.html(options.buttonLabel);
        button.on( 'click', function() {
                form.validate();
                if ( !form.isValid() ) {
                    alert( 'Form contains errors. Please see fields marked in red.' );
                } else {
                    alert( 'Form is valid! (see XML record and media files in the console)' );
                    console.log( 'record:', form.getDataStr() );
                    console.log( 'media files:', fileManager.getCurrentFiles() );
                    delete json_data.meta;
                    submission.data = JSON.stringify(json_data);

                    if (options.submission_id == 'null') {
                        localStore.createSubmission(submission).then(function(submission) {
                            form.resetView();
                            options.onSuccess('Saved');
                            localStore.updateSubmissionStatus(submission.submission_id, 'changed');
                        }, function(error) {
                            console.log(error);
                        });
                    } else {
                        localStore.updateSubmissionData(options.submission_id, submission).then(function() {
                            form.resetView();
                            options.onSuccess('Updated');
                            localStore.updateSubmissionStatus(options.submission_id, 'changed');
                        }, function(error) {
                            console.log(error);
                }

                     
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

        var excludeMap = {'_id':true, 'eid': true, 'form_code': true, 'meta': true};

        function submissionHtml(data){
           var html = '<ul>';
           for(item in data){
               if(excludeMap[item])
                    continue;
                
               html += '<li>';               
               if(typeof(data[item]) === 'object'){ // An array will return 'object'
                       html += item; // Submenu found, but top level list item.
                       html += ':'+ submissionHtml(data[item]); // Submenu found. Calling recursively same method (and wrapping it in a div)
               } else {
                   html += item + ':' + data[item]; // No submenu
               }
               html += '</li>';
           }
           html += '</ul>';
           return html;
       }

        } );
} );
