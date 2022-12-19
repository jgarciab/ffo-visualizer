import * as d3 from "d3";
import { FlowMode } from "./util";

const linkColor = (links) => {
  let linkTypes = [...new Set(links.map((d) => d.type))];
  const scale = d3
    .scaleOrdinal()
    .range(linkTypes.length === 1 ? ["#ff9100"] : d3.schemeCategory10);
  return (d) => scale(d.type);
};

// const nodeColor = (nodes) => {
//   let nodeTypes = [...new Set(nodes.map((d) => d.type))];
//   const scale = d3
//     .scaleOrdinal()
//     .range(nodeTypes.length === 1 ? ["#616161"] : d3.schemeCategory10);
//   return (d) => scale(d.type);
// };

const avoidLinkOverlaps = (links) => {
  // handle overlapping links
  links.forEach((link) => {
    // for each link,
    // find other links with same target+source or source+target
    var overlaps = links.filter(
      (l) =>
        (l.source === link.source && l.target === link.target) ||
        (l.source === link.target && l.target === link.source)
    );

    overlaps.forEach((s, i) => {
      let sameIndex = i + 1,
        sameTotal = overlaps.length,
        sameTotalHalf = sameTotal / 2,
        sameUneven = sameTotal % 2 !== 0,
        sameLowerHalf = sameIndex <= sameTotalHalf,
        sameLinkDirection =
          s.source === link.source && s.target === link.target;

      // console.log('(sameIndex - Math.ceil(sameTotalHalf)',(sameIndex - Math.ceil(sameTotalHalf)), sameTotal, sameIndex);
      s.route = {
        sameIndex,
        sameTotal,
        sameTotalHalf,
        sameUneven,
        sameLowerHalf,
        sameLinkDirection,
        sameMiddleLink:
          sameUneven === true && Math.ceil(sameTotalHalf) === sameIndex,
        sameArcDirection: sameLowerHalf
          ? sameLinkDirection
            ? 0
            : 1
          : sameLinkDirection
          ? 1
          : 0,
        sameIndexCorrected: sameLowerHalf
          ? sameIndex
          : sameIndex - Math.ceil(sameTotalHalf)
      };
    });
  });

  // maxnimum number of overlaps
  // const maxSameObj = links.reduce((prev, current) => {
  //   return current.sameTotal > prev.sameTotal ? current : prev;
  // });
  //const maxSame = maxSameObj.sameTotal;
  let routes = {};
  links.forEach((d, i) => {
    d.route.maxSameHalf = 0.8; //Math.floor(maxSame / 3);
    routes[i] = d.route;
  });

  return routes;
};

const linkArc = (d, s, t) => {
  let [sx, sy] = s;
  let [tx, ty] = t;
  var dx = tx - sx,
    dy = ty - sy,
    dr = Math.sqrt(dx * dx + dy * dy),
    unevenCorrection = d.sameUneven ? 0 : 0.5,
    //arc = ((0.8 - Math.random()/3)  * dr) / (d.sameIndexCorrected - unevenCorrection);
    arc = (d.maxSameHalf * dr) / (d.sameIndexCorrected - unevenCorrection);
  if (d.sameMiddleLink) {
    return `M${sx},${sy}L${(sx + tx) / 2},${(sy + ty) / 2} ${tx},${ty}`;
  } else {
    return `M${sx},${sy}A${arc},${arc} 0 0,${d.sameArcDirection} ${tx},${ty}`;
  }
};


const visualizeLinks = (data, projection, svg, locMap, toolTipHandler, flowMode) => {
  const logScale = d3.scaleSymlog().domain([data.minLinkWeight, data.maxLinkWeight]).range([1.0, 4.0]);
  const links = data.links;
  const nodes = data.nodes; // Array of country codes
  const totals = data.totals;
  const routes = avoidLinkOverlaps(links);
  const strokeColor = linkColor(links);
  const focusColumn = flowMode === FlowMode.Outflow ? 'source': 'target';

  const link = svg
    .append("g")
    .selectAll(".link")
    .data(links)
    .join("g")
    .attr("class", "link")
    .attr("opacity", 0.7)
    .attr("stroke", strokeColor)
    .attr("fill", strokeColor); // for the marker-end

  const defs = link
    .selectAll("defs")
    .data((d) => [d])
    .join("defs");

  defs
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
      linkArc(
        routes[i],
        projection(locMap[d.source]),
        projection(locMap[d.target])
      )
    );

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
      .attr("opacity", "0.5")
      .attr("stroke", strokeColor)
      .attr("fill", strokeColor);
  });

  const node = svg
    .append("g")
    .selectAll(".node")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => {
      return `translate(${projection(locMap[d])[0]},${
        projection(locMap[d])[1]
      })`;
    });

  node
    .selectAll("circle")
    .data((d) => [d])
    .join("circle")
    .attr("stroke", "black")
    .attr("r", 3)
    .attr("stroke-width", 1)
    .attr("fill", "white")
    .on("mouseover", (event, countryCode) => {
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
        .attr("opacity", 0.5);
    });

  // node
  //   .selectAll("text")
  //   .data((d) => [d])
  //   .join("text")
  //   .append("title")
  //   .text(function (d) {
  //     return d.id;
  //   });

  // Function that update circle position if something change
  // function update() {
  //   node.attr(
  //     "transform",
  //     (d) =>
  //       `translate(${projection(locMap[d.id])[0]},${
  //         projection(locMap[d.id])[1]
  //       })`
  //   );

  //   // link.selectAll('.link-path')
  //   //      .attr('d', (d,i)=>linkArc(routes[i],
  //   //                             projection(locMap[d.source]),
  //   //                             projection(locMap[d.target])));
  // }
};

export { visualizeLinks };
