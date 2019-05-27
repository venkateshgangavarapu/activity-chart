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
var clusters = ["0","1","2","3","4"]
var clusterData = {'name':'root',children:[
  {name:'cluster0',value:100},
  {name:'cluster1',value:100},
    {name:'cluster2',value:100},
      {name:'cluster3',value:100},
        {name:'cluster4',value:100}
]}
var padding = 4
var clusterPadding = 20
var maxRadius = 4
var n = 100 // total number of nodes
var m = 5 // number of distinct clusters
var z = d3.scaleOrdinal(d3.schemeCategory20)
function createChart(data){

  let nodes = data.map((r) => {
    return {name:r.name,cluster: r[currentTime],value:1}
  })
  var nestedData = d3.nest()
                      .key((d) => {return d['cluster']})
                      .entries(nodes)
  var formattedData = clusters.map((g) => {
    let cGroup = nestedData.filter((cg) => {
      return cg.key == g
    })
    let group = cGroup.length?cGroup[0]['values']:[]
    return {'name': "cluster"+g,'children': group,value:100}
  })


  var width = appHelper.getWidth()
  var height = appHelper.getHeight()*0.9

  var pack = data => d3.pack()
    .size([width, height])
    .padding(20)
    (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

  var rootData = pack(clusterData)
  var rChildren = rootData.leaves()
  console.log(rChildren);
  var svg =d3.select("#App")
              .append("svg")
              .attr("width",width)
              .attr("height",height)

  // var circles = svg.selectAll("circle")
  //                   .data(rootData.descendants()).enter()
  //                   .append("circle")
  //                   .attr("r",(d) => {return d.r})
  //                   .attr("cx",(d) => {return d.x})
  //                   .attr("cy",(d) => {return d.y})
  //                   .attr("fill","none")
  //                   .attr("stroke","black")
  var nodeList = []
  rootData.leaves().forEach((g)=> {
    let cCluster = g.data.name
    let cSize = [2*g.r,2*g.r]

    let clusterGroup = formattedData.filter((f) => {
      return f.name == cCluster
    })[0]
    var cPack = data => d3.pack()
      .size(cSize)
      .padding(5)
      (d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value))
      console.log(cPack(clusterGroup).leaves().length);
    nodeList = nodeList.concat(cPack(clusterGroup).leaves())
  })
  let filteredNodeList = nodeList.filter((n) => {
    return n.data.name.indexOf("cluster") < 0
  })

  let innerGroup = svg.append("g")

  let innerCircles = innerGroup.selectAll("circle")
                                .data(filteredNodeList).enter()
                                .append("circle")
                                .attr("cx",(id) => {
                                  var cP = rChildren.filter((c) => {
                                    console.log(c,id);
                                    return c.data.name == id.parent.data.name
                                  })[0]
                                  return cP.x+id.x-cP.r
                                })
                                .attr("cy",(id) => {
                                  var cP = rChildren.filter((c) => {
                                    console.log(c,id);
                                    return c.data.name == id.parent.data.name
                                  })[0]
                                  return cP.y+id.y-cP.r})
                                .attr("r", 4)
                                .attr("fill","none")
                                .attr("stroke","black")


}
d3.queue()
  .defer(d3.csv, `./src/activity_data.csv`)
  .await(function(error,data){
     createChart(data);
  })
