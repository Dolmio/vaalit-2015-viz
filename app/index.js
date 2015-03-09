"use strict";
var R = require('ramda');
var $ = require('jquery');
var questions = require("./data/questions.json").questions;
var groupedByDistrictData = cleanDefaultColumn(require("./data/district-mean.csv"));


var groupedByPartyData = require("./data/party-mean.csv");
var groupedByAgeData = require("./data/age-mean.csv");
var groupedByGenderData = cleanNullColumn(require("./data/gender-mean.csv"))

var variancePartyData = require("./data/party-variance.csv");
var varianceDistrictData = cleanDefaultColumn(require("./data/district-variance.csv"));
var varianceAgeData = require("./data/age-variance.csv");
var varianceGenderData = cleanNullColumn(require("./data/gender-variance.csv"));

function cleanNullColumn(data) {
    return cleanColumns(data, ['NULL']);
}

function cleanDefaultColumn(data) {
    return cleanColumns(data, ['default']);
}
function cleanColumns(data, columns) {
    return R.map(function(question) { return R.omit(columns, question)}, data);
}

var dataMap = {
    "district" :
        {
         "mean": groupedByDistrictData,
         "variance": varianceDistrictData
        },
    "party":  {
        "mean": groupedByPartyData,
        "variance": variancePartyData
    },
    "age":  {
        "mean": groupedByAgeData,
        "variance": varianceAgeData
    },
    "gender":  {
        "mean": groupedByGenderData,
        "variance": varianceGenderData
    }
};
console.log(dataMap);
var currentQuestion;
function init() {
    var $previousQuestionButton = $(".previousQuestion");
    var $nextQuestionButton = $(".nextQuestion");
    var $selectionGroup = $(".group-selection label");
    var selectedData = dataMap.district;

    $previousQuestionButton.on('click', function() {
        currentQuestion--;
        generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);
    });

    $nextQuestionButton.on('click', function() {
        currentQuestion++;
        generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);
    });

    $selectionGroup.on('click', function() {
        selectedData = dataMap[$(this).find('input')[0].value];
        generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);
    });

    currentQuestion = 1;
    generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);

}



function generateGraph(questionNumber, $nextButton, $previousButton, selectedData) {

    var questionIndex = questionNumber - 1 ;
    var ctx = document.getElementById("myChart").getContext("2d");

    function formatYScale(scaleObject) {
        switch(scaleObject.value) {
            case "1": return "Täysin eri mieltä";
            case "3": return "En osaa sanoa";
            case "5": return "Täysin samaa mieltä";
            default: return "";
        }
    }

    var options = {
        animation: false,
        legendTemplate : "<ul> <h1>Joujou</h1></h></ul>",
        scaleOverride: true,
        scaleSteps: 4,
        scaleStepWidth: 1,
        scaleStartValue: 1,
        scaleLabel : formatYScale,
        showTooltips: false,
        scaleFontFamily: "'Roboto'",
        responsive: true


    };
    new Chart(ctx).Bar(generateDataSet(selectedData.mean[questionIndex]), options);
    new Chart(document.getElementById("myChart2").getContext("2d")).Bar(generateDataSet(selectedData.variance[questionIndex]), options);
    $('.chartQuestion').text(questions[questionIndex]);
    $previousButton.prop('disabled', questionNumber == 1);
    $nextButton.prop('disabled', questionNumber == questions.length);
    $('.questionNumber').text(questionNumber);
}
function generateDataSet(question) {
    return {
        labels: R.keys(question),
        datasets: [
            {
                label: "My First dataset",
                fillColor: "rgba(220,220,220,0.5)",
                strokeColor: "rgba(220,220,220,0.8)",
                highlightFill: "rgba(220,220,220,0.75)",
                highlightStroke: "rgba(220,220,220,1)",
                data: R.values(question)
            }
        ]
    }
}


document.addEventListener('DOMContentLoaded', function () {
    init();
});
