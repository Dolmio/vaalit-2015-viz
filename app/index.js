"use strict";
var R = require('ramda');
var questions = require("./data/questions.json").questions;
var groupedByDistrictData = cleanDefaultColumn(require("./data/district-mean.csv"));


var groupedByPartyData = require("./data/party-mean.csv");
var groupedByAgeData = require("./data/age-mean.csv");
var groupedByGenderData = cleanNullColumn(require("./data/gender-mean.csv"));

var variancePartyData = require("./data/party-variance.csv");
var varianceDistrictData = cleanDefaultColumn(require("./data/district-variance.csv"));
var varianceAgeData = require("./data/age-variance.csv");
var varianceGenderData = cleanNullColumn(require("./data/gender-variance.csv"));

var currentQuestion;

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

function init() {
    var $previousQuestionButton = $(".previousQuestion");
    var $nextQuestionButton = $(".nextQuestion");
    var $selectionGroup = $(".group-selection label");
    var selectedData = dataSource.district;

    $previousQuestionButton.on('click', function() {
        currentQuestion--;
        generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);
    });

    $nextQuestionButton.on('click', function() {
        currentQuestion++;
        generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);
    });

    $selectionGroup.on('click', function() {
        selectedData = dataSource[$(this).find('input')[0].value];
        generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);
    });

    currentQuestion = 1;
    generateGraph(currentQuestion, $nextQuestionButton, $previousQuestionButton, selectedData);


}



function generateGraph(questionNumber, $nextButton, $previousButton, selectedData) {

    var questionIndex = questionNumber - 1 ;

    $('.chartQuestion').text(questions[questionIndex]);
    $previousButton.prop('disabled', questionNumber == 1);
    $nextButton.prop('disabled', questionNumber == questions.length);
    $('.questionNumber').text(questionNumber);
    console.log("Lol");
    console.log(selectedData)
    genChart(resultsByQuestion(questionNumber, selectedData));




}

function toNumbers(strings) {
    return R.map(function(val) {
        return Number(val);
    }, strings);
}

function genChart(groupedData) {

    console.log(groupedData);
    function formatYScale() {
        console.log(this.value);
        switch(this.value) {
            case  1: return "Täysin eri mieltä";
            case  3: return "En osaa sanoa";
            case  5: return "Täysin samaa mieltä";
            default: return "";
        }
    }
    console.log(R.keys(groupedData));
    console.log(R.values(groupedData));
    $(function () {
        $('#container').highcharts({

            chart: {
                type: 'boxplot'
            },

            title: {
                text: 'Highcharts Box Plot Example'
            },

            legend: {
                enabled: false
            },

            xAxis: {
                categories: R.keys(groupedData),
                title: {
                    text: 'Experiment No.'
                }
            },

            yAxis: {
                title: {
                    text: 'Observations'
                },
                plotLines: [{
                    color: 'red',
                    width: 1,
                    label: {
                        text: 'Theoretical mean: 932',
                        align: 'center',
                        style: {
                            color: 'gray'
                        }
                    }
                }]
            },

            series: [{
                name: 'Observations',
                data: [[760, 801, 848, 895, 965],
                    [733, 853, 939, 980, 1080],
                    [714, 762, 817, 870, 918],
                    [724, 802, 806, 871, 950],
                    [834, 836, 864, 882, 910],
                    [760, 801, 848, 895, 965],
                    [733, 853, 939, 980, 1080],
                    [714, 762, 817, 870, 918],
                    [724, 802, 806, 871, 950],
                    [834, 836, 864, 882, 910],
                    [724, 802, 806, 871, 950],
                    [834, 836, 864, 882, 910]]
                ,
                tooltip: {
                    headerFormat: '<em>Experiment No {point.key}</em><br/>'
                }
            }]

        });
    });
}



document.addEventListener('DOMContentLoaded', function () {
    init();
});


var hsData = require("./data/out.csv");

function groupBy(property) {
    return R.groupBy(function(object) {
        return object[property];
    })
}

function resultsByQuestion(questionNumber, groupedData) {
    var questionKey = "q" + questionNumber;
    return R.mapObj(function(group) {
        return R.filter(R.identity, R.map(getNumProperty(questionKey), group))
    }, groupedData)
}

function getNumProperty(property) {
    return function(obj) {
        return Number(obj[property]);
    };
}

function isNumber(num) {
    return !isNaN(num);
}

var byDistrict = groupBy("district");


var groupedByDistrict = byDistrict(hsData);

var dataSource = {
    district: groupBy("district")(hsData),
    party: groupBy("party")(hsData),
    gender: groupBy("gender")(hsData),
    age: groupBy("age")(hsData)
};


