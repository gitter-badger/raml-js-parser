"use strict";

if (typeof window === 'undefined') {
  var raml = require('../lib/raml.js')
  var chai = require('chai')
    , expect = chai.expect
    , should = chai.should();
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
} else {
  var raml = RAML.Parser;
  chai.should();
}

describe('Parser', function() {
  describe('Reported Bugs', function () {
    it('should fail unsupported raml version:RT-180', function(done) {
      var definition = [
        '#%RAML 0.1'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/Unsupported RAML version: \'#%RAML 0.1\'/).and.notify(done);
    });
    it('should fail if baseUriParameter is not a mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'baseUri: http://www.api.com/{version}/{company}',
        'version: v1.1',
        '/jobs:',
        '  baseUriParameters:',
        '    company:',
        '      description'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/parameter must be a mapping/).and.notify(done);
    });
    it('it should not fail to parse an empty trait', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: MyApi',
        'traits:',
        '  - emptyTrait:',
        '    otherTrait:',
        '      description: Some description',
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid trait definition, it must be a mapping/).and.notify(done);
    });
    it('it should not fail to parse an empty trait list', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://www.api.com/{version}/{company}',
        'version: v1.1',
        'traits:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid traits definition, it must be an array/).and.notify(done);
    });
    it('it should fail to parse a RAML header ', function(done) {
      var noop = function () {};
      var definition = [
        '#%RAML 0.2'
      ].join('\n');

      raml.load(definition).then(noop, function (error) {
        setTimeout(function () {
          error.message.should.match(/empty document/);
          done();
        }, 0);
      });
    });
    it('it should not fail to parse a RAML file only with headers', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/document must be a mapping/).and.notify(done);
    });
    it('it should not fail to parse a RAML null uriParameters. RT-178', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: hola',
        'version: v0.1',
        'baseUri: http://server/api/{version}',
        'baseUriParameters:'
      ].join('\n');
      var expected = {
        title: "hola",
        version: "v0.1",
        baseUri: "http://server/api/{version}",
        baseUriParameters: {
          version: {
            type: "string",
            required: true,
            displayName: "version",
            enum: [ "v0.1" ]
          }
        }
      }
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('it should fail if baseUriParamters has a version parameter. RT-199', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: hola',
        'version: v0.1',
        'baseUri: http://server/api/{version}',
        'baseUriParameters:',
        ' version:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/version parameter not allowed here/).and.notify(done);
    });
    it('it should fail if resource URI is invalid', function(done){
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: hola',
        'version: v0.1',
        '/resourceName{}:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/Resource name is invalid:/).and.notify(done);
    });
    it('should report correct line (RT-244)', function (done) {
      var noop       = function () {};
      var definition = [
        '',
        ''
      ].join('\n');

      raml.load(definition).then(noop, function (error) {
        setTimeout(function () {
          expect(error.problem_mark).to.exist;
          error.problem_mark.column.should.be.equal(0);
          error.problem_mark.line.should.be.equal(0);
          done();
        }, 0);
      });
    })
    it('should report correct line for null media type in implicit mode', function (done) {
      var noop       = function () {};
      var definition = [
        '#%RAML 0.2',
        '/resource:',
        '  post:',
        '    body:',
        '      schema: someSchema',
      ].join('\n');

      raml.load(definition).then(noop, function (error) {
        setTimeout(function () {
          error.message.should.be.equal("body tries to use default Media Type, but mediaType is null");
          expect(error.problem_mark).to.exist;
          error.problem_mark.column.should.be.equal(4);
          error.problem_mark.line.should.be.equal(3);
          done();
        }, 0);
      });
    })
  });
  describe('Basic Information', function() {
    it('should fail unsupported yaml version', function(done) {
      var definition = [
        '#%RAML 0.2',
        '%YAML 1.1',
        '---',
        'title: MyApi'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/found incompatible YAML document \(version 1.2 is required\)/).and.notify(done);
    });
    it('should succeed', function(done) {
      var definition = [
        '#%RAML 0.2',
        '%YAML 1.2',
        '---',
        'title: MyApi',
        'baseUri: http://myapi.com',
        '/:',
        '  displayName: Root'
      ].join('\n');

      raml.load(definition).should.become({ title: 'MyApi', baseUri: 'http://myapi.com', resources: [ { relativeUri: '/', displayName: 'Root' } ] }).and.notify(done);
    });
    it('should fail if no title', function(done) {
    var definition = [
      '#%RAML 0.2',
      '---',
      'baseUri: http://myapi.com'
    ].join('\n');

    raml.load(definition).should.be.rejected.with(/missing title/).and.notify(done);
  });
    it('should fail if title is array', function(done) {
        var definition = [
            '#%RAML 0.2',
            '---',
            'title: ["title", "title line 2", "title line 3"]',
            'baseUri: http://myapi.com'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/title must be a string/).and.notify(done);
    });
    it('should fail if title is mapping', function(done) {
        var definition = [
            '#%RAML 0.2',
            '---',
            'title: { line 1: line 1, line 2: line 2 }',
            'baseUri: http://myapi.com'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/title must be a string/).and.notify(done);
    });
    it('should succeed if title is longer than 48 chars', function(done) {
        var definition = [
            '#%RAML 0.2',
            '---',
            'title: this is a very long title, it should fail the length validation for titles with an exception clearly marking it so',
            'baseUri: http://myapi.com'
        ].join('\n');

        raml.load(definition).should.become({title:"this is a very long title, it should fail the length validation for titles with an exception clearly marking it so", baseUri: "http://myapi.com"}).and.notify(done);
    });
    it('should allow number title', function(done) {
      var definition = [
          '#%RAML 0.2',
          '---',
          'title: 54',
          'baseUri: http://myapi.com'
      ].join('\n');

      raml.load(definition).should.become({ title: 54, baseUri: 'http://myapi.com' }).and.notify(done);
    });
    it('should fail if there is a root property with wrong displayName', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'version: v1',
        'wrongPropertyName: http://myapi.com/{version}'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property/).and.notify(done);
  });
    it('should fail if there is a root property with array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'version: v1',
        '[1,2]: v1'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/keys can only be strings/).and.notify(done);
    });
  });
  describe('Include', function() {
    it('should fail if include not found', function(done) {
      var definition = [
        '#%RAML 0.2',
        '%YAML 1.2',
        '---',
        'title: !include relative.md'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/error 404|cannot find relative.md/).and.notify(done);
    });
    it('should succeed on including another YAML file with .yml extension', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        '!include http://localhost:9001/test/external.yml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file with .yaml extension', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        '!include http://localhost:9001/test/external.yaml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file mid-document', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '   - customTrait1: !include http://localhost:9001/test/customtrait.yml',
        '   - customTrait2: !include http://localhost:9001/test/customtrait.yml'
      ].join('\n');

        raml.load(definition).should.eventually.deep.equal({
          title: 'Test',
          traits:
            [
            {
              customTrait1: {
                displayName: 'Custom Trait',
                description: 'This is a custom trait',
                responses: {
                  429: {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            },
            {
              customTrait2: {
                displayName: 'Custom Trait',
                description: 'This is a custom trait',
                responses: {
                  429: {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            }]
      }).and.notify(done);
    });
  });
  describe('URI Parameters', function() {
    it('should succeed when dealing with URI parameters', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        ''
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        baseUri: 'http://{a}.myapi.org',
        baseUriParameters: {
          'a': {
            displayName: 'A',
            description: 'This is A',
            required: true,
            type: "string"
          }
        }
      }).and.notify(done);
    });
    it('should fail when a parameter uses array syntax with only one type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    - displayName: A',
        '      description: This is A',
        ''
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
    });
    it('should succeed when dealing with URI parameters with two types', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    - displayName: A',
        '      description: This is A',
        '      type: string',
        '    - displayName: A',
        '      description: This is A',
        '      type: file',
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        baseUri: 'http://{a}.myapi.org',
        baseUriParameters: {
          'a': [
            {
              displayName: 'A',
              description: 'This is A',
              type: "string",
              required: true
            },
            {
              displayName: 'A',
              description: 'This is A',
              type: "file",
              required: true
            },
          ]
        }
      }).and.notify(done);
    });

    it('should fail when declaring a URI parameter not on the baseUri', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  b:',
        '    displayName: A',
        '    description: This is A',
        ''
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/uri parameter unused/).and.notify(done);
    });
    it('should fail when declaring a URI parameter not on the resource URI', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '/{hello}:',
        '  uriParameters:',
        '    a:',
        '      displayName: A',
        '      description: This is A'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/uri parameter unused/).and.notify(done);
    });
    it('should fail when declaring a property inside a URI parameter that is not valid', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    wrongPropertyName: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property wrongPropertyName/).and.notify(done);
    });
    it('should succeed when declaring a minLength validation as a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    minLength: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a maxLength validation as a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    maxLength: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a minimum validation as a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    minimum: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a maximum validation as a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    maximum: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should fail when declaring a minLength validation as anything other than a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    minLength: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of minLength must be a number/).and.notify(done);
    });
    it('should fail when declaring a maxLength validation as anything other than a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    maxLength: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of maxLength must be a number/).and.notify(done);
    });
    it('should fail when declaring a minimum validation as anything other than a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    minimum: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of minimum must be a number/).and.notify(done);
    });
    it('should fail when declaring a maximum validation as anything other than a number', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    maximum: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of maximum must be a number/).and.notify(done);
    });
    it('should fail when declaring a URI parameter with an invalid type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/type can be either of: string, number, integer, file, date or boolean/).and.notify(done);
    });
    it('should succeed when declaring a URI parameter with a string type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: string'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a URI parameter with a number type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: number'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a URI parameter with a integer type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: integer'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a URI parameter with a date type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a URI parameter with a file type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: file'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a URI parameter with a boolean type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: boolean'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should succeed when declaring a URI parameter with an example', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    example: This is the example'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
    it('should fail if baseUri value its not really a URI', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'baseUri: http://{myapi.com'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unclosed brace/).and.notify(done);
    });
    it('should fail if baseUri uses version but there is no version defined', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'baseUri: http://myapi.com/{version}'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/missing version/).and.notify(done);
    });
    it('should succeed if baseUri uses version and there is a version defined', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'version: v1',
        'baseUri: http://myapi.com/{version}'
      ].join('\n');

      var promise = raml.load(definition);
      var expected = {
        title: 'MyApi',
        version: 'v1',
        baseUri: 'http://myapi.com/{version}',
        baseUriParameters: {
          version: {
            type: "string",
            required: true,
            displayName: "version",
            enum: [ "v1" ]
          }
        }
      };
      promise.should.eventually.deep.equal(expected).and.notify(done);
    });
    it('should fail when a URI parameter has required "y"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: y'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });
    it('should fail when a URI parameter has required "yes"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: yes'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should fail when a URI parameter has required "YES"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: YES'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should fail when a URI parameter has required "t"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: t'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should succeed when a URI parameter has required "true"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: true'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should fail when a URI parameter has required "TRUE"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: TRUE'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should fail when a URI parameter has required "n"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: n'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should fail when a URI parameter has required "no"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: no'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should fail when a URI parameter has required "NO"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: NO'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should fail when a URI parameter has required "f"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: f'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should succeed when a URI parameter has required "false"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: false'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should fail when a URI parameter has required "FALSE"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    required: FALSE'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should succeed when a URI parameter has repeat "false"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    repeat: false'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should fail when a URI parameter has repeat "FALSE"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    repeat: FALSE'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should succeed when a URI parameter has repeat "true"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    repeat: true'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should fail when a URI parameter has repeat "TRUE"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '    type: date',
        '    repeat: TRUE'
      ].join('\n');

      raml.load(definition).should.be.rejected.and.notify(done);
    });
  });
  describe('MultiType Named Parameters', function() {
    describe('Named parameters in baseUriParameters at root level', function(){
      it('should succeed with null baseUriParameters', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          'baseUriParameters:',
        ].join('\n');
        var expected= {
          title: "Test",
          baseUri: "http://myapi.org",
          baseUriParameters: null
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with no types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          'baseUriParameters:',
          '  a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          'baseUriParameters:',
          '  a:',
          '    - displayName: A',
          '      description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when dealing with URI parameters with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          'baseUriParameters:',
          '  a:',
          '    - displayName: A',
          '      description: This is A',
          '      type: string',
          '    - displayName: A',
          '      description: This is A',
          '      type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://{a}.myapi.org',
          baseUriParameters: {
            'a': [
              {
                displayName: 'A',
                description: 'This is A',
                type: "string",
                required: true
              },
              {
                displayName: 'A',
                description: 'This is A',
                type: "file",
                required: true
              },
            ]
          }
        }).and.notify(done);
      });
    });
    describe('Named parameters in baseUriParameters at a resource level', function(){
      it('should succeed with null baseUriParameters', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          '/resource:',
          '  baseUriParameters:',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://{a}.myapi.org',
          baseUriParameters: {
            'a': {
              displayName: 'a',
              type: "string",
              required: true
            }
          },
          resources: [
            {
              relativeUri: "/resource",
              baseUriParameters: null
            }
          ]
        }).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with no types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          '/resource:',
          '  baseUriParameters:',
          '    a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          '/resource:',
          '  baseUriParameters:',
          '    a:',
          '      - displayName: A',
          '        description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when dealing with URI parameters with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://{a}.myapi.org',
          '/resource:',
          '  baseUriParameters:',
          '    a:',
          '      - displayName: A',
          '        description: This is A',
          '        type: string',
          '      - displayName: A',
          '        description: This is A',
          '        type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://{a}.myapi.org',
          resources: [
            {
              baseUriParameters: {
                'a': [
                  {
                    displayName: 'A',
                    description: 'This is A',
                    type: "string",
                    required: true
                  },
                  {
                    displayName: 'A',
                    description: 'This is A',
                    type: "file",
                    required: true
                  },
                ]
              },
              relativeUri: "/resource"
            }
          ],
          baseUriParameters: {
            'a': {
              type: "string",
              required: true,
              displayName: 'a'
            }
          }
        }).and.notify(done);
      });
    });
    describe('Named parameters in uriParameters', function(){
      it('should succeed with null uriParameters', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/{a}resource:',
          '  uriParameters:'
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/{a}resource",
              uriParameters: {
                'a':
                  {
                    displayName: 'a',
                    required: true,
                    type: "string"
                  }
              }

            }
          ]
        }).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with no types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/{a}resource:',
          '  uriParameters:',
          '    a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/{a}resource:',
          '  uriParameters:',
          '    a:',
          '      - displayName: A',
          '        description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when dealing with URI parameters with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/{a}resource:',
          '  uriParameters:',
          '    a:',
          '      - displayName: A',
          '        description: This is A',
          '        type: string',
          '      - displayName: A',
          '        description: This is A',
          '        type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/{a}resource",
              uriParameters: {
                'a': [
                  {
                    displayName: 'A',
                    description: 'This is A',
                    type: "string",
                    required: true
                  },
                  {
                    displayName: 'A',
                    description: 'This is A',
                    type: "file",
                    required: true
                  },
                ]
              }

            }
          ]
        }).and.notify(done);
      });
    });
    describe('Named parameters in request headers', function(){
      it('should succeed with null headers', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    headers:'
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                method: "get",
                headers: null
              }]
            }
          ]
        }).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    headers:',
          '      a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    headers:',
          '      a:',
          '        - displayName: A',
          '          description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when dealing with URI parameters with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    headers:',
          '      a:',
          '        - displayName: A',
          '          description: This is A',
          '          type: string',
          '        - displayName: A',
          '          description: This is A',
          '          type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                method: "get",
                headers: {
                  'a': [
                    {
                      displayName: 'A',
                      description: 'This is A',
                      type: "string",
                      required: true
                    },
                    {
                      displayName: 'A',
                      description: 'This is A',
                      type: "file",
                      required: true
                    },
                  ]
                }
              }]
            }
          ]
        }).and.notify(done);
      });
    });
    describe('Named parameters in query string parameter', function(){
      it('should succeed with null URI parameters', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    queryParameters:'
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                method: "get",
                queryParameters: null
              }]
            }
          ]
        }).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    queryParameters:',
          '      a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    queryParameters:',
          '      a:',
          '        - displayName: A',
          '          description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when dealing with URI parameters with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    queryParameters:',
          '      a:',
          '        - displayName: A',
          '          description: This is A',
          '          type: string',
          '        - displayName: A',
          '          description: This is A',
          '          type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                method: "get",
                queryParameters: {
                  'a': [
                    {
                      displayName: 'A',
                      description: 'This is A',
                      type: "string"
                    },
                    {
                      displayName: 'A',
                      description: 'This is A',
                      type: "file"
                    },
                  ]
                }
              }]
            }
          ]
        }).and.notify(done);
      });
    });
    describe('Named parameters in form parameters', function(){
      it('should succeed null form parameters', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'mediaType: multipart/form-data',
          'baseUri: http://myapi.org',
          '/resource:',
          '  post:',
          '    body:',
          '      formParameters:'
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          mediaType: 'multipart/form-data',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                body: {
                  "multipart/form-data": {
                    formParameters: null
                  }
                },
                method: "post"
              }]
            }
          ]
        }).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  post:',
          '    body: ',
          '      formParameters:',
          '        a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  post:',
          '    body: ',
          '      formParameters:',
          '        a:',
          '          - displayName: A',
          '            description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when dealing with URI parameters with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'mediaType: multipart/form-data',
          'baseUri: http://myapi.org',
          '/resource:',
          '  post:',
          '    body:',
          '      formParameters:',
          '        a:',
          '          - displayName: A',
          '            description: This is A',
          '            type: string',
          '          - displayName: A',
          '            description: This is A',
          '            type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          mediaType: 'multipart/form-data',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                body: {
                  "multipart/form-data": {
                    formParameters: {
                      'a': [
                        {
                          displayName: 'A',
                          description: 'This is A',
                          type: "string",
                          required: true
                        },
                        {
                          displayName: 'A',
                          description: 'This is A',
                          type: "file",
                          required: true
                        },
                      ]
                    }
                  }
                },
                method: "post"
              }]
            }
          ]
        }).and.notify(done);
      });
    });
    describe('Named parameters in response headers', function(){
      it('should succeed with null header', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    responses:',
          '      200:',
          '        headers:'
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                method: "get",
                responses: {
                  200: {
                    headers: null
                  }
                }
              }]
            }
          ]
        }).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    responses:',
          '      200:',
          '        headers:',
          '          a: []'
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
      });
      it('should fail when a parameter uses array syntax with only one type', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    responses:',
          '      200:',
          '        headers:',
          '          a:',
          '            - displayName: A',
          '              description: This is A',
          ''
        ].join('\n');

        raml.load(definition).should.be.rejected.with(/single type for variably typed parameter/).and.notify(done);
      });
      it('should succeed when a parameter uses array syntax with two types', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'baseUri: http://myapi.org',
          '/resource:',
          '  get:',
          '    responses:',
          '      200:',
          '        headers:',
          '           a:',
          '            - displayName: A',
          '              description: This is A',
          '              type: string',
          '            - displayName: A',
          '              description: This is A',
          '              type: file',
        ].join('\n');

        raml.load(definition).should.become({
          title: 'Test',
          baseUri: 'http://myapi.org',
          resources: [
            {
              relativeUri: "/resource",
              methods: [{
                method: "get",
                responses: {
                  200: {
                    headers: {
                      'a': [
                        {
                          displayName: 'A',
                          description: 'This is A',
                          type: "string",
                          required: true
                        },
                        {
                          displayName: 'A',
                          description: 'This is A',
                          type: "file",
                          required: true
                        },
                      ]
                    }
                  }
                }
              }]
            }
          ]
        }).and.notify(done);
      });
    });

  });
  describe('Resources', function() {
    it('should succeed extracting resource information', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '  /b:',
        '    displayName: AB',
        '    get:',
        '    put:',
        '/a/c:',
        '  displayName: AC',
        '  post:',
        ''
      ].join('\n');

      raml.resources(definition).should.become([
        {
          "methods": [
            "get"
          ],
          "uri": "/a",
          "displayName": "A",
          "line": 4,
          "column": 1
        },
        {
          "methods": [
            "get",
            "put"
          ],
          "uri": "/a/b",
          "displayName": "AB",
          "line": 7,
          "column": 3
        },
        {
          "methods": [
            "post"
          ],
          "uri": "/a/c",
          "displayName": "AC",
          "line": 11,
          "column": 1
        }
      ]).and.notify(done);
    });
    it('should fail on duplicate absolute URIs', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  /b:',
        '    displayName: B',
        '/a/b:',
        '  displayName: AB'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/two resources share same URI \/a\/b/).and.notify(done);
    });
    it('should succeed', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  /b:',
        '    displayName: B',
        '/a/c:',
        '  displayName: AC'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        resources: [
          {
            relativeUri: '/a',
            displayName: 'A',
            resources: [
              {
                relativeUri: '/b',
                displayName: 'B'
              }
            ]
          },
          {
            relativeUri: '/a/c',
            displayName: 'AC'
          }
        ]
      }).and.notify(done);
    });
    it('should succeed when a method is null', function(done) {
      var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          '/a:',
          '  displayName: A',
          '  get: ~'
      ].join('\n');

      raml.load(definition).should.become({
          title: 'Test',
          resources: [
              {
                  relativeUri: '/a',
                  displayName: 'A',
                  methods: [
                      {
                          method: "get"
                      }
                  ]

              }
          ]
      }).and.notify(done);
    });
    it('should allow resources named like HTTP verbs', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/getSomething:',
        '  displayName: GetSomething',
        '/postSomething:',
        '  displayName: PostSomething',
        '/putSomething:',
        '  displayName: PutSomething',
        '/deleteSomething:',
        '  displayName: DeleteSomething',
        '/headSomething:',
        '  displayName: HeadSomething',
        '/patchSomething:',
        '  displayName: PatchSomething',
        '/optionsSomething:',
        '  displayName: OptionsSomething',
        '/get:',
        '  displayName: Get',
        '/post:',
        '  displayName: Post',
        '/put:',
        '  displayName: Put',
        '/delete:',
        '  displayName: Delete',
        '/head:',
        '  displayName: Head',
        '/patch:',
        '  displayName: Patch',
        '/options:',
        '  displayName: Options'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        resources: [
          {
            relativeUri: '/getSomething',
            displayName: 'GetSomething'
          },
          {
            relativeUri: '/postSomething',
            displayName: 'PostSomething'
          },
          {
            relativeUri: '/putSomething',
            displayName: 'PutSomething'
          },
          {
            relativeUri: '/deleteSomething',
            displayName: 'DeleteSomething'
          },
          {
            relativeUri: '/headSomething',
            displayName: 'HeadSomething'
          },
          {
            relativeUri: '/patchSomething',
            displayName: 'PatchSomething'
          },
          {
            relativeUri: '/optionsSomething',
            displayName: 'OptionsSomething'
          },
          {
            relativeUri: '/get',
            displayName: 'Get'
          },
          {
            relativeUri: '/post',
            displayName: 'Post'
          },
          {
            relativeUri: '/put',
            displayName: 'Put'
          },
          {
            relativeUri: '/delete',
            displayName: 'Delete'
          },
          {
            relativeUri: '/head',
            displayName: 'Head'
          },
          {
            relativeUri: '/patch',
            displayName: 'Patch'
          },
          {
            relativeUri: '/options',
            displayName: 'Options'
          }
        ]
      }).and.notify(done);
    });
    it('it should not fail when resource is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/:'
      ].join('\n');

      var expected = {
        title: "Test",
        resources : [
          {
            relativeUri: "/"
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('is should fail when resource is a scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/: foo'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/resource is not a mapping/).and.notify(done);
    });
    it('is should fail when resource is a sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/: foo'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/resource is not a mapping/).and.notify(done);
    });
  });
  describe('Resource Responses', function() {
    it('should succeed with arrays as keys', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  displayName: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      [200, 210]:',
        '        description: Blah Blah',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: { description: 'Blah Blah'},
              210: { description: 'Blah Blah'}
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should succeed with null response', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  displayName: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      200:'
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: null
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if status code is string', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  displayName: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      fail-here:'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/each response key must be an integer/).and.notify(done);
    });

    it('should overwrite existing node with arrays as keys', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  displayName: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      200:',
        '        description: Foo Foo',
        '      [200, 210]:',
        '        description: Blah Blah',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: { description: 'Blah Blah'},
              210: { description: 'Blah Blah'}
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should overwrite arrays as keys with new single node', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  displayName: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      [200, 210]:',
        '        description: Blah Blah',
        '      200:',
        '        description: Foo Foo',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: { description: 'Foo Foo'},
              210: { description: 'Blah Blah'}
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should fail to load a yaml with hash as key', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  displayName: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      {200: Blah}:',
        '        description: Blah Blah',
        ''
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/each response key must be an integer/).and.notify(done);
    });
  });
  describe('Traits at resource level', function() {
    it('should succeed when applying traits across !include boundaries', function(done) {
      var definition = [
          '#%RAML 0.2',
          '---',
          'title: Test',
          'traits:',
          '  - customTrait: !include http://localhost:9001/test/customtrait.yml',
          '/: !include http://localhost:9001/test/root.yml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({
          title: 'Test',
          traits: [{
              customTrait: {
                  displayName: 'Custom Trait',
                  description: 'This is a custom trait',
                  responses: {
                      429: {
                          description: 'API Limit Exceeded'
                      }
                  }
              }
          }],
          resources: [
              {
                  is: [ "customTrait" ],
                  displayName: "Root",
                  relativeUri: "/",
                  methods: [
                      {
                        responses: {
                            429: {
                                description: 'API Limit Exceeded'
                            }
                        },
                        description: "Root resource",
                        method: "get"
                      }
                  ],
                  resources: [
                      {
                          relativeUri: "/anotherResource",
                          displayName: "Another Resource",
                          is: [ "customTrait" ],
                          methods: [
                              {
                                description: "Another resource",
                                method: "get",
                                responses: {
                                    429: {
                                        description: 'API Limit Exceeded'
                                    }
                                }
                              }
                          ]
                      }
                  ]
              }
          ]
      }).and.notify(done);
    });
    it('should succeed when applying multiple traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      responses:',
        '        429:',
        '          description: API Limit Exceeded',
        '  - queryable:',
        '      displayName: Queryable',
        '      queryParameters:',
        '        q:',
        '          type: string',
        '/leagues:',
        '  is: [ rateLimited, queryable ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            responses: {
              '429': {
                description: 'API Limit Exceeded'
              }
            }
          }
          },
          {
            queryable: {
            displayName: 'Queryable',
            queryParameters: {
              q: {
                type: 'string',
                displayName: "q"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            is: [ 'rateLimited', 'queryable' ],
            methods: [
              {
                method: 'get',
                queryParameters: {
                  q: {
                    type: 'string',
                    displayName: "q"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  },
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should succeed when applying a trait to a null method', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      responses:',
        '        429:',
        '          description: API Limit Exceeded',
        '/leagues:',
        '  is: [ rateLimited ]',
        '  get:'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            responses: {
              '429': {
                description: 'API Limit Exceeded'
              }
            }
          }
        }
        ],
        resources: [
          {
            relativeUri: '/leagues',
            is: [ 'rateLimited' ],
            methods: [
              {
                method: 'get',
                responses: {
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when applying multiple traits in a single array entry', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      responses:',
        '        429:',
        '          description: API Limit Exceeded',
        '    queryable:',
        '      displayName: Queryable',
        '      queryParameters:',
        '        q:',
        '          type: string',
        '/leagues:',
        '  is: [ rateLimited, queryable ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            responses: {
              '429': {
                description: 'API Limit Exceeded'
              }
            }
          },
          queryable: {
            displayName: 'Queryable',
            queryParameters: {
              q: {
                type: 'string',
                displayName: "q"
              }
            }
          }
          }],
        resources: [
          {
            relativeUri: '/leagues',
            is: [ 'rateLimited', 'queryable' ],
            methods: [
              {
                method: 'get',
                queryParameters: {
                  q: {
                    type: 'string',
                    displayName: "q"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  },
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should remove nodes with question mark that are not used', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        x-header-extra:',
        '          displayName: API Limit Exceeded',
        '/leagues:',
        '  is: [ rateLimited ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            "headers?": {
              "x-header-extra": {
                displayName: "API Limit Exceeded",
                type: "string",
                required: true
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            is: [ 'rateLimited' ],
            methods: [
              {
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should succeed if trait is missing displayName property', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      responses:',
        '        503:',
        '          description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  is: [ rateLimited: { parameter: value } ]'
      ].join('\n');

      var expected =   {
        "title": "Test",
        "traits": [
          {
            "rateLimited": {
              "responses": {
                "503": {
                  "description": "Server Unavailable. Check Your Rate Limits."
                }
              }
            }
          }
        ],
        "resources": [
          {
            "is": [
              {
                "rateLimited": {
                  "parameter": "value"
                }
              }
            ],
            "relativeUri": "/"
          }
        ]
      };


      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if traits value is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits: foo',
        '/:',
        '  is: [ rateLimited: { parameter: value } ]'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid traits definition, it must be an array/).and.notify(done);
    });
    it('should fail if traits value is dictionary', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  trait1:',
        '    displayName: foo',
        '/:',
        '  is: [ rateLimited: { parameter: value } ]'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid traits definition, it must be an array/).and.notify(done);
    });
    it('should fail if use property is not an array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/:',
        '  is: throttled ]'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'is' must be a list/).and.notify(done);
    });
    it('should fail on invalid trait name', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      responses:',
        '        503:',
        '          description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  is: [ throttled, rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/there is no trait named throttled/).and.notify(done);
    });
    it('should allow using "use" as a resource name', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://www.api.com/{version}/{company}',
        'version: v1.1',
        '/users:',
        ' displayName: Tags',
        ' get:',
        ' post:',
        ' /{userid}:',
        '  displayName: Search'
      ].join('\n');

      var expected = {
        title: 'Test',
        baseUri: 'http://www.api.com/{version}/{company}',
        version: 'v1.1',
        baseUriParameters: {
          company: {
            type: "string",
            required: true,
            displayName: "company"
          },
          version: {
            type: "string",
            required: true,
            displayName: "version",
            enum: [ "v1.1" ]
          }
        },
        resources: [
          {
            displayName: 'Tags',
            relativeUri: '/users',
            methods: [
              {
                method: 'get'

              },
              {
                method: 'post'

              }
            ],
            resources: [{
              displayName: 'Search',
              relativeUri: '/{userid}',
              uriParameters: {
                userid: {
                  type: "string",
                  required: true,
                  displayName: "userid"
                }
              }
            }]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should not add intermediate structures in optional keys for missing properties', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  is: [ rateLimited ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              'If-None-Match?': {
                description: 'If-None-Match headers ensure that you don’t retrieve unnecessary data\nif you already have the most current version on-hand.\n',
                type: 'string',
                displayName: "If-None-Match",
                required: true
              },
              'On-Behalf-Of?' : {
                description: 'Used for enterprise administrators to make API calls on behalf of their\nmanaged users. To enable this functionality, please contact us with your\nAPI key.\n',
                type: 'string',
                displayName: "On-Behalf-Of",
                required: true
              }
            }
          }
        }],
        resources: [
          {
            is: [ 'rateLimited' ],
            relativeUri: '/leagues',
            methods: [
              {
                headers: { },
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should allow dictionary keys as names of traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  is: [ rateLimited: {} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers?': {
              'If-None-Match?': {
                description: 'If-None-Match headers ensure that you don’t retrieve unnecessary data\nif you already have the most current version on-hand.\n',
                type: 'string',
                required: true,
                displayName: "If-None-Match"
              },
              'On-Behalf-Of?' : {
                description: 'Used for enterprise administrators to make API calls on behalf of their\nmanaged users. To enable this functionality, please contact us with your\nAPI key.\n',
                type: 'string',
                required: true,
                displayName: "On-Behalf-Of"
              }
            }
          }
        }],
        resources: [
          {
            is: [ { rateLimited: {} }],
            relativeUri: '/leagues',
            methods: [
              {
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should allow parameters in a trait usage', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  is: [ rateLimited: { param1: value, param2: value} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers?': {
              'If-None-Match?': {
                description: 'If-None-Match headers ensure that you don’t retrieve unnecessary data\nif you already have the most current version on-hand.\n',
                type: 'string',
                required: true,
                displayName: "If-None-Match"
              },
              'On-Behalf-Of?' : {
                description: 'Used for enterprise administrators to make API calls on behalf of their\nmanaged users. To enable this functionality, please contact us with your\nAPI key.\n',
                type: 'string',
                required: true,
                displayName: "On-Behalf-Of"
              }
            }
          }
        }],
        resources: [
          {
            is: [
              {
                rateLimited: {
                  param1: 'value',
                  param2: 'value'
                }
              }
            ],
            relativeUri: '/leagues',
            methods: [
              {
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should reject parameters whose value is an array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  is: [ rateLimited: { param1: ["string"], param2: value} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/parameter value is not a scalar/).and.notify(done);
    });
    it('should reject parameters whose value is a mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '/leagues:',
        '  is: [ rateLimited: { param1: {key: "value"}, param2: value} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited'
          }
        }],
        resources: [
          {
            is: [
              {
                rateLimited: {
                  param1: 'value',
                  param2: 'value'
                }
              }
            ],
            relativeUri: '/leagues',
            methods: [
              {
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };
      raml.load(definition).should.be.rejected.with(/parameter value is not a scalar/).and.notify(done);
    });
    it('should reject trait with missing provided parameters', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        Authorization:',
        '          description: <<lalalalala>> <<pepepepepepep>>',
        '/leagues:',
        '  is: [ rateLimited: { param1: value1, param2: value2} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/value was not provided for parameter: lalalalala/).and.notify(done);
    });
    it('should apply parameters in traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        Authorization:',
        '          description: <<param1>> <<param2>>',
        '/leagues:',
        '  is: [ rateLimited: { param1: "value1", param2: "value2"} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              'Authorization': {
                description: '<<param1>> <<param2>>',
                displayName: "Authorization",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            is: [ { rateLimited: { param1: 'value1', param2: 'value2'} }],
            relativeUri: '/leagues',
            methods: [
              {
                'headers': {
                  'Authorization': {
                    description: 'value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                },
                method: 'get'
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply parameters in traits in each occurrence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        Authorization:',
        '          description: <<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>>',
        '        X-Random-Header:',
        '          description: <<param2>><<param2>><<param2>>',
        '        <<param2>><<param2>>:',
        '          description: <<param1>>',
        '/leagues:',
        '  is: [ rateLimited: { param1: "value1", param2: "value2"} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              'Authorization': {
                description: '<<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>><<param1>> <<param2>>',
                displayName: "Authorization",
                required: true,
                type: "string"
              },
              'X-Random-Header': {
                description: '<<param2>><<param2>><<param2>>',
                displayName: "X-Random-Header",
                required: true,
                type: "string"
              },
              '<<param2>><<param2>>': {
                description: '<<param1>>',
                displayName: "<<param2>><<param2>>",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            is: [ { rateLimited: { param1: 'value1', param2: 'value2'} }],
            relativeUri: '/leagues',
            methods: [
              {
                'headers': {
                  'Authorization': {
                    description: 'value1 value2value1 value2value1 value2value1 value2value1 value2value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  },
                  'X-Random-Header': {
                    description: 'value2value2value2',
                    displayName: "X-Random-Header",
                    required: true,
                    type: "string"
                  },
                  'value2value2': {
                    description: 'value1',
                    displayName: "value2value2",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                },
                method: 'get'
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply parameters in keys in traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        <<header>>:',
        '          description: <<param1>> <<param2>>',
        '/leagues:',
        '  is: [ rateLimited: { header: "Authorization", param1: "value1", param2: "value2"} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              '<<header>>': {
                description: '<<param1>> <<param2>>',
                displayName: "<<header>>",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            is: [ { rateLimited: { header: "Authorization", param1: 'value1', param2: 'value2'} }],
            relativeUri: '/leagues',
            methods: [
              {
                'headers': {
                  'Authorization': {
                    description: 'value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                },
                method: 'get'
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply traits in all methods', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        <<header>>:',
        '          description: <<param1>> <<param2>>',
        '/leagues:',
        '  is: [ rateLimited: { header: "Authorization", param1: "value1", param2: "value2"} ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues',
        '  post:',
        '    responses:',
        '      200:',
        '        description: creates a new league'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              '<<header>>': {
                description: '<<param1>> <<param2>>',
                displayName: "<<header>>",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            is: [ { rateLimited: { header: "Authorization", param1: 'value1', param2: 'value2'} }],
            relativeUri: '/leagues',
            methods: [
              {
                'headers': {
                  'Authorization': {
                    description: 'value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                },
                method: 'get'
              },
              {
                'headers': {
                  'Authorization': {
                    description: 'value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'creates a new league'
                  }
                },
                method: 'post'
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
  });
  describe('Traits at method level', function() {
    it('should succeed when applying traits across !include boundaries', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - customTrait: !include http://localhost:9001/test/customtrait.yml',
        '/: !include http://localhost:9001/test/traitsAtResourceLevel.yml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({
        title: 'Test',
        traits: [{
          customTrait: {
            displayName: 'Custom Trait',
            description: 'This is a custom trait',
            responses: {
              429: {
                description: 'API Limit Exceeded'
              }
            }
          }
        }],
        resources: [
          {
            displayName: "Root",
            relativeUri: "/",
            methods: [
              {
                is: [ "customTrait" ],
                responses: {
                  429: {
                    description: 'API Limit Exceeded'
                  }
                },
                description: "Root resource",
                method: "get"
              }
            ],
            resources: [
              {
                relativeUri: "/anotherResource",
                displayName: "Another Resource",
                methods: [
                  {
                    is: [ "customTrait" ],
                    description: "Another resource",
                    method: "get",
                    responses: {
                      429: {
                        description: 'API Limit Exceeded'
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should succeed when applying multiple traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      responses:',
        '        429:',
        '          description: API Limit Exceeded',
        '  - queryable:',
        '      displayName: Queryable',
        '      queryParameters:',
        '        q:',
        '           type: string',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited, queryable ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            responses: {
              '429': {
                description: 'API Limit Exceeded'
              }
            }
          }},
          {queryable: {
            displayName: 'Queryable',
            queryParameters: {
              q: {
                type: 'string',
                displayName: "q"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [ 'rateLimited', 'queryable' ],
                method: 'get',
                queryParameters: {
                  q: {
                    type: 'string',
                    displayName: "q"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  },
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should remove nodes with question mark that are not used', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        x-header-extra:',
        '          displayName: API Limit Exceeded',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            "headers?": {
              "x-header-extra": {
                displayName: "API Limit Exceeded",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [ 'rateLimited' ],
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should succeed if trait is missing displayName property', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      responses:',
        '        503:',
        '          description: Server Unavailable. Check Your Rate Limits.'
      ].join('\n');

      var expected = {
        title: "Test",
        traits: [
          {
            rateLimited: {
              responses: {
                503: {
                  description: "Server Unavailable. Check Your Rate Limits."
                }
              }
            }
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if use property is not an array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/:',
        '  get:',
        '    is: throttled ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property 'is' must be a list/).and.notify(done);
    });
    it('should fail on invalid trait name', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      responses:',
        '        503:',
        '          description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  get:',
        '    is: [ throttled, rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/there is no trait named throttled/).and.notify(done);
    });
    it('should not add intermediate structures in optional keys for missing properties', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              'If-None-Match?': {
                description: 'If-None-Match headers ensure that you don’t retrieve unnecessary data\nif you already have the most current version on-hand.\n',
                type: 'string',
                displayName: "If-None-Match",
                required: true
              },
              'On-Behalf-Of?' : {
                description: 'Used for enterprise administrators to make API calls on behalf of their\nmanaged users. To enable this functionality, please contact us with your\nAPI key.\n',
                type: 'string',
                displayName: "On-Behalf-Of",
                required: true
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [ 'rateLimited' ],
                headers: { },
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should allow dictionary keys as names of traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: {} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers?': {
              'If-None-Match?': {
                description: 'If-None-Match headers ensure that you don’t retrieve unnecessary data\nif you already have the most current version on-hand.\n',
                type: 'string',
                required: true,
                displayName: "If-None-Match"
              },
              'On-Behalf-Of?' : {
                description: 'Used for enterprise administrators to make API calls on behalf of their\nmanaged users. To enable this functionality, please contact us with your\nAPI key.\n',
                type: 'string',
                required: true,
                displayName: "On-Behalf-Of"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [ { rateLimited: {} }],
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should allow parameters in a trait usage', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: { param1: value, param2: value} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers?': {
              'If-None-Match?': {
                description: 'If-None-Match headers ensure that you don’t retrieve unnecessary data\nif you already have the most current version on-hand.\n',
                type: 'string',
                required: true,
                displayName: "If-None-Match"
              },
              'On-Behalf-Of?' : {
                description: 'Used for enterprise administrators to make API calls on behalf of their\nmanaged users. To enable this functionality, please contact us with your\nAPI key.\n',
                type: 'string',
                required: true,
                displayName: "On-Behalf-Of"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [
                  {
                    rateLimited: {
                      param1: 'value',
                      param2: 'value'
                    }
                  }
                ],
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should reject parameters whose value is an array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers?:',
        '        If-None-Match?:',
        '          description: |',
        '            If-None-Match headers ensure that you don’t retrieve unnecessary data',
        '            if you already have the most current version on-hand.',
        '          type: string',
        '        On-Behalf-Of?:',
        '          description: |',
        '            Used for enterprise administrators to make API calls on behalf of their',
        '            managed users. To enable this functionality, please contact us with your',
        '            API key.',
        '          type: string',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: { param1: ["string"], param2: value} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/parameter value is not a scalar/).and.notify(done);
    });
    it('should reject parameters whose value is a mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: { param1: {key: "value"}, param2: value} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/parameter value is not a scalar/).and.notify(done);
    });
    it('should reject trait with missing provided parameters', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        Authorization:',
        '          description: <<lalalalala>> <<pepepepepepep>>',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: { param1: value1, param2: value2} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/value was not provided for parameter: lalalalala/).and.notify(done);
    });
    it('should apply parameters in traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        Authorization:',
        '          description: <<param1>> <<param2>>',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: { param1: "value1", param2: "value2"} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              'Authorization': {
                description: '<<param1>> <<param2>>',
                displayName: "Authorization",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [ { rateLimited: { param1: 'value1', param2: 'value2'} }],
                'headers': {
                  'Authorization': {
                    description: 'value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                },
                method: 'get'
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply parameters in keys in traits', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - rateLimited:',
        '      displayName: Rate Limited',
        '      headers:',
        '        <<header>>:',
        '          description: <<param1>> <<param2>>',
        '/leagues:',
        '  get:',
        '    is: [ rateLimited: { header: "Authorization", param1: "value1", param2: "value2"} ]',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      var expected = {
        title: 'Test',
        traits: [{
          rateLimited: {
            displayName: 'Rate Limited',
            'headers': {
              '<<header>>': {
                description: '<<param1>> <<param2>>',
                displayName: "<<header>>",
                required: true,
                type: "string"
              }
            }
          }
        }],
        resources: [
          {
            relativeUri: '/leagues',
            methods: [
              {
                is: [ { rateLimited: { header: "Authorization", param1: 'value1', param2: 'value2'} }],
                'headers': {
                  'Authorization': {
                    description: 'value1 value2',
                    displayName: "Authorization",
                    required: true,
                    type: "string"
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  }
                },
                method: 'get'
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
  });
  describe('Resource Types', function () {
    it('should allow resourceTypes key at root level', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: The collection of <<resourcePathName>>',
        '      get:',
        '        description: Get all <<resourcePathName>>, optionally filtered',
        '      post:',
        '        description: Create a new <<resourcePathName | !singularize>>',
        '/:',
        '  displayName: Root'
      ].join('\n');

      var expected = {
        title: 'Test',
        resourceTypes: [{
          collection: {
            displayName: 'Collection',
            description: 'The collection of <<resourcePathName>>',
            get: {
              description: 'Get all <<resourcePathName>>, optionally filtered'
            },
            post: {
              description: 'Create a new <<resourcePathName | !singularize>>'
            }
          }
        }],
        resources: [
          {
            displayName: "Root",
            relativeUri: "/"

          }
        ]
      };

      raml.load(definition).should.eventually.deep.equal(expected).and.notify(done);
    });
    it('should allow resourceTypes array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: The collection of <<resourcePathName>>',
        '      get:',
        '        description: Get all <<resourcePathName>>, optionally filtered',
        '      post:',
        '        description: Create a new <<resourcePathName | !singularize>>',
        '  - item:',
        '      displayName: Item',
        '      description: A single <<resourcePathName>>',
        '      get:',
        '        description: Get a <<resourcePathName | !singularize>>',
        '      post:',
        '        description: Create a new <<resourcePathName | !singularize>>',
        '      patch:',
        '        description: Update a <<resourcePathName | !singularize>>',
        '      delete:',
        '        description: Update a <<resourcePathName | !singularize>>',
        '/:',
        '  displayName: Root'
      ].join('\n');

      var expected = {
        title: 'Test',
        resourceTypes: [
          {
            collection: {
              displayName: 'Collection',
              description: 'The collection of <<resourcePathName>>',
              get: {
                description: 'Get all <<resourcePathName>>, optionally filtered'
              },
              post: {
                description: 'Create a new <<resourcePathName | !singularize>>'
              }
            }
          },
          {
            item: {
              displayName: 'Item',
              description: 'A single <<resourcePathName>>',
              get: {
                description: 'Get a <<resourcePathName | !singularize>>'
              },
              post: {
                description: 'Create a new <<resourcePathName | !singularize>>'
              },
              patch: {
                description: 'Update a <<resourcePathName | !singularize>>'
              },
              delete: {
                description: 'Update a <<resourcePathName | !singularize>>'
              }
            }
          }

        ],
        resources: [
          {
            displayName: "Root",
            relativeUri: "/"

          }
        ]
      };

      raml.load(definition).should.eventually.deep.equal(expected).and.notify(done);
    });
    it('should fail if resourceTypes value is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes: foo',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid resourceTypes definition, it must be an array/).and.notify(done);
    });
    it('should fail if resourceTypes value is dictionary', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  type1:',
        '    displayName: foo',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid resourceTypes definition, it must be an array/).and.notify(done);
    });
    it('should fail if type is an array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: The collection of <<resourcePathName>>',
        '      get:',
        '        description: Get all <<resourcePathName>>, optionally filtered',
        '      post:',
        '        description: Create a new <<resourcePathName | !singularize>>',
        '/:',
        '  type: [ foo ]'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'type' must be a string or a mapping/).and.notify(done);
    });
    it('should fail if resource is of a missing type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: The collection of <<resourcePathName>>',
        '      get:',
        '        description: Get all <<resourcePathName>>, optionally filtered',
        '      post:',
        '        description: Create a new <<resourcePathName | !singularize>>',
        '/:',
        '  type: invalidType'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/there is no type named invalidType/).and.notify(done);
    });
    it('should succeed if resource type is missing displayName', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      description: The collection of Blah',
        '/:',
        '  type: collection'
      ].join('\n');

      var expected =  {
        "title": "Test",
        "resourceTypes": [
          {
            "collection": {
              "description": "The collection of Blah"
            }
          }
        ],
        "resources": [
          {
            "description": "The collection of Blah",
            "type": "collection",
            "relativeUri": "/"
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if resource type is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection: null',
        '  -',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid resourceType definition, it must be a mapping/).and.notify(done);
    });
    it('should fail if resource type is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  -',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid resourceType definition, it must be a mapping/).and.notify(done);
    });
    it('should fail if resource type is not mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - string',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid resourceType definition, it must be a mapping/).and.notify(done);
    });
    it('should fail if resource type declares a sub resource', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: The collection of <<resourcePathName>>',
        '      /bar:',
        '/:',
        '  type: collection'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/resource type cannot define child resources/).and.notify(done);
    });
    it('should fail if type dictionary has no keys', function(done){
      var definition = [
      '#%RAML 0.2',
      'title: titulo',
      'baseUri: http://api.com',
      '/resource:',
      '  type: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/missing type name in type property/).and.notify(done);
    });
    it('should fail if a resource type inherits from a missing type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      type: missing',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '/:',
        '  type: collection'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/there is no type named missing/).and.notify(done);
    });
    it('should fail if a resource type applies a missing trait', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - foo:',
        '     displayName: Foo',
        'resourceTypes:',
        '  - collection:',
        '     is: [foo, bar]',
        '     displayName: Collection',
        '     description: This resourceType should be used for any collection of items',
        '/:',
        '  type: collection'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/there is no trait named bar/).and.notify(done);
    });
    it('should fail if a resource type\'s method applies a missing trait', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - foo:',
        '     displayName: Foo',
        'resourceTypes:',
        '  - collection:',
        '     displayName: Collection',
        '     description: This resourceType should be used for any collection of items',
        '     get:',
        '       is: [foo, bar]',
        '/:',
        '  type: collection'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/there is no trait named bar/).and.notify(done);
    });
    it('should apply a resource type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '/:',
        '  type: collection'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              post:
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items",
            type: "collection",
            relativeUri: "/",
            methods: [
              {
                method: "post",
                body: null
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply last resource type declared if names collide', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '  - collection:',
        '      displayName: Collection2',
        '      description: This resourceType should be used for any collection of items2',
        '      post:',
        '       body:',
        '        application/json:',
        '/:',
        '  type: collection'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              post:
              {
                body: null
              }
            }
          },
          {
            collection:
            {
              displayName: "Collection2",
              description: "This resourceType should be used for any collection of items2",
              post:
              {
                body: {
                  "application/json": null
                }
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items2",
            type: "collection",
            relativeUri: "/",
            methods: [
              {
                method: "post",
                body: {
                  "application/json": null
                }
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply a resource type if type key is mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '/:',
        '  type: { collection }'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              post:
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items",
            type: {
              collection: null
            },
            relativeUri: "/",
            methods: [
              {
                method: "post",
                body: null
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply a resource type if type key is mapping and type name is mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '/:',
        '  type: { collection: { foo: bar } }'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              post:
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items",
            type: {
              collection: {
                foo: "bar"
              }
            },
            relativeUri: "/",
            methods: [
              {
                method: "post",
                body: null
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if type property has more than one key', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '/:',
        '  type: { collection: { foo: bar }, collection }'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/a resource or resourceType can inherit from a single resourceType/).and.notify(done);
    });
    it('should apply a resource type to a type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - post:',
        '      type: get',
        '      displayName: Collection post',
        '      description: This resourceType should be used for any collection of items post',
        '      post:',
        '       body:',
        '  - get:',
        '      displayName: Collection get',
        '      description: This resourceType should be used for any collection of items get',
        '      get:',
        '       body:',
        '/:',
        '  type: post'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            post:
            {
              type: "get",
              displayName: "Collection post",
              description: "This resourceType should be used for any collection of items post",
              post:
              {
                body: null
              }
            }
          },
          {
            get:
            {
              displayName: "Collection get",
              description: "This resourceType should be used for any collection of items get",
              get:
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items post",
            type: "post",
            relativeUri: "/",
            methods: [
              {
                body: null,
                method: "get"
              },
              {
                body: null,
                method: "post"
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should resolve a 3 level deep inheritance chain', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - post:',
        '      type: get',
        '      displayName: Collection post',
        '      description: This resourceType should be used for any collection of items post',
        '      post:',
        '       body:',
        '  - get:',
        '      type: delete',
        '      displayName: Collection get',
        '      description: This resourceType should be used for any collection of items get',
        '      get:',
        '       body:',
        '  - delete:',
        '      displayName: Collection delete',
        '      description: This resourceType should be used for any collection of items delete',
        '      delete:',
        '       body:',
        '/:',
        '  type: post'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            post:
            {
              type: "get",
              displayName: "Collection post",
              description: "This resourceType should be used for any collection of items post",
              post:
              {
                body: null
              }
            }
          },
          {
            get:
            {
              type: "delete",
              displayName: "Collection get",
              description: "This resourceType should be used for any collection of items get",
              get:
              {
                body: null
              }
            }
          }
          ,
          {
            delete:
            {
              displayName: "Collection delete",
              description: "This resourceType should be used for any collection of items delete",
              delete:
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            type: "post",
            relativeUri: "/",
            description: "This resourceType should be used for any collection of items post",
            methods: [
              {
                body: null,
                method: "delete"
              },
              {
                body: null,
                method: "get"
              },
              {
                body: null,
                method: "post"
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply parameters to a resource type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: <<foo>> resourceType should be used for any collection of items',
        '      post:',
        '       description: <<foo>><<foo>><<foo>> fixed text <<bar>><<bar>><<bar>>',
        '       <<foo>>: <<bar>>',
        '/:',
        '  type: { collection: { foo: bar, bar: foo} }'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "<<foo>> resourceType should be used for any collection of items",
              post:
              {
                description: "<<foo>><<foo>><<foo>> fixed text <<bar>><<bar>><<bar>>",
                "<<foo>>": "<<bar>>"
              }
            }
          }
        ],
        resources: [
          {
            description: "bar resourceType should be used for any collection of items",
            type: {
              collection:{
                foo: "bar",
                bar: "foo"
              }
            },
            relativeUri: "/",
            methods: [
              {
                method: "post",
                description: "barbarbar fixed text foofoofoo",
                bar: "foo"
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if parameters are missing', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: <<foo>> resourceType should be used for any collection of items',
        '      post:',
        '       description: <<foo>><<foo>><<foo>> fixed text <<bar>><<bar>><<bar>>',
        '       <<foo>>: <<bar>>',
        '/:',
        '  type: { collection: { foo: bar } }'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/value was not provided for parameter: bar/).and.notify(done);
    });
    it('should fail if resourceType uses a missing trait', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - secured:',
        '      displayName: OAuth 2.0 security',
        '      queryParameters:',
        '       access_token:',
        '         description: OAuth Access token',
        'resourceTypes:',
        '  - collection:',
        '      is: [ blah ]',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       foo:',
        '/:',
        '  type: collection'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/there is no trait named blah/).and.notify(done);
    });
    it('should apply a trait to a resource type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - secured:',
        '      displayName: OAuth 2.0 security',
        '      queryParameters:',
        '       access_token:',
        '         description: OAuth Access token',
        'resourceTypes:',
        '  - collection:',
        '      is: [ secured ]',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '/:',
        '  type: collection'
      ].join('\n');

      var expected = {
        title: "Test",
        traits: [
          {
            secured: {
              displayName: "OAuth 2.0 security",
              queryParameters: {
                access_token: {
                  description: "OAuth Access token",
                  displayName: "access_token",
                  type: "string"
                }
              }
            }
          }
        ],
        resourceTypes: [
          {
            collection:
            {
              is: [ "secured" ],
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              post:
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items",
            type: "collection",
            relativeUri: "/",
            methods: [
              {
                queryParameters: {
                  access_token: {
                    description: "OAuth Access token",
                    displayName: "access_token",
                    type: "string"
                  }
                },
                body: null,
                method: "post"
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply a resource type skipping missing optional parameter', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post:',
        '       body:',
        '      "get?":',
        '       body:',
        '/:',
        '  type: collection'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              post:
              {
                body: null
              },
              "get?":
              {
                body: null
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items",
            type: "collection",
            relativeUri: "/",
            methods: [
              {
                method: "post",
                body: null
              }
            ]
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply a resource type adding optional parameter', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'resourceTypes:',
        '  - collection:',
        '      displayName: Collection',
        '      description: This resourceType should be used for any collection of items',
        '      post?:',
        '       description: Some description',
        '/:',
        '  type: collection',
        '  post: {}'
      ].join('\n');

      var expected = {
        title: "Test",
        resourceTypes: [
          {
            collection:
            {
              displayName: "Collection",
              description: "This resourceType should be used for any collection of items",
              "post?":
              {
                description: "Some description"
              }
            }
          }
        ],
        resources: [
          {
            description: "This resourceType should be used for any collection of items",
            type: "collection",
            relativeUri: "/",
            methods: [
              {
                method: "post",
                description: "Some description"
              }
            ]
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
  });
  describe('Parameter methods', function(){
    describe('- Unknown methods', function(){
      describe('- In resources', function(){
        it('should fail if calling an unknown method in a property', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'resourceTypes:',
            '  - collection:',
            '      displayName: Collection',
            '      <<parameterName|sarasa>>: resourceType should be used for any collection of items',
            '/:'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to property name/).and.notify(done);
        });
        it('should fail if calling an unknown method in a value in an applied type', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'resourceTypes:',
            '  - collection:',
            '      displayName: Collection',
            '      description: <<parameterName|unknownword>> resourceType should be used for any collection of items',
            '/:',
            '  type: { collection: {parameterName: someValue} }'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to parameter/).and.notify(done);
        });
        it.skip('should fail if calling an unknown method in a value in an unapplied type', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'resourceTypes:',
            '  - collection:',
            '      displayName: Collection',
            '      description: <<parameterName|unknownword>> resourceType should be used for any collection of items',
            '/:'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to parameter/).and.notify(done);
        });
      });
      describe('- In traits', function(){
        it('should fail if calling an unknown method in a property', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'traits:',
            '  - traitName:',
            '      displayName: Collection',
            '      <<parameterName|sarasa>>: resourceType should be used for any collection of items',
            '/:'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to property name/).and.notify(done);
        });
        it('should fail if calling an unknown method in a value in an applied trait', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'traits:',
            '  - traitName:',
            '      displayName: Collection',
            '      description: <<parameterName|unknownword>> resourceType should be used for any collection of items',
            '/:',
            '  is: [ traitName: {parameterName: someValue} ]',
            '  get:'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to parameter/).and.notify(done);
        });
        it.skip('should fail if calling an unknown method in a value in an unapplied trait', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'traits:',
            '  - traitName:',
            '      displayName: Collection',
            '      description: <<parameterName|unknownword>> resourceType should be used for any collection of items',
            '/:'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to parameter/).and.notify(done);
        });
        it.skip('should fail if calling an unknown method in a value in a trait without methods', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'traits:',
            '  - traitName:',
            '      displayName: Collection',
            '      description: <<parameterName|unknownword>> resourceType should be used for any collection of items',
            '/:',
            '  is: [ traitName ]'
          ].join('\n');
          raml.load(definition).should.be.rejected.with(/unknown function applied to parameter/).and.notify(done);
        });
      });
    });
    describe('- Singuralize', function(){
      describe('- In resources', function(){
        it('should fail if calling an unknown method in a value in an applied type', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'resourceTypes:',
            '  - collection:',
            '      displayName: Collection',
            '      description: <<parameterName|!singularize>> resourceType should be used for any collection of items',
            '/:',
            '  type: { collection: {parameterName: commuters} }'
          ].join('\n');
          var expected = {
            "title": "Test",
            "resourceTypes": [
              {
                "collection": {
                  "displayName": "Collection",
                  "description": "<<parameterName|!singularize>> resourceType should be used for any collection of items"
                }
              }
            ],
            "resources": [
              {
                "description": "commuter resourceType should be used for any collection of items",
                "type": {
                  "collection": {
                    "parameterName": "commuters"
                  }
                },
                "relativeUri": "/"
              }
            ]
          };
          raml.load(definition).should.become(expected).and.notify(done);
        });
      });
      describe('- In traits', function(){
        it('should fail if calling an unknown method in a value in an applied trait', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'traits:',
            '  - traitName:',
            '      displayName: Collection',
            '      description: <<parameterName|!singularize>> resourceType should be used for any collection of items',
            '/:',
            '  is: [ traitName: {parameterName: commuters} ]',
            '  get:'
          ].join('\n');
          var expected =  {
            "title": "Test",
            "traits": [
              {
                "traitName": {
                  "displayName": "Collection",
                  "description": "<<parameterName|!singularize>> resourceType should be used for any collection of items"
                }
              }
            ],
            "resources": [
              {
                "is": [
                  {
                    "traitName": {
                      "parameterName": "commuters"
                    }
                  }
                ],
                "relativeUri": "/",
                "methods": [
                  {
                    "description": "commuter resourceType should be used for any collection of items",
                    "method": "get"
                  }
                ]
              }
            ]
          };
          raml.load(definition).should.become(expected).and.notify(done);
        });
      });
    });
    describe('Pluralize', function(){
      describe('- In resources', function(){
        it('should fail if calling an unknown method in a value in an applied type', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'resourceTypes:',
            '  - collection:',
            '      displayName: Collection',
            '      description: <<parameterName|!pluralize>> resourceType should be used for any collection of items',
            '/:',
            '  type: { collection: {parameterName: commuter} }'
          ].join('\n');
          var expected = {
            "title": "Test",
            "resourceTypes": [
              {
                "collection": {
                  "displayName": "Collection",
                  "description": "<<parameterName|!pluralize>> resourceType should be used for any collection of items"
                }
              }
            ],
            "resources": [
              {
                "description": "commuters resourceType should be used for any collection of items",
                "type": {
                  "collection": {
                    "parameterName": "commuter"
                  }
                },
                "relativeUri": "/"
              }
            ]
          };
          raml.load(definition).should.become(expected).and.notify(done);
        });
      });
      describe('- In traits', function(){
        it('should fail if calling an unknown method in a value in an applied trait', function(done){
          var definition = [
            '#%RAML 0.2',
            '---',
            'title: Test',
            'traits:',
            '  - traitName:',
            '      displayName: Collection',
            '      description: <<parameterName|!pluralize>> resourceType should be used for any collection of items',
            '/:',
            '  is: [ traitName: {parameterName: commuter} ]',
            '  get:'
          ].join('\n');
          var expected =  {
            "title": "Test",
            "traits": [
              {
                "traitName": {
                  "displayName": "Collection",
                  "description": "<<parameterName|!pluralize>> resourceType should be used for any collection of items"
                }
              }
            ],
            "resources": [
              {
                "is": [
                  {
                    "traitName": {
                      "parameterName": "commuter"
                    }
                  }
                ],
                "relativeUri": "/",
                "methods": [
                  {
                    "description": "commuters resourceType should be used for any collection of items",
                    "method": "get"
                  }
                ]
              }
            ]
          };
          raml.load(definition).should.become(expected).and.notify(done);
        });
      });
    });
  });
  describe('Schema support', function(){
    it('should not fail when specifying schemas at the root level', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: |',
        '       Blah blah',
        '/resource:'
      ].join('\n');

      var expected = {
        title: "Test",
        schemas: [
            {
            foo: "Blah blah\n"
            }
          ],
        resources : [
          {
            relativeUri: "/resource"
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail when specifying schemas is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas: foo',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schemas property must be an array/).and.notify(done);
    });
    it('should fail when specifying schemas is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas: {}',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schemas property must be an array/).and.notify(done);
    });
    it('should fail when schema is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo:',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schema foo must be a string/).and.notify(done);
    });
    it('should fail when schema is sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: []',
        '/:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schema foo must be a string/).and.notify(done);
    });
    it('should fail if a schema is a mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: |',
        '       Blah blah',
        '/foo:',
        '  displayName: A',
        '  post:' ,
        '    description: Blah',
        '    body:',
        '      application/json:',
        '        schema: foo3',
        '    responses:',
        '      200:',
        '       body:',
        '        application/json:',
        '          schema: foo',
        '      201:',
        '       body:',
        '        application/json:',
        '          schema: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schema must be a string/).notify(done);
    });
    it('should fail if a schema is an array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: |',
        '       Blah blah',
        '/foo:',
        '  displayName: A',
        '  post:' ,
        '    description: Blah',
        '    body:',
        '      application/json:',
        '        schema: foo3',
        '    responses:',
        '      200:',
        '       body:',
        '        application/json:',
        '          schema: foo',
        '      201:',
        '       body:',
        '        application/json:',
        '          schema: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schema must be a string/).notify(done);
    });
    it('should apply trait', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: |',
        '       Blah blah',
        '    faa: |',
        '       Blah blah',
        '/foo:',
        '  displayName: A',
        '  post:' ,
        '    description: Blah',
        '    body:',
        '      application/json:',
        '        schema: foo3',
        '    responses:',
        '      200:',
        '        body:',
        '          application/json:',
        '            schema: foo',
        '      201:',
        '        body:',
        '          application/json:',
        '            schema: foo2'
      ].join('\n');

      var expected = {
        title: 'Test',
        schemas: [{
          foo: "Blah blah\n",
          faa: "Blah blah\n"
        }],
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            body: {
              "application/json": {
                "schema": "foo3"
              }
            },
            responses: {
              200: {
                body: {
                  "application/json": {
                    schema: "Blah blah\n"
                  }
                }
              },
              201: {
                body: {
                  "application/json": {
                    schema: "foo2"
                  }
                }
              }
            },
            method: 'post'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply trait multiple times', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: |',
        '       Blah blah',
        '/foo:',
        '  displayName: A',
        '  post:' ,
        '    description: Blah',
        '    body:',
        '      application/json:',
        '        schema: foo',
        '    responses:',
        '      200:',
        '        body:',
        '         application/json:',
        '           schema: foo',
        '      201:',
        '        body:',
        '         application/json:',
        '           schema: foo2'
      ].join('\n');

      var expected = {
        title: 'Test',
        schemas: [{
          foo: "Blah blah\n"
        }],
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            body: {
              "application/json": {
                schema: "Blah blah\n"
              }
            },
            responses: {
              200: {
                body: {
                  "application/json": {
                    schema: "Blah blah\n"
                  }
                }
              },
              201: {
                body: {
                  "application/json": {
                    schema: "foo2"
                  }
                }
              }
            },
            method: 'post'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should apply multiple schemas', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'schemas:',
        '  - foo: |',
        '       Blah blah',
        '  - foo2: |',
        '       halb halB',
        '/foo:',
        '  displayName: A',
        '  post:' ,
        '    description: Blah',
        '    body:',
        '      application/json:',
        '        schema: foo',
        '    responses:',
        '      200:',
        '        body:',
        '         application/json:',
        '          schema: foo',
        '      201:',
        '        body:',
        '         application/json:',
        '          schema: foo2',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        schemas: [
          {
            foo: "Blah blah\n"
          },
          {
            foo2: "halb halB\n"
          }
        ],
        resources: [{
          displayName: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            body: {
              "application/json": {
                schema: "Blah blah\n"
              }
            },
            responses: {
              200: {
                body: {
                  "application/json": {
                    schema: "Blah blah\n"
                  }
                }
              },
              201: {
                body:{
                  "application/json": {
                    schema: "halb halB\n"
                  }
                }
              }
            },
            method: 'post'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

  });
  describe('Security schemes', function(){
    it('should fail when schemes is mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        '  foo: |',
        '       Blah blah',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid security schemes property, it must be an array/).and.notify(done);
    });
    it('should fail when schemes is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes: foo',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid security schemes property, it must be an array/).and.notify(done);
    });
    it('should fail when schemes is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid security schemes property, it must be an array/).and.notify(done);
    });
    it('should succeed when schemes is empty', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes: []',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail when schemes has a null scheme', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - ',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid security scheme property, it must be a map/).and.notify(done);
    });
    it('should fail when scheme is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme: scalar',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid security scheme property, it must be a map/).and.notify(done);
    });
    it('should fail when scheme is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme: []',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/invalid security scheme property, it must be a map/).and.notify(done);
    });
    it('should fail when scheme contains a wrong property', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     property: null',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property: 'property' is invalid in a security scheme/).and.notify(done);
    });
    it('should fail when scheme does not have type', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-{.+}"/).and.notify(done);
    });
    it('should succeed when type is "OAuth 2.0"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: OAuth 2.0',
        '     settings:',
        '       authorizationUrl: https://www.dropbox.com/1/oauth2/authorize',
        '       accessTokenUrl: https://api.dropbox.com/1/oauth2/token',
        '       authorizationGrants: [ code, token ]',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "OAuth 2.0",
              settings: {
                authorizationUrl: "https://www.dropbox.com/1/oauth2/authorize",
                accessTokenUrl: "https://api.dropbox.com/1/oauth2/token",
                authorizationGrants: ["code", "token"]
              }
            }
          }
        ],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when type is "OAuth 1.0"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: OAuth 1.0',
        '     settings:',
        '       requestTokenUri: https://api.dropbox.com/1/oauth/request_token',
        '       authorizationUri: https://www.dropbox.com/1/oauth/authorize',
        '       tokenCredentialsUri: https://api.dropbox.com/1/oauth/access_token',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "OAuth 1.0",
              settings:{
                requestTokenUri: "https://api.dropbox.com/1/oauth/request_token",
                authorizationUri: "https://www.dropbox.com/1/oauth/authorize",
                tokenCredentialsUri: "https://api.dropbox.com/1/oauth/access_token"
              }
            }
          }
        ],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when type is "Basic Authentication"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: Basic Authentication',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "Basic Authentication"
            }
          }
        ],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when type is "Digest Authentication"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: Digest Authentication',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "Digest Authentication"
            }
          }
        ],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when type is "x-other-something"', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: x-other-something',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "x-other-something"
            }
          }
        ],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when using null securityScheme', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: x-other-something',
        'securedBy: [ null ]',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "x-other-something"
            }
          }
        ],
        securedBy: [null],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when using a securityScheme', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: x-other-something',
        'securedBy: [ scheme ]',
        '/resource:'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "x-other-something"
            }
          }
        ],
        securedBy: [ "scheme" ],
        "resources": [
          {
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when using a securityScheme', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: x-other-something',
        '/resource:',
        '  securedBy: [ scheme ]'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "x-other-something"
            }
          }
        ],
        "resources": [
          {
            securedBy: [ "scheme" ],
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when using a securityScheme', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: x-other-something',
        '/resource:',
        '  get:',
        '    securedBy: [ scheme ]'
      ].join('\n');
      var expected = {
        "title": "Test",
        "securitySchemes": [
          {
            "scheme": {
              "description": "This is some text",
              "type": "x-other-something"
            }
          }
        ],
        "resources": [
          {
            "relativeUri": "/resource",
            methods:[
              {
                method: "get",
                securedBy: [ "scheme" ]
              }
            ]
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail when type is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type:',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-{.+}"/).and.notify(done);
    });
    it('should fail when type is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: []',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-{.+}"/).and.notify(done);
    });
    it('should fail when type is map', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'securitySchemes:',
        ' - scheme:',
        '     description: This is some text',
        '     type: {}',
        '/resource:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/schemes type must be any of: "OAuth 1.0", "OAuth 2.0", "Basic Authentication", "Digest Authentication", "x-{.+}"/).and.notify(done);
    });
  });
  describe('Resource Validations', function() {
    it('should fail if using parametric property name in a resource', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '  /b:',
        '    displayName: AB',
        '    <<property>>:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property '<<property>>' is invalid in a resource/).and.notify(done);
    });
    it('should fail if displayName is map', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '  /b:',
        '    displayName: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'displayName' must be a string/).and.notify(done);
    });
    it('should fail if displayName is sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '  /b:',
        '    displayName: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'displayName' must be a string/).and.notify(done);
    });
    it('should fail if description is map', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '  /b:',
        '    description: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'description' must be a string/).and.notify(done);
    });
    it('should fail if description is sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '  /b:',
        '    description: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'description' must be a string/).and.notify(done);
    });
    it('should fail if method is sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/method must be a mapping/).and.notify(done);
    });
    it('should fail if method is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get: false'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/method must be a mapping/).and.notify(done);
    });
    it('should fail if methods displayName is map', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '    displayName: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'displayName' must be a string/).and.notify(done);
    });
    it('should fail if methods displayName is sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '    displayName: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'displayName' must be a string/).and.notify(done);
    });
    it('should fail if methods description is map', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '    description: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'description' must be a string/).and.notify(done);
    });
    it('should fail if methods description is sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/a:',
        '  displayName: A',
        '  get:',
        '    description: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property 'description' must be a string/).and.notify(done);
    });
    it('should fail when declaring a URI parameter in a resource with a wrong property', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '/{hello}:',
        '  uriParameters:',
        '    hello:',
        '      displayName: A',
        '      blah: This is A'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property blah/).and.notify(done);
    });
    it('should fail when declaring a URI parameter in a nested resource with a wrong property', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '/{hello}:',
        '  uriParameters:',
        '    hello:',
        '      displayName: A',
        '  /{hello}:',
        '    uriParameters:',
        '      hello:',
        '        displayName: A',
        '        blah: This is A'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property blah/).and.notify(done);
    });
    it('should fail when not using a declared URI parameter in a nested resource', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '/{hello}:',
        '  uriParameters:',
        '    hello:',
        '      displayName: A',
        '  /{hello}:',
        '    uriParameters:',
        '      not-used:',
        '        displayName: A'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/not-used uri parameter unused/).and.notify(done);
    });
    it('should fail if headers is string', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'baseUriParameters:',
        '  a:',
        '    displayName: A',
        '    description: This is A',
        '/{hello}:',
        '  get:',
        '    headers: foo'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property: 'headers' must be a mapping/).and.notify(done);
    });
    it('should fail if headers is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  get:',
        '    headers: []'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property: 'headers' must be a mapping/).and.notify(done);
    });
    it('should succeed if headers is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    headers:'
      ].join('\n');

      var expected ={
        "title": "Test",
        "resources": [
          {
            "relativeUri": "/foo",
            "methods": [
              {
                "headers": null,
                "method": "get"
              }
            ]
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if header is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    headers:',
        '      foo: bar'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/each header must be a mapping/).and.notify(done);
    });
    it('should fail if header is empty sequence', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    headers:',
        '      foo: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/named parameter needs at least one type/).and.notify(done);
    });
    it('should fail if header uses unknown property', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    headers:',
        '      TemplateHeader:',
        '       foo:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/unknown property foo/).and.notify(done);
    });
    it('should fail if queryParams is string', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        '/{hello}:',
        '  get:',
        '    queryParameters: foo'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property: 'queryParameters' must be a mapping/).and.notify(done);
    });
    it('should fail if queryParameters is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/foo:',
        '  get:',
        '    queryParameters: []'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property: 'queryParameters' must be a mapping/).and.notify(done);
    });
    it('should succeed if queryParameters is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    queryParameters:'
      ].join('\n');

      var expected ={
        "title": "Test",
        "resources": [
          {
            "relativeUri": "/foo",
            "methods": [
              {
                "queryParameters": null,
                "method": "get"
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if queryParameters use wrong property name', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    queryParameters:',
        '     FooParam:',
        '       bar: bar'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/unknown property bar/).and.notify(done);
    });
    it('should fail if body is a scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body: foo'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property: body specification must be a mapping/).and.notify(done);
    });
    it('should succeed if body is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body:'
      ].join('\n');
      var expected = {
        title: "Test",
        resources: [
          {
            relativeUri: "/foo",
            methods: [
              {
                body: null,
                method: "get"
              }
            ]
          }
        ]
      }
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if body is using implicit after explicit body', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body:',
        '      application/json:',
        '      schema: foo'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/not compatible with explicit default Media Type/).and.notify(done);
    });
    it('should fail if body is using explicit after implicit body', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body:',
        '      schema: foo',
        '      application/json:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/not compatible with implicit default Media Type/).and.notify(done);
    });
    it('should fail if formParameters kicks implicit mode on', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body:',
        '      formParameters:',
        '      application/json:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/not compatible with implicit default Media Type/).and.notify(done);
    });
    it('should fail if schema kicks implicit mode on', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body:',
        '      schema: foo',
        '      application/json:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/not compatible with implicit default Media Type/).and.notify(done);
    });
    it('should fail if example kicks implicit mode on', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/foo:',
        '  get:',
        '    body:',
        '      example: foo',
        '      application/json:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/not compatible with implicit default Media Type/).and.notify(done);
    });

    it('should fail if formParameters is string', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        '/{hello}:',
        '  post:',
        '    body:',
        '      formParameters: foo'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property: 'formParameters' must be a mapping/).and.notify(done);
    });
    it('should fail if queryParameters is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        '/{hello}:',
        '  post:',
        '    body:',
        '      formParameters: []'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/property: 'formParameters' must be a mapping/).and.notify(done);
    });
    it('should succeed if queryParameters is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'mediaType: application/json',
        'baseUri: http://{a}.myapi.org',
        '/{hello}:',
        '  post:',
        '    body:',
        '      formParameters:'
      ].join('\n');

      var expected ={
        title: "Test",
        mediaType: "application/json",
        baseUri: "http://{a}.myapi.org",
        resources: [
          {
            relativeUri: "/{hello}",
            methods: [
              {
                body:{
                  "application/json": {
                    formParameters: null
                  }
                },
                method: "post"
              }
            ],
            uriParameters: {
              hello: {
                type: "string",
                required: true,
                displayName: "hello"
              }
            }
          }
        ],
        baseUriParameters: {
          a: {
            type: "string",
            required: true,
            displayName: "a"
          }
        }
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if queryParameters use wrong property name', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        '/{hello}:',
        '  post:',
        '    body:',
        '      formParameters:',
        '        Formparam:',
        '           foo: blah'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/unknown property foo/).and.notify(done);
    });
    it('should fail if responses is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/root:',
        '  post:',
        '    responses: scalar'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property: 'responses' must be a mapping/).and.notify(done);
    });
    it('should fail if responses is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/root:',
        '  post:',
        '    responses: [ value ]'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/property: 'responses' must be a mapping/).and.notify(done);
    });
    it('should succeed if responses is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/root:',
        '  post:',
        '    responses:'
      ].join('\n');

      var expected = {
        "title": "Test",
        "resources": [
          {
            "relativeUri": "/root",
            "methods": [
              {
                "responses": null,
                "method": "post"
              }
            ]
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if response code is string', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/root:',
        '  post:',
        '    responses:',
        '     responses:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/each response key must be an integer/).and.notify(done);
    });
    it('should fail if response code is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/root:',
        '  post:',
        '    responses:',
        '     ~:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/each response key must be an integer/).and.notify(done);
    });
    it('should fail if response code in list is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        'title: Test',
        '/root:',
        '  post:',
        '    responses:',
        '     [string]:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/each response key must be an integer/).and.notify(done);
    });
  });
  describe('Base Uri Parameters', function(){
    it('should fail when a resource specified baseUriParams and baseuri is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        '/resource:',
        '  baseUriParameters:',
        '   domainName:',
        '     example: your-bucket'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/base uri parameters defined when there is no baseUri/).and.notify(done);
    });
    it('should fail when a resource specified baseUriParams unused in the URI', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'baseUri: https://myapi.com',
        'title: Test',
        '/resource:',
        '  baseUriParameters:',
        '   domainName:',
        '     example: your-bucket'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/domainName uri parameter unused/).and.notify(done);
    });
    it('should succeed when a overriding baseUriParams in a resource', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'baseUri: https://{domainName}.myapi.com',
        'title: Test',
        '/resource:',
        '  baseUriParameters:',
        '   domainName:',
        '     example: your-bucket'
      ].join('\n');
      var expected = {
        "baseUri": "https://{domainName}.myapi.com",
        "title": "Test",
        baseUriParameters: {
          domainName: {
            type: "string",
            required: true,
            displayName: "domainName"
          }
        },
        "resources": [
          {
            "baseUriParameters": {
              "domainName": {
                "example": "your-bucket",
                type: "string",
                required: true,
                displayName: "domainName"
              }
            },
            "relativeUri": "/resource"
          }
        ]
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should succeed when a overriding baseUriParams in a resource 3 levels deep', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'baseUri: https://{domainName}.myapi.com',
        'title: Test',
        '/resource:',
        ' /resource:',
        '   /resource:',
        '     baseUriParameters:',
        '       domainName:',
        '         example: your-bucket'
      ].join('\n');
      var expected = {
        "baseUri": "https://{domainName}.myapi.com",
        "title": "Test",
        baseUriParameters: {
          domainName: {
            type: "string",
            required: true,
            displayName: "domainName"
          }
        },
        "resources": [
          {
            "relativeUri": "/resource",
            "resources": [
              {
                "relativeUri": "/resource",
                "resources": [
                  {
                    "baseUriParameters": {
                      "domainName": {
                        "example": "your-bucket",
                        type: "string",
                        required: true,
                        displayName: "domainName"
                      }
                    },
                    "relativeUri": "/resource"
                  }
                ]
              }
            ]
          }
        ]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });
  });
  describe('Documentation section', function() {
    it('should fail if docsection is empty array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation: []'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/there must be at least one document in the documentation section/).and.notify(done);
    });
    it('should fail if docsection is missing title', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation:',
        '  - content: Content'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/a documentation entry must have title property/).and.notify(done);
    });
    it('should fail if docsection is missing content', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation:',
        '  - title: Getting Started'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/a documentation entry must have content property/).and.notify(done);
    });
    it('should fail if docsection is mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation: {}'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/documentation must be an array/).and.notify(done);
    });
    it('should fail if docsection is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation: scalar'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/documentation must be an array/).and.notify(done);
    });
    it('should fail if docentry is scalar', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation: [scalar]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/each documentation section must be a mapping/).and.notify(done);
    });
    it('should fail if docentry is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation: [[scalar]]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/each documentation section must be a mapping/).and.notify(done);
    });
    it('should fail if docentry uses wrong property name', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation:',
        '  - title: Getting Started',
        '    content: Getting Started',
        '    wrongPropertyName: Getting Started'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property wrongPropertyName/).and.notify(done);
    });
    it('should fail if has null title', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation:',
        '  - title:',
        '    content: Getting Started'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/title must be a string/).and.notify(done);
    });
    it('should fail if has null content', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'documentation:',
        '  - title: some title',
        '    content:'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/content must be a string/).and.notify(done);
    });
  });
  describe('Default Media Type', function() {
    it('should fail if mediaType property is null', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'mediaType:'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/mediaType must be a scalar/).and.notify(done);
    });
    it('should fail if mediaType property is array', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'mediaType: []'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/mediaType must be a scalar/).and.notify(done);
    });
    it('should fail if mediaType property is mapping', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'mediaType: {}'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/mediaType must be a scalar/).and.notify(done);
    });
    it('should not fail if mediaType property is used in root', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'mediaType: application/json'
      ].join('\n');
      var expected = {
        title: "MyApi",
        mediaType: "application/json"
      };
      raml.load(definition).should.become(expected).and.notify(done);
    });
    it('should fail if mediaType property is not present and implicit mode is detected in a resource', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        '/resource:',
        '  post:',
        '    body:',
        '     example: example of a post',
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/body tries to use default Media Type, but mediaType is null/).and.notify(done);
    });
    it('should fail if mediaType property is not present and implicit mode is detected in a trait', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'traits:',
        '  - traitName:',
        '      body:',
        '        example: example of a post',
        '/resource:',
        '  is: [traitName]'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/body tries to use default Media Type, but mediaType is null/).and.notify(done);
    });
    it('should fail if mediaType property is not present and implicit mode is detected in a resourceType', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: MyApi',
        'resourceTypes:',
        '  - typeName:',
        '      post:',
        '        body:',
        '          example: example of a post',
        '/resource:',
        '  type: typeName'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/body tries to use default Media Type, but mediaType is null/).and.notify(done);
    });
    describe('Default Media Type in request body', function(){
      it('should apply mediaType property in a resource', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          '/resource:',
          '  post:',
          '    body:',
          '     example: example of a post',
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resources:[
            {
              relativeUri: "/resource",
              methods: [
                {
                  body: {
                    "application/json": {
                      example: "example of a post"
                    }
                  },
                  method: "post"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a resourceType', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      get:',
          '        body:',
          '          example: example of a response',
          '/resource:',
          '  type: gettable'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                get: {
                  body:{
                    example: "example of a response"
                  }
                }
              }
            }
          ],
          resources:[
            {
              type: "gettable",
              relativeUri: "/resource",
              methods: [
                {
                  body: {
                    "application/json": {
                      example: "example of a response"
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a trait composed with a resourceType', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      get:',
          '        is: [bodiable]',
          'traits:',
          '  - bodiable:',
          '      body:',
          '        example: example of a response',
          '/resource:',
          '  type: gettable'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                get: {
                  is: ["bodiable"]
                }
              }
            }
          ],
          traits: [{
            bodiable: {
              body:{
                example: "example of a response"
              }
            }
          }],
          resources:[
            {
              type: "gettable",
              relativeUri: "/resource",
              methods: [
                {
                  body: {
                    "application/json": {
                      example: "example of a response"
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a trait composed resource', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      get:',
          '        is: [bodiable]',
          'traits:',
          '  - bodiable:',
          '          body:',
          '            example: example of a response',
          '/resource:',
          '  is: [bodiable]',
          '  get:'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                get: {
                  is: ["bodiable"]
                }
              }
            }
          ],
          traits: [{
            bodiable: {
              body:{
                example: "example of a response"
              }
            }
          }],
          resources:[
            {
              is: ["bodiable"],
              relativeUri: "/resource",
              methods: [
                {
                  body: {
                    "application/json": {
                      example: "example of a response"
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a trait composed with a resourceType which inherits from another RT and applies a trait', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      type: secondLevel',
          '  - secondLevel:',
          '      is: [bodiable]',
          '      get:',
          '            body:',
          '              schema: composable schema',
          'traits:',
          '  - bodiable:',
          '          body:',
          '            example: example of a response',
          '/resource:',
          '  type: gettable'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                type: "secondLevel"
              }
            },
            {
              secondLevel: {
                is: [ "bodiable" ],
                get: {
                  body: {
                    schema: "composable schema"
                  }
                }
              }
            }
          ],
          traits: [{
            bodiable: {
              body:{
                example: "example of a response"
              }
            }
          }],
          resources:[
            {
              type: "gettable",
              relativeUri: "/resource",
              methods: [
                {
                  body: {
                    "application/json": {
                      schema: "composable schema",
                      example: "example of a response"
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
    });
    describe('Default Media Type in response body', function(){
      it('should apply mediaType property in a resource', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          '/resource:',
          '  post:',
          '    responses:',
          '      200:',
          '        body:',
          '          example: example of a post'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resources:[
            {
              relativeUri: "/resource",
              methods: [
                {
                  responses: {
                    200:{
                      body: {
                        "application/json": {
                          example: "example of a post"
                        }
                      }
                    }
                  },
                  method: "post"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a resourceType', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      get:',
          '        responses:',
          '          200:',
          '            body:',
          '              example: example of a response',
          '/resource:',
          '  type: gettable'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                get: {
                  responses: {
                    200: {
                      body:{
                        example: "example of a response"
                      }
                    }
                  }
                }
              }
            }
          ],
          resources:[
            {
              type: "gettable",
              relativeUri: "/resource",
              methods: [
                {
                  responses: {
                    200: {
                      body: {
                        "application/json": {
                          example: "example of a response"
                        }
                      },
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a trait composed with a resourceType', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      get:',
          '        is: [bodiable]',
          'traits:',
          '  - bodiable:',
          '      responses:',
          '        200:',
          '          body:',
          '            example: example of a response',
          '/resource:',
          '  type: gettable'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                get: {
                  is: ["bodiable"]
                }
              }
            }
          ],
          traits: [{
            bodiable: {
              responses: {
                200: {
                  body:{
                    example: "example of a response"
                  }
                }
              }
            }
          }],
          resources:[
            {
              type: "gettable",
              relativeUri: "/resource",
              methods: [
                {
                  responses: {
                    200: {
                      body: {
                        "application/json": {
                          example: "example of a response"
                        }
                      },
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a trait composed resource', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      get:',
          '        is: [bodiable]',
          'traits:',
          '  - bodiable:',
          '      responses:',
          '        200:',
          '          body:',
          '            example: example of a response',
          '/resource:',
          '  is: [bodiable]',
          '  get:'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                get: {
                  is: ["bodiable"]
                }
              }
            }
          ],
          traits: [{
            bodiable: {
              responses: {
                200: {
                  body:{
                    example: "example of a response"
                  }
                }
              }
            }
          }],
          resources:[
            {
              is: ["bodiable"],
              relativeUri: "/resource",
              methods: [
                {
                  responses: {
                    200: {
                      body: {
                        "application/json": {
                          example: "example of a response"
                        }
                      },
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
      it('should apply mediaType property in a trait composed with a resourceType which inherits from another RT and applies a trait', function(done) {
        var definition = [
          '#%RAML 0.2',
          '---',
          'title: MyApi',
          'mediaType: application/json',
          'resourceTypes:',
          '  - gettable:',
          '      type: secondLevel',
          '  - secondLevel:',
          '      is: [bodiable]',
          '      get:',
          '        responses:',
          '          200:',
          '            body:',
          '              schema: composable schema',
          'traits:',
          '  - bodiable:',
          '      responses:',
          '        200:',
          '          body:',
          '            example: example of a response',
          '/resource:',
          '  type: gettable'
        ].join('\n');
        var expected = {
          title: "MyApi",
          mediaType: "application/json",
          resourceTypes: [
            {
              gettable: {
                type: "secondLevel"
              }
            },
            {
              secondLevel: {
                is: [ "bodiable" ],
                get: {
                  responses: {
                    200: {
                      body: {
                        schema: "composable schema"
                      }
                    }
                  }
                }
              }
            }
          ],
          traits: [{
            bodiable: {
              responses: {
                200: {
                  body:{
                    example: "example of a response"
                  }
                }
              }
            }
          }],
          resources:[
            {
              type: "gettable",
              relativeUri: "/resource",
              methods: [
                {
                  responses: {
                    200: {
                      body: {
                        "application/json": {
                          schema: "composable schema",
                          example: "example of a response"
                        }
                      },
                    }
                  },
                  method: "get"
                }
              ]
            }
          ]
        };
        raml.load(definition).should.become(expected).and.notify(done);
      });
    });
  });
  describe('Error reporting', function () {
    it('should report correct line/column for invalid trait error', function(done) {
      var noop = function () {};
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Test',
        'traits:',
        '  - wrongKey:',
        '      displayName: Rate Limited',
        '      responses:',
        '        503:',
        '          description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  is: [ throttled, rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).then(noop, function (error) {
        setTimeout(function () {
          expect(error.problem_mark).to.exist;
          error.problem_mark.column.should.be.equal(8);
          error.problem_mark.line.should.be.equal(10);
          done();
        }, 0);
      });
    });
    it('should report correct line/column for missing title', function(done) {
      var noop = function () {};
      var definition = [
        '#%RAML 0.2',
        '---',
        '/:',
        '  get:'
      ].join('\n');
      raml.load(definition).then(noop, function (error) {
        setTimeout(function () {
          expect(error.problem_mark).to.exist;
          error.problem_mark.column.should.be.equal(0);
          error.problem_mark.line.should.be.equal(2);
          done();
        }, 0);
      });
    });
    it('should report correct line/column for missing title', function(done) {
      var noop = function () {};
      var definition = [
        '#%RAML 0.2',
        '---'
      ].join('\n');
      raml.load(definition).should.be.rejected.with(/document must be a mapping/).and.notify(done);
    });
    it('should not mark query parameters as required by default', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Title',
        'baseUri: http://server/api',
        '/:',
        '  get:',
        '    queryParameters:',
        '      notRequired:',
        '        type: integer'
      ].join('\n');
      var expected = {
        title: 'Title',
        baseUri: 'http://server/api',
        resources: [
          {
            relativeUri: '/',
            methods: [
              {
                method: 'get',
                queryParameters: {
                  notRequired: {
                    type: 'integer',
                    displayName: 'notRequired'
                  }
                }
              }
            ]
          }
        ]
      }
      raml.load(definition).should.become(expected).and.notify(done);
    })
    it('should mark query parameters as required when explicitly requested', function(done) {
      var definition = [
        '#%RAML 0.2',
        '---',
        'title: Title',
        'baseUri: http://server/api',
        '/:',
        '  get:',
        '    queryParameters:',
        '      mustBeRequired:',
        '        type: integer',
        '        required: true'
      ].join('\n');
      var expected = {
        title: 'Title',
        baseUri: 'http://server/api',
        resources: [
          {
            relativeUri: '/',
            methods: [
              {
                method: 'get',
                queryParameters: {
                  mustBeRequired: {
                    type: 'integer',
                    displayName: 'mustBeRequired',
                    required: true
                  }
                }
              }
            ]
          }
        ]
      }
      raml.load(definition).should.become(expected).and.notify(done);
    })
  });
});
