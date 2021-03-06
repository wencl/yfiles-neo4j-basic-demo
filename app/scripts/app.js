import {
  License,
  GraphComponent,
  Class,
  LayoutExecutor,
  GraphViewerInputMode,
  RadialLayout,
  RadialLayoutData,
  Size,
  Rect,
  GraphBuilder,
  ShapeNodeStyle,
  EdgePathLabelModel,
  PolylineEdgeStyle,
  INode,
  DefaultLabelStyle,
  GraphItemTypes,
  Reachability
} from 'yfiles'


// We need to make sure to load the yfiles/view-layout-bridge module to prevent the webpack
// tree shaker from removing this dependency which is needed for the 'morphLayout' call in this demo.
Class.ensure(LayoutExecutor)

// the official neo4j bolt driver
import neo4j from 'neo4j-driver/lib/browser/neo4j-web'

// Tell the library about the license contents
License.value = {
  /* put the license contents here - the yeoman generator does this automatically for you */
}

// setup the driver
const neo4jDriver = neo4j.driver(
  'bolt://1.2.3.4',
  neo4j.auth.basic('username', 'TheS3cr3t')
)

// hook up the graph control to the div in the page
const graphComponent = new GraphComponent('#graphComponent')

// make it interactive - we don't allow editing (creating new elements)
// but are generally interested in viewing, only
const inputMode = new GraphViewerInputMode()
graphComponent.inputMode = inputMode

// display a tooltip when the mouse hovers over an item
inputMode.addQueryItemToolTipListener((sender, args) => {
  // the neo4j data is stored in the "tag" property of the item
  // if it contains "properties" - show them in a simple HTML list
  if (args.item && args.item.tag && args.item.tag.properties) {
    // we can use a string, or set a HTML Element (e.g. when we do not trust the data)
    args.toolTip = `<ul>
        ${Object.entries(args.item.tag.properties)
          .map(e => '<li>' + e[0] + ' : ' + e[1] + '</li>')
          .join('')}
       </ul>`
  }
})

// when the user double-clicks on a node, we want to focus that node in the layout
inputMode.addItemDoubleClickedListener(async (sender, args) => {
  // clicks could also be on a label, edge, port, etc.
  if (INode.isInstance(args.item)) {
    // tell the engine that we don't want the default action for double-clicks to happen
    args.handled = true
    // we configure the layout data
    const layoutData = new RadialLayoutData()
    // and tell it to put the item into the center
    layoutData.centerNodes = [args.item]
    // we build the layout algorithm
    const layout = new RadialLayout({
      centerNodesPolicy: 'custom'
    })
    // now we calculate the layout and morph the results
    await graphComponent.morphLayout({ layout, layoutData })
  }
})

// when the user hovers over a node, we want to highlight all nodes that are reachable from this node
inputMode.itemHoverInputMode.addHoveredItemChangedListener((sender, args) => {
  // first we remove the old highlight
  graphComponent.highlightIndicatorManager.clearHighlights()
  if (args.item) {
    // and if we are hovering over a node
    // configure an instance of a new reachabilityalgorithm
    new Reachability({ directed: true, startNodes: [args.item] })
      // run the algorithm on the graph in the view
      .run(graphComponent.graph)
      // and use the results to iterate over all reachable nodes
      .reachableNodes.forEach(node =>
        // and highlight them in the view
        graphComponent.highlightIndicatorManager.addHighlight(node)
      )
  }
})

// tell it that we are only interested in hovered-over nodes
inputMode.itemHoverInputMode.hoverItems = GraphItemTypes.NODE
// and other elements should not discard the hover
inputMode.itemHoverInputMode.discardInvalidItems = false
// by default the 
inputMode.itemHoverInputMode.enabled = true

