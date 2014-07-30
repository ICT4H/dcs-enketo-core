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
        var data;
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
                    $($data.find( 'form:eq(0)' )[0]).find("#form-title").remove();
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
                        });
                    }

                     
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

        //get query string parameter

        function getURLParameter( name ) {
            return decodeURI(
                ( RegExp( name + '=' + '(.+?)(&|$)' ).exec( location.search ) || [ , null ] )[ 1 ]
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

    });
};
