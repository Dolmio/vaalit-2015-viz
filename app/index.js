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

    var categories = R.keys(selectedData.mean[questionIndex]);
    var means = toNumbers(R.values(selectedData.mean[questionIndex]));
    var variances = R.values(selectedData.variance[questionIndex])
    genChart(categories, means, variances);


}

function toNumbers(strings) {
    return R.map(function(val) {
        return Number(val);
    }, strings);
}

function genChart(categories, means, variances) {



    function formatYScale() {
        console.log(this.value);
        switch(this.value) {
            case  1: return "Täysin eri mieltä";
            case  3: return "En osaa sanoa";
            case  5: return "Täysin samaa mieltä";
            default: return "";
        }
    }

    function getPairs(means, variances) {
        return R.map(function(zipped) {
            var mean = zipped[0];
            var variance = zipped[1];
            var stdDev = Math.sqrt(variance);
            return [mean - stdDev, mean + stdDev];
            },
        R.zip(means, variances));
    }

    var chart;
    var pairs = getPairs(means, variances);
    $(function () {
        $('#container').highcharts({
            chart: {
                animation: false,
                zoomType: 'xy',
                inverted: false
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                series: {
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            },
            title: {
                text: 'Vastausten keskiarvo ja keskihajonta'
            },
            xAxis: [{
                categories: categories
            }],
            yAxis: [{ // Primary yAxis
                labels: {
                    formatter: formatYScale,
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                title: {
                    enabled: false,
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                min: 1,
                max: 5
            }],

            tooltip: {
                enabled: false,
                shared: true
            },
            legend: {
                enabled: false
            },
            series: [ {
                name: 'Temperature',
                type: 'spline',
                data: means,
                lineWidth: 0,
                marker : {
                    enabled : true,
                    radius : 4
                }
            }, {
                name: 'Keskihajonta',
                type: 'errorbar',
                data: pairs,
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
