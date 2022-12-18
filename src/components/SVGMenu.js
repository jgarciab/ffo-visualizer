import { Fragment } from "react";


const SVGMenu = ({refSVG}) => {

  const downloadBlob = (blob, filename) => {
    const element = document.createElement("a");
    element.download = filename;
    element.href = window.URL.createObjectURL(blob);
    element.click();
    element.remove();
  }

  const downloadAsSVG = () => {
    let svgSource = refSVG.current.outerHTML.toString();
    // Add name spaces and xml declaration
    if (!svgSource.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgSource = svgSource.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!svgSource.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      svgSource = svgSource.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    svgSource = '<?xml version="1.0" standalone="no"?>\r\n' + svgSource;
    const blob = new Blob([svgSource], {type:"image/svg+xml;charset=utf-8"});
    downloadBlob(blob, 'chart.svg');
  }

  const loadImage = src => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { resolve(img) };
      img.src = src;
    });
  }

  const downloadAsPNG = () => {
    const svg = refSVG.current;
    const canvas = document.createElement("canvas");

    // Double the resolution for smoothness
    canvas.width = 2 * svg.clientWidth;
    canvas.height = 2 * svg.clientHeight;

    // Slightly hacky method to determine if we should scale the svg (2x)
    // (which is the case when width/height is in pixels)
    // OR whether the svg will scale itself when it is drawn (width/height in %)
    const scaleFactor = svg.style["width"].endsWith("%") ? 1 : 2;

    // SVG to data url in img element
    const xml = new XMLSerializer().serializeToString(svg);
    loadImage(`data:image/svg+xml;base64,${btoa(xml)}`)
      .then(img => {
        // Draw the image onto canvas
        const context = canvas.getContext('2d');
        context.scale(scaleFactor, scaleFactor);
        context.fillStyle = 'white';  // fill, or bg would be transparent
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
  
        // Download
        canvas.toBlob(blob => {
          downloadBlob(blob, 'chart.png');
          img.remove();
          canvas.remove();
        }, 'image/png');
      });
  }

  return (<Fragment>
    <div className="dropdown dropdown-end" style={{position: 'absolute', top: 8, right: 8}}>
      <label tabIndex={0} className="btn btn-circle btn-outline btn-sm text-sm opacity-20 hover:opacity-100">
      <svg style={{width: 12, height: 12}} viewBox="0 0 16 16" fill="currentColor" stroke="none" 
          strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle r="2" cy="8" cx="2"></circle>
        <circle r="2" cy="8" cx="8"></circle>
        <circle r="2" cy="8" cx="14"></circle>
      </svg>
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
        <li><button onClick={downloadAsPNG}>Download as PNG</button></li>
        <li><button onClick={downloadAsSVG}>Download as SVG</button></li>
      </ul>
    </div>
  </Fragment>);
}

export default SVGMenu;
