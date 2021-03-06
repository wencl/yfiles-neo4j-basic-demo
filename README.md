# yfiles-neo4j-basic-demo
Shows how to use yFiles for HTML 2.2 and Neo4j in a web based single page app to visualize database contents.

This repository serves as a reference for a demo that can be used as a guideline for creating single page web application that render a visualization of [Neo4j](https://www.neo4j.com) database contents using the [yFiles for HTML JavaScript graph drawing library](https://www.yworks.com/yfileshtml). __You cannot run or test the demo without a yFiles for HTML library or without a Neo4j database just by cloning this repository. This repository is meant as a reference for the sources in [this posting](https://medium.com/neo4j/neo4j-graph-visualization-like-a-pro-18651963ebd4) and [the corresponding YouTube screencast](https://youtu.be/ABixtyDjcKc), only.__

The demo was scaffolded using the [yeoman generator for yFiles apps](https://www.npmjs.com/package/generator-yfiles-app) for yFiles for HTML 2.2 using the following settings: 

```
? Application name Neo_yFiles
? Path of yFiles for HTML package C:\Path\to\your\yFilesForHTMLPackage
? Path to license file (e.g. 'path/to/license.json') C:\Path\to\your\yFilesForHTMLPackage\lib\license.json
? Which kind of yFiles modules do you want to use? ES6 Modules
? Which language variant do you want to use? ES6
? What else do you want? Use yfiles-typeinfo.js Visual Studio Code
? Which package manager would you like to use? npm
```
See [this YouTube screencast](https://youtu.be/Pj0yd1iFp9g) on how to scaffold a yFiles for HTML powered application with yeoman.

In order to run this demo, you should first obtain a current version of yFiles for HTML from [here](https://www.yworks.com/products/yfiles-for-html/evaluate). Then run the yeoman generator and replace the contents of the contents of the scaffolded `app.js` file with the ones from this repository. For a generic introduction to yFiles for HTML see [this YouTube screencast](https://youtu.be/QITNGXNGM3w)
