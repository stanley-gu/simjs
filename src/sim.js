
// simulation.js: functions for simulating models using numeric.js
'use strict';
function Sim() {
/*global $:false state:false numeric:false SbmlParser:true*/
}

Sim.prototype.simulate = function($sbmlDoc) {
    /*global SbmlParser*/
    var sbmlModel = new SbmlParser($sbmlDoc);
    var listOfSpecies = sbmlModel.listOfSpecies;

    /*global state*/
    var species = state.$sbmlDoc.find('species');
    // calculate stoichiometry matrix
    var stoichiometryMatrix = sbmlModel.stoichiometry;
    // finding infix        
    var listOfReactionInfix = sbmlModel.listOfReactionInfix;

    var f = function() {
        var odeString = '';
        var count = 0;
        for (var i = 0; i < species.length; i++) {
            count += 1;
            for (var j = 0; j < listOfReactionInfix.length; j++) {
                var stoich = stoichiometryMatrix[i][j];
                odeString += stoich + ' * (' + listOfReactionInfix[j] + ')';
                if (j < listOfReactionInfix.length - 1) {
                    odeString += ' + ';
                }
            }
            if (count < species.length) {
                odeString += ' , ';
            }
        }
        /*jslint evil: true */
        return eval(odeString);
    };

    var initialConditions = [];
    for (var i = 0; i < listOfSpecies.length; i++) {
        initialConditions.push(parseFloat($(species[i]).attr('initialAmount')));
    }

    /*global numeric*/
    var sol = numeric.dopri(0, 50, initialConditions, f, 1e-6, 2000);

    var time = sol.x;
    var numSol = numeric.transpose(sol.y);
    // creating a simulation solution data structure
    var data = [];

    for (i = 0; i < time.length; i++) {
        var iter = {};
        iter.time = time[i];
        for (var j = 0; j < numSol.length; j++) {
            iter[listOfSpecies[j]] = numSol[j][i];
        }
        //            iter.value = sol.y[i];
        data.push(iter);
    }
    return data;
};