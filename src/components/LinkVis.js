import * as d3 from "d3";
import { countryColor, curveFactor, FlowMode, linkColor, linkOpacity, projection } from "./mappings";


const visualizeGeoFlow = (svg, data, countryMap, locMap, flowMode, toolTipHandler, contextMenuHandler) => {

  // Clean up
  svg.selectAll(".link").remove();
  svg.selectAll(".node").remove();
  svg.select(".map").selectAll(".country").remove();

  visualizeMap(svg, data, countryMap, flowMode);
  if (data.links.length > 0) {
    visualizeLinks(svg, data, locMap, toolTipHandler);
  }
  if (data.nodes.length > 0) {
    visualizeNodes(svg, data, locMap, flowMode, toolTipHandler, contextMenuHandler);
  }
}

const visualizeMap = (svg, data, countryMap, flowMode) => {
  const geoPath = d3.geoPath(projection());
  const colorMap = countryColor(data.minTotalWeight, data.maxTotalWeight);

  // Render base map
  svg
    .select(".map")
    .selectAll(".country")
    .data(countryMap.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", geoPath)
    .attr("fill", function (d) {
      const total = data.totals.find(t => t.countryCode === d.properties.ISO2);
      d.weight = total ? (flowMode === FlowMode.Inflow ? total.weight_in : total.weight_out) : 0;
      if (isNaN(d.weight)) d.weight = 0;
      return colorMap(d.weight);
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.4);
}


const visualizeLinks = (svg, data, locMap, toolTipHandler) => {
  const logScale = d3.scaleSymlog().domain([data.minLinkWeight, data.maxLinkWeight]).range([1.0, 4.0]);
  const links = data.links;
  const strokeColor = linkColor(links);
  const proj = projection();

  // Links
  const link = svg
    .append("g")
    .selectAll(".link")
    .data(links)
    .join("g")
    .attr("class", "link")
    .attr("opacity", 0.7)
    .attr("stroke", strokeColor)
    .attr("fill", strokeColor); // for the marker-end

  // Arrow heads for links
  link
    .selectAll("defs")
    .data((d) => [d])
    .join("defs")
    .append("marker")
    .attr("id", (d) => `marker-${d.id}`)
    .attr("class", "marker")
    .attr("orient", "auto")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 12)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("markerUnits", "userSpaceOnUse")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")

  // Link lines
  link
    .selectAll(".link-path")
    .data((d) => [d])
    .join("path")
    .attr("id", d => d.id)
    .attr("class", "link-path")
    .attr("fill", "none")
    .attr("stroke-width", (d) => logScale(d.weight))
    .attr("marker-end", (d) =>
      d.directed === "yes" ? `url(#marker-${d.id})` : undefined
    )
    .attr("d", (d, i) =>
      linkArc(proj(locMap[d.source]), proj(locMap[d.target]))
    );

  // Link event handlers
  link.on("mouseover", (event, data) => {
    toolTipHandler(event, data);
    d3.select(event.target.parentNode) // select the group
      .attr("opacity", "1.0")
      .attr("stroke", "red")
      .attr("fill", "red"); // for marker-end
  });
  link.on("mouseout", (event, data) => {
    toolTipHandler(event, data);
    d3.select(event.target.parentNode)
      .attr("opacity", linkOpacity)
      .attr("stroke", strokeColor)
      .attr("fill", strokeColor);
  });
}

const visualizeNodes = (svg, data, locMap, flowMode, toolTipHandler, contextMenuHandler) => {
  const nodes = data.nodes; // Array of country codes
  const totals = data.totals;
  const focusColumn = flowMode === FlowMode.Outflow ? 'source': 'target';
  const strokeColor = linkColor(data.links);
  const proj = projection();

  const node = svg
    .append("g")
    .selectAll(".node")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => {
      return `translate(${proj(locMap[d])[0]},${
        proj(locMap[d])[1]
      })`;
    });

  // Node circles
  node
    .selectAll("circle")
    .data((d) => [d])
    .join("circle")
    .attr("stroke", "black")
    .attr("r", 3)
    .attr("stroke-width", 1)
    .attr("fill", "white");

  // Node event handlers
  node.on("mouseover", (event, countryCode) => {
      toolTipHandler(event, totals.find(el => el.countryCode === countryCode));
      // Highlight all links connected to this node
      const selection = d3.selectAll(".link"); // select the group element (not only the path)
      selection.filter(d => d[focusColumn] === countryCode)
        .attr("stroke", "red")
        .attr("fill", "red")
        .attr("opacity", 1.0);
      selection.filter(d => d[focusColumn] !== countryCode)
        .attr("stroke", "grey")
        .attr("fill", "grey")
        .attr("opacity", 0.1);
    })
    .on("mouseout", (event, countryCode) => {
      toolTipHandler(event, totals.find(el => el.countryCode === countryCode));
      d3.selectAll(".link")
        .attr("stroke", strokeColor)
        .attr("fill", strokeColor)
        .attr("opacity", linkOpacity);
    })
    .on("click", (event, countryCode) => {
      contextMenuHandler(event, countryCode);
    });

};

const linkArc = (s, t) => {
  const [sx, sy] = s;
  const [tx, ty] = t;
  const dx = tx - sx;
  const dy = ty - sy;
  const dr = curveFactor * Math.sqrt(dx * dx + dy * dy);
  return `M${sx},${sy}A${dr},${dr} 0 0 1 ${tx},${ty}`;
};

export { visualizeGeoFlow };
