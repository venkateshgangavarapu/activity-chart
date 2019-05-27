//Imports
//Helper module to get the basic imputs ;like screen size etc
import AppHelper from './AppHelper.js';
var appHelper = new AppHelper()
//import {AppData} from './AppData.js';

//importig external modules required
var d3 = require("d3v4")
var _ = require("underscore")

//SASS Import to DOM at runtime
require('./styles/index.scss');

//Intializing required variables
var currentIndex = 239
var currentText
var currentTime
var activityDict = {0:"Work",1:"Study",2:"Sleep",3:"Eat",4:"Leisure/Transport"}
var pieData = [1,1,1,1,1]
var clusters = ["0","1","2","3","4"]
var colorDict = ['#6771dc','#a367dc','#dc67ce','#dc6788','#dc8c67','#dcd267']
var clusterData = {'name':'root',children:[
  {name:'cluster0',value:100},
  {name:'cluster1',value:100},
    {name:'cluster2',value:100},
      {name:'cluster3',value:100},
        {name:'cluster4',value:100}
]}

//comments data, embdedded manually based on the insights from the data
var comments = {
    "04:00": "People started waking up by 4:00AM. Most of them are beginning their day with breakfast and starting to Leisure",
    "06:00": "Everyone is out of the bed by 6:00AM. Unlike early raisers majority of the people are still in relax mode, maybe with their Morning Coffe!!",
    "08:00": "By 8:00AM, people started to finish up their breakfast and move to work.",
    "10:00": "The day is full on with most of people involving in either study or work.",
    "12:00": "People are shifting between work/study and lunch",
    "14:00": "Back on to work after finishing the lunch and the productive hours are on!!",
    "16:00": "After the work, people started their commute to home and relax a bit",
    "19:00": "Dinner time!!Majority of them are again into the Leisure mode before the bed",
    "22:00": "Slowly people started going to bed with all of them being asleep by 00:45",
    "01:00": "Everyone is asleep and the night is peaceful!!"
}

//initializing raw data variable, for the embdedded data uncomment the later part in the line
var rawData //= AppData
var displayCounter
//getting the size of the screen
var width = appHelper.getWidth()
var height = appHelper.getHeight()*0.9


//creating the html layout based on the elements required for the specific tasks
var mainCont =d3.select("#App")
              .append("div")
              .attr("class","main-cont")

var sideBar = mainCont.append("div")
                      .attr("class","side-bar")

var timeCont = sideBar.append("div")
                        .attr("class","time-cont")
                        .append("p")
                        .style("filter", "url(#glow1)")
var commentCont = sideBar.append("div")
                        .attr("class","comment-cont")
                        .append("p")

var chartCont = mainCont.append("div")
                          .attr("class","chart-cont")


//getting the width of the container created for the chart
var width = chartCont.node().offsetWidth
var height = chartCont.node().offsetHeight*0.9

//calculating radius for the circular layout based on the container dimensions
var pieRadius = d3.min([width/2,height*0.75/2])

//appending the svg element, entire visual will be appended to this elemtent
var svg = chartCont.append("svg")
                    .attr("width",width)
                    .attr("height",height)
                    .style("margin-top","30px")

//Glow defs creation, they provide shading effect to the elements. Dont worry, they are really neccessary for providing the aesthetic feel
//Thanks to nadieh tutorials for this, they make the chart look awesome. Two defs are created based on the requirement
var defs = svg.append("defs");
var filter = defs.append("filter")
    .attr("id","glow");
filter.append("feGaussianBlur")
    .attr("stdDeviation","2.5")
    .attr("result","coloredBlur");
var feMerge = filter.append("feMerge");
feMerge.append("feMergeNode")
    .attr("in","coloredBlur");
feMerge.append("feMergeNode")
    .attr("in","SourceGraphic");

var filter1 = defs.append("filter")
    .attr("id","glow1");
