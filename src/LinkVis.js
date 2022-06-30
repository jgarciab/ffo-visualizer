import * as d3 from "d3";

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


const visualizeLinks = (data, projection, svg, locMap, toolTipHandler) => {
  const logScale = d3.scaleLog().domain([data.minWeight, data.maxWeight]).range([0.2, 7.0]);
  console.log(data.minWeight, data.maxWeight);

  const links = data.links;
  const routes = avoidLinkOverlaps(links);

  const link = svg
    .append("g")
    .selectAll(".link")
    .data(links)
    .join("g")
    .attr("class", "link");

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
    .attr("refX", 4)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("markerUnits", "userSpaceOnUse")
    .attr("opacity", 1.0)
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", linkColor(links));

  defs
    .append("marker")
    .attr("id", (d) => `marker-shadow-${d.id}`)
    .attr("class", "marker")
    .attr("orient", "auto")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 4)
    .attr("refY", 0)
    .attr("markerWidth", 10)
    .attr("markerHeight", 10)
    .attr("markerUnits", "userSpaceOnUse")
    .attr("opacity", 1.0)
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#000");

  link
    .selectAll(".link-path-shadow")
    .data((d) => [d])
    .join("path")
    .attr("class", "link-path-shadow")
    .attr("fill", "none")
    .attr("stroke-width", (d) => logScale(d.weight) + 1)
    .attr("stroke", "#000")
    .attr("opacity", 0.7)
    .attr("marker-end", (d) =>
      d.directed === "yes" ? `url(#marker-shadow-${d.id})` : undefined
    )
    .attr("d", (d, i) =>
      linkArc(
        routes[i],
        projection(locMap[d.source]),
        projection(locMap[d.target])
      )
    );

  link
    .selectAll(".link-path")
    .data((d) => [d])
    .join("path")
    .attr("class", "link-path")
    .attr("fill", "none")
    .attr("stroke-width", (d) => logScale(d.weight))
    .attr("stroke", linkColor(links))
    .attr("opacity", 1.0)
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

    link.on("mouseover", toolTipHandler);
    link.on("mouseout", toolTipHandler);

  // link.append("title")
  //   .datum(d => d)
  //   .text(d => JSON.stringify(d));


  // const node = svg
  //   .append("g")
  //   .selectAll(".node")
  //   .data(nodes)
  //   .join("g")
  //   .attr("class", "node")
  //   .attr("transform", (d) => {
  //     return `translate(${projection(locMap[d.id])[0]},${
  //       projection(locMap[d.id])[1]
  //     })`;
  //   });

  // node
  //   .selectAll("circle")
  //   .data((d) => [d])
  //   .join("circle")
  //   .attr("stroke", nodeColor(nodes))
  //   .attr("r", 4)
  //   .attr("stroke-width", 2)
  //   .attr("fill", "white");

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
