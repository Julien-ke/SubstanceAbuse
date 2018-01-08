/* global d3 */

/************ Code execution starts here************/

//Loading the geojson file, with draw() as a callback
d3.json('./USA/us-states.json', function (error, json) {
    
    //Loading our dataset
    d3.csv('MOD_Underlying Cause of Death, 1999-2015.csv', convertNumbers, function (error, _csv) {
    //| State | Year | Deaths | Population | Crude_rate | Drug_death | Alcohol_death | Other_death |
                
        var dataset = _csv,
            world = json.features;

        //Adding the .csv data to geojson
        world.forEach(function (w) {
            dataset.forEach(function (d) {
                if (w.properties.name === d.State) {
                    w.properties[String(d.Year)] = {'deaths': d.Deaths,
                                            'population': d.Population,
                                            'drug deaths': d.Drug_death,
                                            'alcohol deaths': d.Alcohol_death,
                                            'other deaths': d.Other_death};
                }
            });
        });
                
        //Definition of the size and the margins
        var margin = 60,
            width = 945 - margin,
            height = 550 - margin;
            
        //Creating an svg element
        var svg = d3.select('#content')
                    .append('svg')
                    .attr('width', width + margin)
                    .attr('height', height + margin)
                    .append('g')
                    .attr('class', 'map');
                
        //Setting up the projection (analogie avec la scale)
        var projection = d3.geo.albersUsa();
                               //.scale(550)
                               //.translate([width/2, height/2]);
            
        //Creating the svg object of the map (path of a polygone)
        var path = d3.geo.path()
                         .projection(projection); //Calling the projection method with the projection
                                                  //we want to use as an argument
        
        //Bind data to the map
        var map = svg.selectAll('path')
                     .data(world)
                     .enter()
                     .append('path')
                     .attr('d', path)
                     .attr('class', function (d) { return d.properties.name + "_state"; })
                     .style('fill', 'steelblue')
                     .style('stroke', 'black')
                     .style('stroke-width', 1)
                     .on('click', function (d) { click_state(d.properties); });
            
    }); //end of d3.csv()
}); //end of d3.json()
          


/************ Function definition starts here************/

var formatDate = d3.time.format("%Y");

// convert strings to numbers in CSV
function convertNumbers(row) {
  var r = {};
  for (var k in row) {
    r[k] = +row[k];
    if (isNaN(r[k])) {
        r[k] = row[k];
    }
  }
  return r;
}
            
//When we click on a state
function click_state(d) {
    d3.select('#map1 .panel-title').text(function () { return(d.name) });

    var date = Object.keys(d);
        date.splice(-1, 1);
    var data = Object.values(d);
        data.splice(-1, 1);

    //Creating an array suitable for our application
    data.forEach(function(d, i) {
        d.year = date[i];
    });
    //Get every metrics for a state
    var elements = Object.keys(data[0])
                         .filter(function(d){return (d != "year")});
    var selection = elements[0];

    // Set the dimensions of the canvas / graph
    var margin = {top: 80, right: 80, bottom: 80, left: 80},
        width = 1000 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
    
    //Setting the range, x axis is the date
    var x = d3.scale.linear()
                    .rangeRound([0,width])
                    .domain(d3.extent(date));

    var y = d3.scale.linear()
                    .range([height,0])
                    .domain([0, d3.max(data, function(d) {
                        return d[selection];
                    })]);
    
    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
                             .orient("bottom")
                             .tickFormat(d3.format("d"))
                             .ticks(6);

    var yAxis = d3.svg.axis().scale(y)
                             .orient("left")
                             .ticks(5);
    
    //Creating a selector button if don't exist
    var selector = null;
    if (!document.getElementById("dropdown")) {
         selector = d3.selectAll("#drop")
                      .append("select")
                      .attr("id","dropdown");
    } 
    
    selector = d3.selectAll("#dropdown")
    	         .on("change", function(d){
                                            selection = document.getElementById("dropdown").value;
                                            y.domain([0, d3.max(data, function(d){return +d[selection];})]);
                                            yAxis.scale(y);
                                               
                                            d3.select('.panel-body svg g path')
                                              .transition()
                                              .attr("d", valueline(data))
                                              .ease("linear")

                                            d3.selectAll("g.y_axis")
                                              .transition()
                                              .call(yAxis)
                                              .select(".y_legend")
                                              .text(selection);
                                               }
                        );
    
    selector.selectAll("option")
            .data(elements)
            .enter().append("option")
            .attr("value", function(d){return d;})
            .text(function(d){return d;})

    // Define the line
    var valueline = d3.svg.line()
                          .x(function(d) {return x(d['year'])})
                          .y(function(d) {return y(d[selection])});
    
    // Adds the svg, axis and path if don't exit
    var svg = null;
    if (!document.getElementById("linechart")) {
        svg = d3.select("#map1 .panel-body")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("id","linechart")
                .append('g')
                .attr("transform", 
                      "translate(" + margin.left + "," + margin.top + ")");
        
        svg.append("path")
           .attr("class", "line")
           .attr("d", valueline(data));
        
        svg.append("g")
           .attr("class", "x_axis")
           .attr("transform", "translate(0," + height + ")")
           .call(xAxis)
           .append("text")
           .attr("class", "x_legend")
           .attr("text-anchor", "middle")
           .attr("transform", "translate("+ (width/2) +","+70+")")
           .text("Date");
        
        svg.append("g")
           .attr("class", "y_axis")
           .call(yAxis)
           .append("text")
           .attr("class", "y_legend")
           .attr("text-anchor", "middle")
           .attr("transform", "translate("+ -25 +","+ -10 +")")
           .text(selection);
        
    } else { //Update svg
        selection = document.getElementById("dropdown").value;
        y.domain([0, d3.max(data, function(d){return +d[selection];})]);
        yAxis.scale(y);
    
        d3.select(".line")
          .transition()
          .attr("d", valueline(data));

        d3.select("g.y_axis")
          .transition()
          .call(yAxis);
    } 
}