filter1.append("feGaussianBlur")
    .attr("stdDeviation","1.5")
    .attr("result","coloredBlur");
var feMerge1 = filter1.append("feMerge");
feMerge1.append("feMergeNode")
    .attr("in","coloredBlur");
feMerge1.append("feMergeNode")
    .attr("in","SourceGraphic");

//adding the text group, all the labels will be appended to this group
let textGroup =svg.append("g").append("text")
                        .attr("x",100)
                        .attr("y",100)
// This group is created for the smaller circles.
let innerGroup = svg.append("g")
                      .attr("transform",`translate(${width/2},${height/2})`)
                      .style("filter", "url(#glow)")

//Group for bounding circles of each category
var outerCircles = svg.append("g")
                          .style("filter", "url(#glow)")
                      .attr("transform",`translate(${width/2},${height/2})`)


//Group for bounding circles of each category
var outCircleG = outerCircles.append("g")
                          .style("filter", "url(#glow)")

//path for the label text. Horizontal text is too mainstream and takes up too much space. Labels around the bounding circles will look far better
var textArc = d3.arc()
                .innerRadius(pieRadius/4+5)
                .outerRadius(pieRadius/4+20)
                .startAngle(Math.PI/8)
                .endAngle(Math.PI)

var textPath = svg.append("defs").append("path")
                	.attr("id", "textPath")
                	.attr("d", textArc)

//path for the percentage label text, it is better to seperate both the label texts as this one requires a continous update
var textArcLabel = d3.arc()
                .innerRadius(pieRadius/4+5)
                .outerRadius(pieRadius/4+20)
                .startAngle(-Math.PI/10)
                .endAngle(Math.PI/10)

var textPathLabel = svg.append("defs").append("path")
                	.attr("id", "textPathLabel")
                	.attr("d", textArcLabel)


