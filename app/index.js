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

    $('.chartQuestion').text(questions[questionIndex]);
    $previousButton.prop('disabled', questionNumber == 1);
    $nextButton.prop('disabled', questionNumber == questions.length);
    $('.questionNumber').text(questionNumber);


    c3.generate(getChartOptions(
        R.values(selectedData.mean[questionIndex]),
        R.values(selectedData.variance[questionIndex]),
        R.keys(selectedData.mean[questionIndex])

    ));
    genChart(R.keys(selectedData.mean[questionIndex]), R.values(selectedData.mean[questionIndex]));


}

function genChart(categories, means) {
    var chart;
    $(function () {
        $('#container').highcharts({
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Temperature vs Rainfall'
            },
            xAxis: [{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            }],
            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value} °C',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                title: {
                    text: 'Temperature',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                }
            }],

            tooltip: {
                enabled: false,
                shared: true
            },

            series: [ {
                name: 'Temperature',
                type: 'spline',
                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
                tooltip: {
                    pointFormat: '<span style="font-weight: bold; color: {series.color}">{series.name}</span>: <b>{point.y:.1f}°C</b> '
                },
                lineWidth: 0,
                marker : {
                    enabled : true,
                    radius : 4
                }
            }, {
                name: 'Temperature error',
                type: 'errorbar',
                data: [[6, 8], [5.9, 7.6], [9.4, 10.4], [14.1, 15.9], [18.0, 20.1], [21.0, 24.0], [23.2, 25.3], [26.1, 27.8], [23.2, 23.9], [18.0, 21.1], [12.9, 14.0], [7.6, 10.0]],
                tooltip: {
                    pointFormat: '(error range: {point.low}-{point.high}°C)<br/>'
                }
            }]
        });
    });
}

function getChartOptions(dataset1, dataset2, categories) {

    function formatYScale(value) {
        var num = Number(value);
        switch(num) {
            case  1: return "Täysin eri mieltä";
            case  3: return "En osaa sanoa";
            case  5: return "Täysin samaa mieltä";
            default: return "";
        }
    }

    return {
        data: {
            columns: [
                R.prepend('vastausten keskiarvo', dataset1),
                R.prepend('vastausten varianssi', dataset2)
            ],
            type: 'bar',
            axes: {
                data1: 'y',
                data2: 'y2'
            },
            colors: {
                'vastausten keskiarvo': "#A5DBEB",
                'vastausten varianssi': 'rgba(220,220,220,0.8)'
            }
        },
        padding: {
            top: 0,

            bottom: 0
        },
        legend: {
            position: 'bottom'
        },
        bar: {
            width: {
                ratio: 0.5
            }
        },
        axis: {
            rotated: true,
            x: {
                type: 'category',
                categories: categories,
                tick: {
                    multiline: false
                }
            },
            y2: {
                label: "Varianssi",
                show: true,
                min: 0,
                max: 1,
                tick: {
                    count: 5
                }
            },
            y: {
                label: "Keskiarvo",
                min: 1,
                max: 5,
                tick: {
                    values: [1, 2, 3, 4, 5],
                    format: formatYScale
                }
            }
        },
        tooltip: {
            show: false
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});