// this function will be executed at startup - it performs the main setup
async function loadGraph() {
  // first we query a limited number of arbitrary nodes
  // modify the query to suit your requirement!
  const nodeResult = await runCypherQuery('MATCH (node) RETURN node LIMIT 25')
  // we put the resulting records in a separate array
  const nodes = nodeResult.records.map(record => record.get('node'))

  // and we store all node identities in a separate array
  const nodeIds = nodes.map(node => node.identity)

  // with the node ids we can query the edges between the nodes
  const edgeResult = await runCypherQuery(
    `MATCH (n)-[edge]-(m) 
              WHERE id(n) IN $nodeIds 
              AND id(m) IN $nodeIds
              RETURN DISTINCT edge LIMIT 100`,
    { nodeIds }
  )
  // and store the edges in an array
  const edges = edgeResult.records.map(record => record.get('edge'))

  // now we create the helper class that will help us build the graph declaratively from the data
  const graphBuilder = new GraphBuilder(graphComponent.graph)

  // we set the default style for the nodes to use
  graphBuilder.graph.nodeDefaults.style = new ShapeNodeStyle({
    shape: 'ellipse',
    fill: 'lightblue'
  })
  // and the default size
  graphBuilder.graph.nodeDefaults.size = new Size(120, 40)
  // and configure the labels on the nodes to be truncated if they exceed a certain size
  graphBuilder.graph.nodeDefaults.labels.style = new DefaultLabelStyle({
    maximumSize: [116, 36],
    wrapping: 'word-ellipsis'
  })
  // and also we specify the placements for the labels.
  graphBuilder.graph.edgeDefaults.labels.layoutParameter = new EdgePathLabelModel(
    { distance: 3, autoRotation: true, sideOfEdge: 'above-edge' }
  ).createDefaultParameter()

  // now we pass it the collection of nodes
  graphBuilder.nodesSource = nodes
  // and tell it how to identify the nodes
  graphBuilder.nodeIdBinding = node => node.identity.toString()
  // as well as what text to use as the first label for each node
  graphBuilder.nodeLabelBinding = node =>
    node.properties && (node.properties['title'] || node.properties['name'])

  // pass the edges, too
  graphBuilder.edgesSource = edges
  // and tell it how to identify the source nodes - this matches the nodeIdBinding above
  graphBuilder.sourceNodeBinding = edge => edge.start.toString()
  // the same for the target side of the relations
  graphBuilder.targetNodeBinding = edge => edge.end.toString()
  // and we display the label, too, using the type of the relationship
  graphBuilder.edgeLabelBinding = edge => edge.type

  // with the following customization we specify a different style for
  // nodes labelled "Movie"
  const movieStyle = new ShapeNodeStyle({
    shape: 'round-rectangle',
    fill: 'yellow'
  })

  // whenever a node is created...
  graphBuilder.addNodeCreatedListener((sender, args) => {
    // ...and it is labelled as Movie
    if (
      args.sourceObject.labels &&
      args.sourceObject.labels.includes('Movie')
    ) {
      // we set a custom style
      args.graph.setStyle(args.item, movieStyle)
      // and change the size of the node
      args.graph.setNodeLayout(args.item, new Rect(0, 0, 120, 50))
    }
  })

  // similar to the above code, we also change the appearance of the "ACTED_IN" relationship
  // to a customized visualization
  const actedInStyle = new PolylineEdgeStyle({
    stroke: 'medium blue',
    smoothingLength: 30,
    targetArrow: 'blue default'
  })
  // for each added edge...
  graphBuilder.addEdgeCreatedListener((sender, args) => {
    // .. of type "ACTED_IN"
    if (args.sourceObject.type === 'ACTED_IN') {
      // set the predefined style
      args.graph.setStyle(args.item, actedInStyle)
    }
  })

  // this triggers the initial construction of the graph
  graphBuilder.buildGraph()

  // the graph does not have a layout at this point, so we run a simple radial layout
  await graphComponent.morphLayout(new RadialLayout())
}

// asynchronous helper function that executes a query with parameters
// *and* closes the session again
async function runCypherQuery(query, params) {
  const session = neo4jDriver.session('READ')
  try {
    return await session.run(query, params)
  } finally {
    session.close()
  }
}

// trigger the loading
loadGraph()