// This function reads in the rawdata and formats it as per the visual requirements. Then creates the elements required and updates the positions as and when required
function intializeChart(){

  //Updating the text elements for time and insights based on the current value
  currentText = comments[currentTime]!=undefined?comments[currentTime]:currentText
  //counter to hide text after 60secs
  displayCounter = comments[currentTime]!=undefined?0:displayCounter+1
  timeCont.html(currentTime)
  //after 60 secs of display the text element will be hidden
  if(displayCounter < 60){
      commentCont.style("opacity",1).text(currentText)
  }
  else{
    commentCont.transition().duration(300).style("opacity",0)
  }
  //reformatting the rawdata to create the keys required
  let nodes = rawData.map((r) => {
    return {name:r.name,cluster: r[currentTime],value:1,color:colorDict[r[currentTime]],acitivity:activityDict[r[currentTime]]}
  })

  //created a nested data at the cluster level
  var nestedData = d3.nest()
                      .key((d) => {return d['cluster']})
                      .entries(nodes)

  //formatting again to get the data in the best format possible. Dont try to optimize it, will kill lots of your time
  var formattedData = clusters.map((g) => {
    let cGroup = nestedData.filter((cg) => {
      return cg.key == g
    })
    let group = cGroup.length?cGroup[0]['values']:[]
    return {'name': "cluster"+g,'children': group,value:100,color:colorDict[g],acitivity:activityDict[g]}
  })

  //Dividing the layout into equal partitions, use the pie function available with eaual values
  var arcs = d3.pie()
                .value((d) => {return d.value})
                (formattedData)

  //finding the mid point of each arc and converting the polar coordinates into cartesian system
  arcs.map((a) => {
    var mid = (a.startAngle+a.endAngle)/2+Math.PI/2
    a.x =  pieRadius*Math.cos(mid)
    a.y =  pieRadius*Math.sin(mid)
    a.tx =  0.5*(pieRadius)*Math.cos(mid)
    a.ty =  0.5*(pieRadius)*Math.sin(mid)
    a.r = pieRadius/4
  })


  //using the pie values generating the bounding circles around the cluster
  outCircleG.selectAll("circle")
  .data(arcs).enter()
  .append("circle")
  .attr("id",(d) => {return "id"+d.data.name})
  .attr("cx",(d) => {return d.x+pieRadius/4 -5 })
  .attr("cy",(d) => {return d.y+pieRadius/4 -5})
  .attr("r",pieRadius/4+10)
  .style("fill","none")
  .style("stroke",(d) => {return d.data.color})


//Appending text elemtents around the circles, the text path created earlier is used here
  outerCircles.selectAll("text")
  .data(arcs).enter()
  .append("text")
  .attr("class","labels")
  .attr("transform",(d) => {return `translate(${d.x+pieRadius/4-5},${d.y+pieRadius/4-5})`})
  .append("textPath")
  .attr("xlink:href","#textPath")
  .text((d) => {return `${d.data.acitivity}`})


//Appending text elemtents around the circles for the percentage values, the text path created earlier is used here
  outerCircles.selectAll(".data-labels")
  .data(arcs).enter()
  .append("text")
  .attr("class","data-labels")
  .attr("fill",(d) => {
    return d.data.color
  })
  .style("font-weight",800)
  .attr("transform",(d) => {return `translate(${d.x+pieRadius/4-5},${d.y+pieRadius/4-5})`})
  .append("textPath")
  .attr("xlink:href","#textPathLabel")
  .text((d) => {return ` (${d.data.children.length}%)`})

  //The nested data at the cluster data will be used to create circle packs at the respective positions or each cluster. All the innerCircles
  //are then added to one list to easily update the positions of the elements
  var nodeList = []
  arcs.forEach((g)=> {
    let cCluster = g.data.name
    let cSize = [2*g.r,2*g.r]

    let clusterGroup = formattedData.filter((f) => {
      return f.name == cCluster
    })[0]
    var cPack = data => d3.pack()
      .size(cSize)
      .padding(1)
      (d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value))
    nodeList = nodeList.concat(cPack(clusterGroup).leaves())
  })

  //removing unnecessary nodes
  let filteredNodeList = nodeList.filter((n) => {
    return n.data.name.indexOf("cluster") < 0
  })


  //updating the positions of the circles created in the start
  innerGroup.selectAll("circle")
            .data(filteredNodeList)
            .transition()

            .style("stroke","#f0f0f0")
            .style("stroke-width","1px")

            .attr("cx",(id) => {
            var cP = arcs.filter((c) => {
              return c.data.name == id.parent.data.name
            })[0]
            return cP.x+id.x-id.r
          })
          .attr("cy",(id) => {
            var cP = arcs.filter((c) => {
              return c.data.name == id.parent.data.name
            })[0]
            return cP.y+id.y-id.r})
          .attr("r", 5)
          .attr("fill",(d) => {
            return d.data.color
          })

    //updating data label values
    outerCircles.selectAll(".data-labels").selectAll("textPath").remove()
    outerCircles.selectAll(".data-labels")
            .append("textPath")
            .attr("xlink:href","#textPathLabel")
            .text((d) => {return `${d.data.children.length}%`})


}

//function to update the time based on the counter
function updateTime(){
  var timeList = Object.keys(rawData[0]).slice(1)
  currentIndex = currentIndex==timeList.length-1?0:currentIndex+1
  currentTime = timeList[currentIndex]
  intializeChart()
}
//function to loop through the counter
function loopTime(){
  setInterval(updateTime,100)
}
//reading data from csv and triggering the flow
d3.queue()
  .defer(d3.csv, `./src/activity_data.csv`)
  .await(function(error,data){
    console.log(data);
    rawData = data

  //inner circles are created based on the number of records in the data
    let innerCircles = innerGroup.selectAll("circle")
                                      .data(rawData).enter()
                                      .append("circle")

     loopTime()
    //updateTime()
  })
