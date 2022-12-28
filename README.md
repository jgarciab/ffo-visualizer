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

In short, the application uses the React as the main framework, [Danfo.js](https://danfo.jsdata.org/) for data processing and filtering, and [d3.js](https://d3js.org/) for visualization of the map and charts. Below is a more detailed overview of what can be found where.

### Application
The main GUI is specified in `App`, which connects all the components to the data that is managed in the `DataStore` class (below).

### Loading and filtering the data

The `DataStore` class is where all the loading and filtering happens. It largely relies on [Danfo.js](https://danfo.jsdata.org/) (a pandas clone for javascript) for this. The class a [mobx](https://mobx.js.org/) observable, meaning that its computed properties can be observed in a component and it will re-render in a transparent way if the computed properties' inputs change.

Loading and filtering the data happens in several steps and only the required steps will execute if the inputs (such as the category selection) change. The steps are roughly as follows:

* Load data - does some basic cleaning and filtering and splits the data into links to self and links to others.
* Filtered data - applies the filters for sources, targets and other columns.
* Aggregate per link - for showing on the network map
* Aggregate per node (source/target) - for showing in the bar chart
* Aggregate per year - for showing the time series.
* Convert to nodes and links - converts to objects to be visualized in d3.js.
* In addition there are some properties for row / link counts, used locations and categories.

### Maps, countries, projections

The map and country data is loaded in the `GeoData` module. It is currently 'hard coded', i.e. cannot be specified by the user.

The world map is a topojson file: [world_countries_neocarto.json](src/data/world_countries_neocarto.json). The geometries are used to display the map and they are linked to the visualization by their ISO-2 country codes. The other properties are ignored.

The capital of each country is used as its location (the node the arrows point to/from). Country capital positions are linked to the user data by their ISO-2 country codes. The capital data is in [country-capitals.json](src/data/country-capitals.json). This is also where the country names (labels) are from.

The current map projection is [geoAitoff](https://github.com/d3/d3-geo-projection#geoAitoff) and is set in the `components/mappings` module.

### Styling and colors of visualization

Some semi-constant data, such as color maps, projections and number formatting functions are defined in the `components/mappings` module.

The visualization of the map and its links are defined in `components/LinkVis`. Properties that are not defined in the `mappings` module can be customized there.
