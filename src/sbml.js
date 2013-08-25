/*global state:false numeric:false SbmlParser*/
// sbml.js: Parsing sbml documents
'use strict';

function SbmlParser(sbmlDoc) {
    if(sbmlDoc.documentElement !== undefined) {
        // already doc
        this.sbml = sbmlDoc;
    } else if(sbmlDoc.substr(0,1) === '<') {
        // load from string
        var parser = new DOMParser();
        this.sbml = parser.parseFromString(sbmlDoc, 'text/xml');
    }
    
    this.update();
}

// updates parameters and propogates changes to other model properties
SbmlParser.prototype.updateParameter = function(id, value) {
    if ( this.sbml.querySelectorAll('parameter#' + id).length === 1) {
        this.sbml.querySelectorAll('parameter#' + id)[0].setAttribute('value',value);
    } else if (this.sbml.querySelectorAll('compartment#' + id).length === 1) {
        this.sbml.querySelectorAll('compartment#' + id)[0].setAttribute('size',value);
    }
    this.update();
};

// updates parameters and propogates changes to other model properties
SbmlParser.prototype.updateParameters = function(parameters) {
    for (var i = 0; i < this.sbml.querySelectorAll('parameter').length; i++) { // from parameters
        this.sbml.querySelectorAll('parameter')[i].setAttribute('value', parameters[this.sbml.querySelectorAll('parameter')[i].getAttribute('id')] );
    }
    for (i = 0; i < this.sbml.querySelectorAll('compartment').length; i++) { // from compartments
        this.sbml.querySelectorAll('compartment')[i].setAttribute('size', parameters[this.sbml.querySelectorAll('compartment')[i].getAttribute('id')] );
    }
    this.update();
};

// updates single species and propogates changes to other model properties
SbmlParser.prototype.updateSpecies = function(id, attribute, value) {
    this.sbml.querySelectorAll('species#' + id)[0].setAttribute(attribute, value);
    this.update();
};

// updates propogates changes to other model properties
SbmlParser.prototype.update = function() {
    this.parameters = this.getParameters();
    this.listOfSpecies = this.getListOfSpecies();
    this.stoichiometry = this.getStoichiometry();
    this.listOfReactionInfix = this.getListOfReactionInfix();
};

// finds parameters and compartments in model
SbmlParser.prototype.getParameters = function() {
    var parameters = {};
    for (var i = 0; i < this.sbml.querySelectorAll('parameter').length; i++) { // from parameters
        parameters[this.sbml.querySelectorAll('parameter')[i].getAttribute('id')] = this.sbml.querySelectorAll('parameter')[i].getAttribute('value');
    }
    for (i = 0; i < this.sbml.querySelectorAll('compartment').length; i++) { // from compartments
        parameters[this.sbml.querySelectorAll('compartment')[i].getAttribute('id')] = this.sbml.querySelectorAll('compartment')[i].getAttribute('size');
    }
    return parameters;
};

// returns list of species in model
SbmlParser.prototype.getListOfSpecies = function() {
    var listOfSpecies = [];
    for (var i = 0; i < this.sbml.querySelectorAll('species').length; i++) {
        listOfSpecies[i] = this.sbml.querySelectorAll('species')[i].getAttribute('id');
    }
    return listOfSpecies;
};

// returns stoichiometry matrix
SbmlParser.prototype.getStoichiometry = function() {
    var listOfSpecies = this.listOfSpecies;
    var i;
    var colRxn = [];
    for (i = 0; i < this.sbml.querySelectorAll('reaction').length; i++) {
        colRxn.push(0);
    }
    var stoichiometryMatrix = [];
    for (i = 0; i < listOfSpecies.length; i++) {
        stoichiometryMatrix.push(new Array(colRxn));
    }
    for (i = 0; i < this.sbml.querySelectorAll('reaction').length; i++) {
        var a = this.sbml.querySelectorAll('reaction')[i];
        var listOfProducts = a.querySelectorAll('listOfProducts speciesReference');
        var ind;
        for (var j = 0; j < listOfProducts.length; j++) {
            ind = listOfSpecies.indexOf(listOfProducts[j].getAttribute('species'));
            stoichiometryMatrix[ind][i] = 1;
        }
        var listOfReactants = a.querySelectorAll('listOfReactants speciesReference');
        for (j = 0; j < listOfReactants.length; j++) {
            ind = listOfSpecies.indexOf(listOfReactants[j].getAttribute('species'));
            stoichiometryMatrix[ind][i] = -1;
        }
    }
    return stoichiometryMatrix;
};

// returns list of infix strings for reactions
SbmlParser.prototype.getListOfReactionInfix = function() {
    var parameters = this.parameters;
    var listOfSpecies = this.listOfSpecies;
    var listOfReactionInfix = [];
    for (var i = 0; i < this.sbml.querySelectorAll('reaction').length; i++) {
        var a = this.sbml.querySelectorAll('reaction')[i].getElementsByTagName('ci');

        var key = a[0].textContent.replace(/\s+/g, '');
        var token;
        if (parameters[key] !== undefined) {
            token = parameters[key];
        }
        else if (listOfSpecies.indexOf(key) > -1) {
            token = 'x[' + listOfSpecies.indexOf(key) + ']';
        }
        else {
            token = key;
        }

        var infixString = token;
        for (var j = 1; j < a.length; j++) {
            key = a[j].textContent.replace(/\s+/g, '');
            if (parameters[key] !== undefined) {
                token = parameters[key];
            }
            else if (listOfSpecies.indexOf(key) > -1) {
                token = 'x[' + listOfSpecies.indexOf(key) + ']';
            }
            else {
                token = key;
            }
            infixString += '*' + token;
        }
        
        // optionally appends infix strings to nodes
        //input.nodes[this.sbml.querySelectorAll('reaction')[i].getAttribute('id')].infixString = infixString; // saves infix string to node

        listOfReactionInfix[i] = infixString;
    }
    return listOfReactionInfix;
};