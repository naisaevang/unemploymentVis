var custom_bubble_chart = (function(d3, CustomTooltip) {
  "use strict";

  var width = 1100,
      height = 700,
      tooltip = CustomTooltip("gates_tooltip", 240),
      layout_gravity = 0,
      damper = 0.1,
      nodes = [],
      vis, force, circles, radius_scale;

  var center = {x: width / 2, y: height / 2};

  var year_centers = {
      "12-Oct": {x: width / 3.5 , y: height / 2},
      "13-Aug": {x: width / 2.5, y: height / 2},
      "13-Sep": {x: width / 1.8, y: height / 2},
      "13-Oct": {x: width / 1.4, y: height / 2}
    };
  var color_domain = [2, 4, 6, 7, 10];
  var color_range = ["#C2E699", "#78C679","#FDCC8A", "#FC8D59", "#D7301F"];
  var fill_color = d3.scale.quantize()
                  .domain(color_domain)
                  .range(color_range);

  function custom_chart(data) {
    var max_amount = d3.max(data, function(d) { return parseInt(d.labor_force, 10); } );
    radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 52]);

    //create node objects from original data
    //that will serve as the data behind each
    //bubble in the vis, then add each node
    //to nodes to be used later
    data.forEach(function(d){
      var node = {
        id: d.id,
        radius: radius_scale(parseInt(d.labor_force, 10)),
        value: d.labor_force,
        name: d.state,
        rate: d.rate,
        unemployed: d.unemployed,
        year: d.year_month,
        x: Math.random() * 1000,
        y: Math.random() * 1000
      };
      nodes.push(node);
    });

    nodes.sort(function(a, b) {return b.value- a.value; });

    vis = d3.select("#vis").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "svg_vis");

    circles = vis.selectAll("circle")
                 .data(nodes, function(d) { return d.id ;});

    circles.enter().append("circle")
      .attr("r", 0)
      .attr("fill", function(d) { return fill_color(d.rate) ;})
      .attr("stroke-width", 2)
      .attr("stroke", function(d) {return d3.rgb(fill_color(d.rate)).darker();})
      .attr("id", function(d) { return  "bubble_" + d.id; })
      .on("mouseover", function(d, i) {show_details(d, i, this);} )
      .on("mouseout", function(d, i) {hide_details(d, i, this);} );

    circles.transition().duration(2000).attr("r", function(d) { return d.radius; });

  }

  function charge(d) {
    return -Math.pow(d.radius, 2.0) / 7;
  }

  function start() {
    force = d3.layout.force()
            .nodes(nodes)
            .size([width, height]);
  }

  function display_group_all() {
    force.gravity(layout_gravity)
         .charge(charge)
         .friction(0.9)
         .on("tick", function(e) {
            circles.each(move_towards_center(e.alpha))
                   .attr("cx", function(d) {return d.x;})
                   .attr("cy", function(d) {return d.y;});
         });
    force.start();
    hide_years();
  }

  function move_towards_center(alpha) {
    return function(d) {
      d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
      d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
    };
  }

  function display_by_year() {
    force.gravity(layout_gravity)
         .charge(charge)
         .friction(0.9)
        .on("tick", function(e) {
          circles.each(move_towards_year(e.alpha))
                 .attr("cx", function(d) {return d.x;})
                 .attr("cy", function(d) {return d.y;});
        });
    force.start();
    display_years();
  }

  function move_towards_year(alpha) {
    return function(d) {
      var target = year_centers[d.year];
      d.x = d.x + (target.x - d.x) * (damper + 0.02) * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * (damper + 0.02) * alpha * 1.1;
    };
  }


  function display_years() {
      var years_x = {"12-Oct": 150, "13-Aug": width / 2.8, "13-Sep": width/1.7, "13-Oct": width/1.2};
      var years_data = d3.keys(years_x);
      var years = vis.selectAll(".years")
                 .data(years_data);

      years.enter().append("text")
                   .attr("class", "years")
                   .attr("x", function(d) { return years_x[d]; }  )
                   .attr("y", 40)
                   .attr("text-anchor", "middle")
                   .text(function(d) { return d;});

  }

  function hide_years() {
      var years = vis.selectAll(".years").remove();
  }


  function show_details(data, i, element) {
    d3.select(element).attr("stroke", "black");
    var content = "<span class=\"name\">State:</span><span class=\"value\"> " + data.name + "</span><br/>";
    content +="<span class=\"name\">Labor Force:</span><span class=\"value\"> " + addCommas(data.value) + "</span><br/>";
    content +="<span class=\"name\">Number of Unemployed:</span><span class=\"value\"> " + addCommas(data.unemployed) + "</span><br/>";
    content +="<span class=\"name\">Unemployment Rate:</span><span class=\"value\"> " + data.rate + "%</span><br/>";
    content +="<span class=\"name\">Date:</span><span class=\"value\"> " + data.year + "</span>";
    tooltip.showTooltip(content, d3.event);
  }

  function hide_details(data, i, element) {
    d3.select(element).attr("stroke", function(d) { return d3.rgb(fill_color(d.rate)).darker();} );
    tooltip.hideTooltip();
  }

  var my_mod = {};
  my_mod.init = function (_data) {
    custom_chart(_data);
    start();
  };

  my_mod.display_all = display_group_all;
  my_mod.display_year = display_by_year;
  my_mod.toggle_view = function(view_type) {
    if (view_type == 'year') {
      display_by_year();
    } else {
      display_group_all();
      }
    };

  return my_mod;
})(d3, CustomTooltip);