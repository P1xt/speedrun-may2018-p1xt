import React, { Component } from "react";
import { Card, CardBody } from "reactstrap";
import dataset from "./cyclist-data.json";
import * as d3 from "d3";
import d3Tip from "d3-tip";
import "./ScatterplotGraph.css";

class ScatterplotGraph extends Component {
  constructor() {
    super();
    this.state = {
      data: []
    };
  }

  /**
   * componentWillMount
   * Note, it's important to pull data in from json
   * file in componentWillMount so that it's available
   * on render
   * @return {void}@memberof ScatterplotGraph
   */
  componentWillMount() {
    this.setState({
      data: [...dataset]
    });
    console.log(dataset);
  }

  /**
   *componentDidMount
   * Note, it's important to build the chart
   * after componentWillMount run to ensure the
   * data is available. So, build the chart here
   * in componentDidMount
   * @return {void}@memberof ScatterplotGraph
   */
  componentDidMount() {
    this.buildGraph();
  }

  /**
   * responsiveChart
   * Turns the selected chart responsive
   *
   * Adapted from:
   * https://brendansudol.com/writing/responsive-d3
   * @memberof ScatterplotGraph
   */
  responsiveChart = svg => {
    const container = d3.select(svg.node().parentNode),
      width = parseInt(svg.style("width"), 10),
      height = parseInt(svg.style("height"), 10),
      aspect = width / height;

    const resize = () => {
      const targetWidth = parseInt(container.style("width"), 10);
      svg.attr("width", targetWidth);
      svg.attr("height", Math.round(targetWidth / aspect));
    };

    svg
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("perserveAspectRatio", "xMinYMid")
      .call(resize);

    d3.select(window).on("resize." + container.attr("id"), resize);
  };
  /**
   * buildGraph
   * builds a d3 graph
   * @return {void}@memberof ScatterplotGraph
   */
  buildGraph() {
    const dataset = this.state.data;
    const padding = 40;
    const margin = { top: 20, right: 20, bottom: 20, left: 60 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const formatMinutes = function(d) {
      const t = new Date(2012, 0, 1, 0, d);
      t.setSeconds(t.getSeconds() + d);
      return d3.timeFormat("%H:%M")(t);
    };
    const tip = d3Tip()
      .attr("class", "ScatterplotGraph_d3-tip")
      .offset([-10, 0])
      .html(function(d) {
        return (
          d.Name +
          ", " +
          d.Nationality +
          "<br>Year: " +
          d.Year +
          "&nbsp;&nbsp;Time: " +
          d.Time +
          "<br>" +
          d.Doping
        );
      });
    let max_place = 0;
    let min_place = 1;
    let max_seconds = 0;
    let min_seconds = 0;

    // the dataset doesn't have all the data pre-computed
    // derive what's missing
    for (let i = 0; i < dataset.length; i++) {
      if (dataset[i].Seconds > max_seconds) max_seconds = dataset[i].Seconds;
      if (dataset[i].Place > max_place) max_place = dataset[i].Place;
    }
    max_seconds = max_seconds - 190;
    dataset.forEach(f => {
      f.Behind = f.Seconds - max_seconds;
      f.Legend =
        f.Doping !== "" ? "Doping Allegations" : "No Doping Allegation";
    });

    // create the d3 object and attach it to the dom
    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(tip)
      .call(this.responsiveChart);

    // Add headers
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top)
      .attr("text-anchor", "middle")
      .attr("class", "graph heading")
      .text("Doping in Professional Bicycle Racing");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top + 30)
      .attr("text-anchor", "middle")
      .attr("class", "graph subheading")
      .text("35 Fastest times up Alpe d'Huez");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top + 50)
      .attr("text-anchor", "middle")
      .attr("class", "graph subsubheading")
      .text("Normalized to 13.8km distance");

    // Add x axis
    const xScale = d3
      .scaleLinear()
      .domain([max_seconds / 10 - 15, min_seconds])
      .range([margin.left, width]);

    svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat(formatMinutes)
      );

    svg
      .append("text")
      .attr(
        "transform",
        "translate(" +
          width / 2 +
          " ," +
          (height - margin.bottom + padding * 1.2) +
          ")"
      )
      .attr("class", "graph axis-label")
      .style("text-anchor", "middle")
      .text("Minutes Behind Fastest Time");

    // Add y axis
    const yScale = d3
      .scaleLinear()
      .domain([max_place, min_place])
      .range([height - padding, padding]);

    svg
      .append("g")
      .attr(
        "transform",
        "translate(" + margin.left + "," + (padding - margin.bottom) + ")"
      )
      .call(d3.axisLeft(yScale).ticks(6));

    svg
      .append("text")
      .attr("class", "graph axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x", -(height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Ranking");

    // Plot the points on the graph
    svg
      .selectAll("circle")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.Behind))
      .attr("cy", d => yScale(d.Place))
      .attr("r", 5)
      .attr("fill", d => (d.Doping === "" ? "#222222" : "#ff0000"))
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

    // Add the legend
    svg
      .append("rect")
      .attr("x", 3 * width / 4 - 16)
      .attr("y", height / 2 - 50)
      .attr("width", 200)
      .attr("height", 100);

    svg
      .append("text")
      .attr("x", 3 * width / 4 - 5)
      .attr("y", height / 2 - 25)
      .attr("text-anchor", "left")
      .attr("class", "legend legend-header")
      .text("Legend");

    svg
      .append("circle")
      .attr("cx", 3 * width / 4)
      .attr("cy", height / 2)
      .attr("r", 5)
      .attr("fill", "#222222");

    svg
      .append("text")
      .attr("x", 10 + 3 * width / 4)
      .attr("y", 5 + height / 2)
      .attr("text-anchor", "left")
      .attr("class", "legend")
      .text("No doping allegations");

    svg
      .append("circle")
      .attr("cx", 3 * width / 4)
      .attr("cy", padding / 2 + height / 2)
      .attr("r", 5)
      .attr("fill", "#ff0000");

    svg
      .append("text")
      .attr("x", 10 + 3 * width / 4)
      .attr("y", 5 + padding / 2 + height / 2)
      .attr("text-anchor", "left")
      .attr("class", "legend")
      .text("Doping allegations");
  }

  /**
   * render
   * Renders the ScatterplotGraph component
   * @return
   * @memberof ScatterplotGraph
   */
  render() {
    return (
      <div className="ScatterplotGraph">
        <div className="wrapper">
          <Card>
            <CardBody>
              <div id="chart" />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }
}

export default ScatterplotGraph;
