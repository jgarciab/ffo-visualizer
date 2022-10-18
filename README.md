[![Build & deploy to github pages](https://github.com/States-as-fossil-fuel-owners/ffo-visualizer/actions/workflows/main.yml/badge.svg)](https://github.com/States-as-fossil-fuel-owners/ffo-visualizer/actions/workflows/main.yml)

# Geoflow Visualizer

Visualizes any type of flow between countries. Takes a CSV as input, applies filtering and aggregation (danfojs) to show relations and data in a number of visualizations (d3.js)

# Demo

The latest version of this tool is available at [https://states-as-fossil-fuel-owners.github.io/ffo-visualizer/](https://states-as-fossil-fuel-owners.github.io/ffo-visualizer/)

## Requirements

Nodejs + npm

## Installation

`npm install`

## Run

`npm start`

## Usage

Use the file selector to select a CSV file that at least has the columns `source`, `target` and `weight`.

## Development

The CSV data is loaded and processed with danfojs, the javascript implementation of pandas. Processing includes filtering, grouping and aggregating.

Visualization is done purely in d3.js. 

### Maps, countries, projections
The world map is a topojson file: [world_countries_neocarto.json](src/data/world_countries_neocarto.json). Currently, only the geometries are used (to display the map), the other properties are ignored.

The capital of each country is used as its location (the node the arrows point to/from). Country capital positions are linked to the topojson (and the data) with their ISO-2 country codes. This data is in [country-capitals.json](src/data/country-capitals.json). This is also where the country names (labels) are from.

The current map projection is [geoAitoff](https://github.com/d3/d3-geo-projection#geoAitoff) and is set in the GeoFlowVis component.
