'use strict';
/*jshint ignore:start*/
var require = {
  scalejs: {
    extensions: [
      '<%=ext_name%>'
    ]
  },
  map: {
    '*': {
      'scalejs.core': 'empty:'
    }
  },
  paths: {
    requirejs: '../bower_components/requirejs/require',
    scalejs: '../bower_components/scalejs/dist/scalejs',
    jsep: '../bower_components/jsep/build/jsep',
    knockout: '../bower_components/knockout/dist/knockout',
    almond: '../bower_components/almond/almond',
    'knockout.mapping': '../bower_components/knockout.mapping/knockout.mapping',
    'scalejs.functional': '../bower_components/scalejs.functional/dist/scalejs.functional.min',
    'scalejs.metadata-factory': '../bower_components/scalejs.metadata-factory/dist/scalejs.metadata-factory',
    'scalejs.mvvm': '../bower_components/scalejs.mvvm/dist/scalejs.mvvm',
    text: '../bower_components/text/text',
    'scalejs.application': '../bower_components/scalejs/src/scalejs.application',
    'scalejs.core': '../bower_components/scalejs/src/scalejs.core',
    'scalejs.sandbox': '../bower_components/scalejs/src/scalejs.sandbox'
  },
  packages: [

  ],
  shim: {

  }
};
/*jshint ignore:end*/

