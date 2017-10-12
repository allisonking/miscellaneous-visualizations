function SlopeGraph(options) {
  var svg = d3.select(options.container),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  var margin = {top: 15, right: 50, bottom: 0, left: 100};

  var xScale = d3.scaleBand().rangeRound([0, width-margin.right]).padding(0.1),
      miniScaler = d3.scaleLinear();

  var focus = svg.append('g')
                 .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // function to convert input data from strings to floats
  var dataConverter = function(d) {
    var dataKeys = d3.keys(d);
    var row = {};
    options.header.forEach(function(label, i) {
      if (i!=0) {
        // round decimals. this will leave one decimal place. change here if more are needed
        row[label]= Math.round(+d[dataKeys[i]] * 10) / 10;
      } else {
        row[label] = d[dataKeys[i]];
      }
    })
    return row;
  }

  var data;
  d3.csv(options.data, dataConverter, function(input_data) {
    data = input_data;

    // write out the header with xScale
    var headers = d3.keys(data[0]);
    xScale.domain(options.header);
    focus.selectAll('.table-header')
         .data(headers)
         .enter()
         .append('text')
         .attr('text-anchor', 'middle')
         .attr('class', 'table-header')
         .attr('x', function(d) { return xScale(d)})
         .text(function(d) { return d});

    // y value to start with
    var startHeight = 30;
    // padding between rows (15 seems to be about text size)
    var textSize = 15;
    var padding = 5;
    // mini scale for within each row
    miniScaler.range([0,height/data.length]);
    miniScaler.domain([0,getMaxSpread(data)])

    // transform the data into something more usable for the table
    var lineData = [];
    data.forEach(function(d) {
      var entries = d3.entries(d);
      entries.forEach(function(entry) {
        entry['first'] = getFirstColumnValue(d);
        entry['max'] = getMaxValue(d);
      })
      lineData.push(entries);
    })

    // create a g for each row, transformed down based on max value
    var rows = focus.selectAll('.table-row')
                    .data(data)
                    .enter()
                    .append('g')
                    .attr('class', 'table-row')
                    .attr('transform', function(d) {
                      var spread = getSpread(d);
                      var transform = 'translate(0, ' + startHeight + ')';
                      startHeight = startHeight + textSize + miniScaler(spread);
                      return transform;
                    })

    // add the line
    var lines = rows.append('path')
                    .datum(function(d, i) {
                      // cuts out the key- that part won't be in the line
                      return lineData[i].slice(1,lineData[i].length);
                    })
                    .attr('class', 'link')
                    .attr('d', line)
                    .attr('stroke', 'blue')
                    .attr('stroke-width', 2)
                    .attr('fill','none');

    // add a group to store the text as well as a background rect
    var datums = rows.selectAll('.datum')
                         .data(function(d, i) {
                           return lineData[i]
                         })
                         .enter().append('g')
                         .attr('class', 'datum');

    // add the background rect
    var rectWidth = 40; // seems like a good amount for 3 numbers (e.g. 12.3)
    var rectBackgrounds = datums.append('rect')
                                .attr('class', 'label-background')
                                .attr('y', -textSize)
                                .attr('x', -rectWidth/2)
                                .attr('transform', transformDatum)
                                .attr('width', rectWidth)
                                .attr('height', textSize + padding);

    // add the text
    var textLabels = datums
                         .append('text')
                         .attr('class','datum-text')
                         .attr('text-anchor', 'middle')
                         .attr('transform', transformDatum)
                         .text(function(d) { return d.value});

  })

  // function to find where to transform each datum/rect to
  function transformDatum(d) {
    if (d.key == options.header[0]) {
      return 'translate(' + xScale(d.key) +',' + miniScaler(d.max - d.first)+')'
    }
    var y = d.max - d.value;
    return 'translate('+ xScale(d.key)+',' + (miniScaler(y)) +')';
  }

  // generates each slope line for each row
  var line = d3.line()
               .x(function(d) {
                 return xScale(d.key)+10;
               })
               .y(function(d) {
                 return miniScaler(d.max - d.value)-5;
               })
               .curve(d3.curveLinear);

  // below are helper functions to calculate max's and differences

  function getFirstColumnValue(d) {
    return d[options.header[1]];
  }

  function getMaxValue(d) {
    var keys = d3.keys(d);
    // remove the header
    keys.shift();
    var max = -100000000000;
    keys.forEach(function(key) {
      if (d[key] > max) {
        max = d[key];
      }
    })
    return max;
  }

  function getSpread(d) {
    var keys = d3.keys(d);
    var min = 10000000000;
    var max = -100000000000;
    keys.forEach(function(key) {
      if (d[key] > max) {
        max = d[key];
      }
      if (d[key] < min) {
        min = d[key];
      }
    })
    return max-min;
  }

  function getMaxSpread(d){
    var keys = d3.keys(d[0]);
    // remove the header
    keys.shift();
    var widestSpread = 0;
    d.forEach(function(item) {
      var itemSpread = getSpread(item);
      if (itemSpread > widestSpread) {
        widestSpread = itemSpread;
      }
    })
    return widestSpread;
  }
}
