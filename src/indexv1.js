//Imports
import AppHelper from './AppHelper.js';
//import {AppData} from './AppData.js';
var d3 = require("d3v4")
var _ = require("underscore")
var appHelper = new AppHelper()
//SASS Import to DOM at runtime
require('./styles/index.scss');

var currentTime = "10:01"
var activityDict = {0:"Work",1:"Study",2:"Sleep",3:"Eat",4:"Leisure/Transport"}
var padding = 4
var clusterPadding = 20
var maxRadius = 4
var n = 100 // total number of nodes
var m = 5 // number of distinct clusters
var z = d3.scaleOrdinal(d3.schemeCategory20)
function createChart(data){

  let nodes = data.map((r) => {
    return {cluster: r[currentTime],r:4}
  })


  var width = appHelper.getWidth()
  var height = appHelper.getHeight()*0.9

  let svg = d3.select('#App')
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

let circles = svg.append('g')
      .datum(nodes)
    .selectAll('.circle')
      .data(d => d)
    .enter().append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => z(d.cluster))
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

    console.log(nodes);
    let nestedData = d3.nest()
                        .key((r) => {return r[currentTime]} )
                        .entries(data)
    console.log(nestedData);
    var clusters = new Array()





    nodes.forEach((d) => {
      clusters[d.cluster] = d;
    })


    let simulation = d3.forceSimulation(nodes)
              .velocityDecay(0.2)
              .force("x", d3.forceX().strength(.0005))
              .force("y", d3.forceY().strength(.0005))
              .force("collide", collide)
              .force("cluster", clustering)
              .on("tick", ticked);

  function ticked() {
  circles
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);
          }

  function clustering(alpha) {
    nodes.forEach(function(d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.r + cluster.r;
      if (l !== r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    });
}

function collide(alpha) {
  var quadtree = d3.quadtree()
      .x((d) => d.x)
      .y((d) => d.y)
      .addAll(nodes);

  nodes.forEach(function(d) {
    var r = d.r + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {

      if (quad.data && (quad.data !== d)) {
        var x = d.x - quad.data.x,
            y = d.y - quad.data.y,
            l = Math.sqrt(x * x + y * y),
            r = d.r + quad.data.r + (d.cluster === quad.data.cluster ? padding : clusterPadding);
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.data.x += x;
          quad.data.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  });
}

}
d3.queue()
  .defer(d3.csv, `./src/activity_data.csv`)
  .await(function(error,data){
     createChart(data);
  })
