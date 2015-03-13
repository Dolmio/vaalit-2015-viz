"use strict";
var R = require('ramda');
var questions = require("./data/questions.json").questions;
var currentQuestion;
var hsData = require("./data/HS-05-03-2015.csv");
var ageData = R.omit(["NULL"],groupBy("age")(hsData));

var dataSource = {
    district: R.omit(["default"], groupBy("district")(hsData)),
    party: R.omit(["Mika Vähäkangas", "Kristiina Kreisler"], groupBy("party")(hsData)),
    gender: R.omit(["NULL"], groupBy("gender")(hsData)),
    age: aggregateAgeDataToIntervals(ageData, 5)
};

document.addEventListener('DOMContentLoaded', function () {
    init();
});

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
    var res = resultsByQuestion(questionNumber, selectedData);
    generateChart(R.values(res), R.keys(res));

}

function formatXScale(value) {
    switch(value) {
        case  1: return "Täysin eri mieltä";
        case  3: return "En osaa sanoa";
        case  5: return "Täysin samaa mieltä";
        default: return "";
    }
}

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

function partition(array, n) {
    return array.length ? [array.splice(0, n)].concat(partition(array, n)) : [];
}

function aggregateAgeDataToIntervals(data, interval) {
    var ageRanges = partition(R.keys(data), interval);

    var newAgeKeys = R.map(function(range) {
        return R.head(range) + "-" + R.last(range);
    }, ageRanges);
    var combinedAgeDataValues = R.map(function(ageRange){
        return R.reduce(function(res, age) {
            return R.concat(res, data[age]);
        },[], ageRange);
    }, ageRanges);

    return R.zipObj(newAgeKeys, combinedAgeDataValues);

}

function addHistogram(svg, results, width, height, domain, imposeMax, color){

    var resolution=5;
    var data = d3.layout.histogram().bins(resolution)(results);

    var y = d3.scale.linear()
        .range([0, height])
        .domain([0, Math.max(imposeMax, d3.max(data, function(d) { return d.y; }))]);

    var x = d3.scale.linear()
        .range([0, width])
        .domain(domain);

    var topHistogram = svg.append("g");

    var bottomHistogram = svg.append("g");

    generateHistogram(topHistogram);
    generateHistogram(bottomHistogram);

    function generateHistogram(svgObject) {
        var bar = svgObject.selectAll(".bar").data(data).enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + (x(d.x)) + "," + height / 2 + ")"; });

        bar.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width / resolution)
            .attr("height", function(d) {return  y(d.y) / 2})
            .attr("fill", color);
    }
    topHistogram.attr("transform", "translate(0, "+ height + ") scale(1,-1)");

}
function addMean(svg, results, width, height, domain, boxColor, boxInsideColor){

    var x = d3.scale.linear()
        .range([0, width])
        .domain(domain);

    var outerCircleRadius =  0.1 * height;
    var innerCircleRatio = 0.8;
    svg.append("circle")
        .attr("class", "mean")
        .attr("cx", x(d3.mean(results)))
        .attr("cy", height / 2)
        .attr("r", outerCircleRadius)
        .style("fill", boxColor)
        .style("stroke", 'None');

    svg.append("circle")
        .attr("class", "mean")
        .attr("cx", x(d3.mean(results)))
        .attr("cy", height / 2)
        .attr("r", innerCircleRatio * outerCircleRadius)
        .style("fill", boxInsideColor)
        .style("stroke", 'None');


}

function generateChart(groupedData, categories) {
    var margin={top:10, bottom:30, left:90, right:50};

    var width=330;
    var categoryHeight=30;
    var categorySpacing=5;
    var chartHeight = categoryHeight * categories.length + categorySpacing * categories.length;
    var totalHeight = chartHeight + margin.bottom  + margin.top;

    var domain=[0.5, 5.5];

    var d3ObjId="chart";
    $("#" + d3ObjId).empty();

    var x = d3.scale.linear()
        .range([margin.left, width-margin.right])
        .domain(domain);

    var y = d3.scale.ordinal()
        .domain(categories)
        .rangeBands([0, chartHeight]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(categories.length)
        .outerTickSize(0)
        .orient("left");
    var xAxis = d3.svg.axis()
        .scale(x)
        .tickValues([1,3,5])
        .outerTickSize(0)
        .tickFormat(formatXScale)
        .orient("bottom");


    var svg = d3.select("#"+d3ObjId)
        .append("svg")
        .attr("width", width)
        .attr("height", totalHeight);

    var dataDomain = [1,5];
    var chartingAreaWidth = width - margin.left - margin.right;

    for(var i=0; i<groupedData.length; i++){
        groupedData[i]=groupedData[i].sort(d3.ascending);
        var g=svg.append("g").attr("transform", "translate(" + margin.left + "," + (i*(categoryHeight+categorySpacing))+ ")");
        addHistogram(g, groupedData[i], chartingAreaWidth, categoryHeight, dataDomain, categoryHeight/2, "#cccccc");
        addMean(g, groupedData[i], chartingAreaWidth, categoryHeight, domain, "black", "#5BC0DE");

    }

    svg.append("g")
        .attr('class', 'axis x')
        .attr("transform", "translate("+0+"," + (totalHeight - margin.bottom) + ")")
        .call(xAxis);

    svg.append("g")
        .attr('class', 'axis y')
        .attr("transform", "translate("+margin.left+",0)")
        .call(yAxis);
}
