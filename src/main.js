import cytoscape from 'cytoscape';
//import ReactCytoscape from 'react-cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import spread from 'cytoscape-spread';

import 'react';
import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { Dropdown, DropdownButton, Button,ButtonToolbar, ListGroup,ListGroupItem, Form} from 'react-bootstrap';
//import Plot from 'react-plotly.js';
import Chart from 'react-apexcharts'
import { Resizable, ResizableBox } from 'react-resizable';
import { saveAs } from 'file-saver';

import census from './census.js'

var cy = null; //UGLY!
cytoscape.use( cola );
cytoscape.use( dagre );
cytoscape.use( spread );


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const fetch_retry = (url, options, n) => fetch(url, options).catch(function(error) {
    if (n === 1) throw error;
    console.log(url+" n = "+n)
    return fetch_retry(url, options, n - 1);
});

class Heatmap extends Component {
  // https://github.com/apexcharts/react-apexcharts
  constructor(props) {
    super(props);
    this.log=props.log ? props.log : console.log

    this.state = {
      empty: true,
      options: {
        chart: {
          type: "heatmap"
        },
        dataLabels: { enabled: false },
        colors: ["#008FFB"],
        plotOptions: {
          heatmap: {
            colorScale: {
              ranges: [
              {
                from: -5,
                to: -1,
                color: '#FF0000',
                name: 'negative',
              },
              {
                from: -1,
                to: -0.01,
                color: '#FF5555',
                name: 'negative',
              },
              {         
                from: -0.01,
                to: 0.01,
                color: '#FFFFFF',
                name: 'weak',
              },
              {
                from: 0.01,
                to: 1,
                color: '#55ff55',
                name: 'positive',
              },
              {
                from: 1,
                to: 5,
                color: '#00ff00',
                name: 'positive',
              }
              ]
            }
          }
        }
      },
      series: [],
      title: { text: "Heatmap of average" }
    }
  }
  componentDidUpdate(prevProps) {
    if (this.props.parameters !== prevProps.parameters ||
       this.props.parameters[0] != prevProps.parameters[0] ||
       this.props.parameters[1] != prevProps.parameters[1] ||
       this.props.cy !== prevProps.cy ||
       this.props.updated != prevProps.updated
    ) {
      this.generateSeries()
      //this.forceUpdate()
    }
  }
  generateSeriesOld() {
    this.log("Generating new series")
    var r = this.props.netdata
    if (r.sparse) {
      this.log("Can't generate series from sparse data yet")
      return;
    }
    var el = r.species.map( (x,i) => { 
      var dat = 
        r.species.map( (y, j) => {
          var lambda1ix = this.props.parameters[0]
          var lambda2ix = this.props.parameters[1]
          var xs = r.A[lambda1ix][lambda2ix][i][j]
          var w = 0
          for(var k=0; k < xs.length; ++k) w+= xs[k]/xs.length
          return {y: w, x: y}
        })
      return { name: x, data: dat }
    })

    return el
  }
  generateSeries() {
    if (!this.props.cy) {
      alert("heatmap: cy not loaded")
      return ([])
    }
    this.log("Generating new series")
    var species = []
    this.props.cy.nodes( element => {
        if( element.isNode() && element.degree()>0){
            species.push({id: element.id(), ix: element.data().ix})
        }
    })
    if (!species.length) {
      this.setState({empty: true})
      return
    }
    var lambda1ix = this.props.parameters[0]
    var lambda2ix = this.props.parameters[1]
    var r = this.props.netdata
    if (r.sparse) {
      this.log("Can't generate series from sparse data yet")
      return;
    }
    var el = species.map( spx => { 
      var dat = 
        species.map( spy => {
          var i = spx.ix
          var j = spy.ix
          if (!i) { 
            return {y: 1, x: spy.id}
          }
          var xs = r.A[lambda1ix][lambda2ix][i][j]
          var w = 0
          for(var k=0; k < xs.length; ++k) w+= xs[k]/xs.length
          return {y: w, x: spy.id}
        })
      return { name: spx.id, data: dat }
    })
    this.setState({series: el, empty: false})
  }
  render() {
    var c = (this.state.empty ? 
      (<span>no nodes</span>) :
      (<Chart options={this.state.options} series={this.state.series} type={this.state.options.chart.type} />)
    )

//      <ResizableBox width={500} height={500}
//        minConstraints={[500, 500]} maxConstraints={[1200, 800]}>
    return (
      <div>{c}</div>
    )
//    </ResizableBox>)
  }
}
/*
class HeatMap extends Component { // plot.ly
  constructor(props) {
    super(props)
  }
  render() {
    var xValues = ['A', 'B', 'C', 'D', 'E'];
    var yValues = ['W', 'X', 'Y', 'Z'];
    var zValues = [
      [-1.00, 0.00, 0.75, 0.75, 0.00],
      [0.00, 0.00, 0.75, 0.75, 0.00],
      [0.75, 0.75, 0.75, 0.75, 0.75],
      [0.00, 0.00, 0.00, 0.75, 0.00]
    ];
    var colorscaleValue = [
      [0, '#3D9970'],
      [1, '#001f3f']
    ];
    var data = [{
      //x: xValues,
      //y: yValues,
      z: zValues,
      type: 'heatmap',
      //colorscale: colorscaleValue,
      showscale: false
    }];
    var layout = {} //{ width: 350, height: 350 }
    return (<Plot data={data} layout={layout} />)
  }
}
*/
class GeneNetItem extends Component {
  constructor(props) {
    super(props)
    this.state = { state: 0 }
    this.log = this.props.log ? this.props.log : console.log
    setTimeout(this.loadObject.bind(this), Math.floor(Math.random() * 5000))
  }
  componentDidUpdate(prevProps) {
    if (this.props.desc !== prevProps.desc) {
      this.setState({ state: 0 })
      this.loadObject()
    }
  }
  loadObject() {
    this.log("Loading GeneNetItem "+this.props.desc)
    this.log(this.props.href)
    fetch_retry(this.props.href, {credentials: "same-origin", mode: "cors"}, 5)
      .then((response) => {
        if(!response.ok) {
          this.setState( {state: 1})
          this.log("While loading object from server there was a server error: "+response.status+" "+response.statusText)
          return(false)
        } else {
          this.log("Recieved genenetwork response for "+this.props.desc+".")
          return(response.json())
        }
      })
      .then((json) => {
        if (!json) {
          this.setState( {state: 1})
          this.log("Recieved NO GeneNetItem json for "+this.props.desc+".")
        } else {
          this.log("Recieved GeneNetItem json for "+this.props.desc+".")
          this.setState( { genenetwork: json, state: 2 })
        }
      }).catch( e => {
        this.setState( {state: 1})
        this.log(e)
      })
    return false;
  }
  render() {
    if (this.state.state != 2) {
      var href = this.props.href
      var term = href.substr(href.lastIndexOf("/")+1, href.length)
      if (term.substr(0,2) == "GO") {
        href="http://amigo.geneontology.org/amigo/term/"+term
      } 
      var failed = this.state.state == 1 ? "FAILED! " : "LOADING... "
      return (<div>
        <span style={{color: "red"}}>&nbsp;{failed}</span>
        {this.props.desc} p={this.props.p}&nbsp;
        <a href={href} target="_blank">open external</a>&nbsp;
        <span style={{color: "blue"}} onClick={this.loadObject.bind(this)}>reload</span>
        </div>)
/*      return (<ListGroupItem href={href}>{this.props.desc} p={this.props.p}&nbsp;
        <span onClick={this.loadObject.bind(this)}>reload</span>
        </ListGroupItem>)
        */
    } else if(this.state.state == 2) {
      return (<ListGroupItem bsstyle="info" href={this.state.genenetwork.pathway.url} header={this.state.genenetwork.pathway.name}>{this.props.desc}<br/>p={this.props.p}</ListGroupItem>)
    }
  }
}
class Genenetwork extends Component {
  constructor(props) {
    super(props)
    this.state = { state: 0 }
    this.log = this.props.log ? this.props.log : console.log
    this.loadObject()
  }
  componentDidUpdate(prevProps) {
    if (this.props.symbol !== prevProps.symbol) {
      this.loadObject()
      this.setState({ state: 0 })
    }
  }
  loadObject() {
    this.log("Loading genenetwork...")
    var apiurl = `https://www.genenetwork.nl/api/v1/gene/${this.props.symbol}?verbose`
    this.log(apiurl)
    fetch_retry(apiurl, {credentials: "same-origin"}, 5)
      .then((response) => {
        if(!response.ok) {
          this.log("While loading object from server there was a server error: "+response.status+" "+response.statusText)
          return false
        } else {
          this.log("Recieved genenetwork response.")
          return(response.json())
        }
      })
      .then((json) => {
        this.log("Recieved genenetwork json.")
        this.setState( { genenetwork: json, state: 2 })
      }).catch( e=> {
        this.log(e)
        this.setState( {state: 0} )
      })
  }
  renderPathways() {
    var genedesc = this.props.symbol
    if (this.state.genenetwork && this.state.genenetwork.pathways) {
      genedesc = (<span><h2>{this.props.symbol}</h2><br/>{this.state.genenetwork.gene.description}<br/></span>)
      var links = this.state.genenetwork.pathways.annotated.map( (e,i) => {
        if (e.term) {
          return (<div className="genenetitem"><a href={e.term.url} target="_blank">{e.term.id}</a> &nbsp;p={e.pValue}<br/>{e.term.name}</div>)
        } else {
          var desc = e.href.substr(e.href.lastIndexOf("/")+1, e.href.length)
          return ((<GeneNetItem href={e.href} desc={desc} p={e.pValue} log={this.log} />))
        }
      })
      return ((<div className="genenet"><div style={{float: "left"}}>
<svg viewBox="0 0 55 100" width="33" height="60" fill="none" strokeWidth="6"><polyline points="25,3 50,28 5,72 29,97" style={{stroke:"#4d4d4d"}} ></polyline><polyline points="21,12 5,28 21,44" style={{stroke:"#4d4d4d"}} ></polyline><line x1="35" y1="28" x2="5" y2="28" style={{stroke:"#4d4d4d"}} ></line><polyline points="33,88 50,72 33,56" style={{stroke:"#4d4d4d"}} ></polyline><line x1="21" y1="72" x2="50" y2="72" style={{stroke:"#4d4d4d"}} ></line></svg></div>
       <div className="gnlogo"> GENE<br/>NETWORK<br clear="all"/></div><br clear="all" />
        {genedesc}<br/><span>{links}</span></div>))
    } else {
      return (
        <span>foo
        <span style={ {color: "blue"} } onClick={this.loadObject.bind(this)}>reload</span>
        </span>)
    }
  }
  render() {
    if (!this.state.state) return ("")
    if (this.state.state == 1) return ("Loading from genenetwork...")
    if (this.state.state == 2) {
      return (
        <span>
        {this.renderPathways()} </span>)
    }
  }
}
var edgecolors = ["red","green","blue","yellow"]
class Viewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      node: null, 
      nodedata: null, 
      filter: [true, true, true, true], 
      nets: "", 
      parameters: [0,0],
      updated: 0, // ugly! Main problem is to update heatmap on cy update without infinite loop
      //nodeAction: this.loadSpecies.bind(this)
      nodeAction: this.showPath.bind(this),
      census: this.cacheCensusList()
    }
  }
  cacheCensusList() {
    var res = census.map( struct => {
      return struct["Gene.Symbol"]
    })
    return res
  }
  isCensus(symbol) {
    return this.state.census.includes(symbol)
  }
  getCensus(symbol) {
    var match = census.filter( row => {
      return (row["Gene.Symbol"] == symbol)
    })
    return match[0]
  }
  colorCensus() {
    this.cy.nodes( e => { 
      if(e.isNode() && this.isCensus(e.id())) { 
        e.addClass("census") 
      }})
  }
  renderCensusInfo() {
    if(this.state.node && 
       this.isCensus(this.state.node.id())) 
    {
      var sym = this.state.node.id()
      var c = this.getCensus(sym)
      return (
        <div className="census">
          <h3>Cancer census data for {sym}</h3>
          {c.Name}<br/>
          <b>Role:</b> {c["Role.in.Cancer"]}<br/>
          <b>Syndrome:</b> {c["Cancer.Syndrome"]}<br/>
          <b>Tumour types, somatic:</b> {c["Tumour.Types.Somatic"]}<br/>
          <b>Tumour types, germline:</b> {c["Tumour.Types.Germline"]}<br/>
        </div>
      )
    } else {
      return (<span>&nbsp;</span>);
    }
  }
  relayout() {
    if (!this.cy) {
      alert("Cy not loaded!")
      return
    }
    var layout = this.cy.layout({name: "breadthfirst"});
    layout.run();
    layout = this.cy.layout({name: "cola"});
    layout.run();
  }
  showInfo() {
    var ns = []
    this.cy.nodes( e => { if(e.isNode() && e.selected()) { 
      ns.push(e) 
      this.log("selected: "+e.id())
    }})
    this.log("nodes selected"+ ns.length)
    if (ns.length == 1) {
      this.setState({node:ns[0]})
      //this.loadSpecies(ns[0])
    }
  }
  showPath(node) {
    this.cy.elements( e => { 
      e.removeClass("path_element") 
      e.removeClass("dim")
    })
    var ns = []
    this.cy.nodes( e => { if(e.isNode() && e.selected()) { 
      ns.push(e) 
      this.log("selected: "+e.id())
    }})
    this.log("nodes selected"+ ns.length)
    if (ns.length == 1) {
      this.cy.elements( e => { 
        if (e != ns[0])
          e.addClass("dim") 
      })
      ns[0].connectedEdges().addClass('path_element')
      ns[0].connectedEdges().removeClass('dim')
      ns[0].connectedEdges().connectedNodes().removeClass('dim')
    }
    if (ns.length != 2) {
      return
    }
    this.log("Running A*")
    var p = cy.elements().aStar({root: ns[0], goal: ns[1], directed: false}).path;
    if (p) {
      this.log("Found path")

      //p.filter( (i,x) => { return x != ns[0] && x != ns[1]; })
      //  .addClass('path_element');
      this.cy.elements( e => { 
        if (e != ns[0] && e != ns[1])
          e.addClass("dim") 
      })

      p.edgesWith(p)
        .addClass('path_element')
        .removeClass("dim")
      p.targets( e=> {
        e.removeClass("dim")
      })
      p.sources( e=> {
        e.removeClass("dim")
      })
    }  
  }
  selectNode(node) {
    if (node && this.state && this.state.node && (this.state.node.id() == node.id())) {
      this.log("Reacted to already select node")
      this.state.nodeAction(node)
    } else {
      this.log("Reacted to select node")
      this.setState( { node: node, nodedata: null })
      //need this for the info to work, temp. disabled to
      //reduce overhead
      this.state.nodeAction(node)
    }
  }
  changeLayout(e) {
    if (!this.cy) {
      alert("Cy not loaded!")
      return
    }
    var layout = this.cy.layout({name: e})
    layout.run()
  }
  selectEdge(e) {
    console.log(e)
  }
  log(e) {
    console.log(e)
  }
  loadSpecies(node) {
    this.log("Loading species info...")
    this.log("Loading Ensembl...")
    fetch(`https://rest.ensembl.org/lookup/symbol/homo_sapiens/${node.id()}?content-type=application/json`, {credentials: "same-origin"})
      .then((response) => {
        if(!response.ok) {
          this.log("While loading object from server there was a server error: "+response.status+" "+response.statusText)
          return false
        } else {
          this.log("Recieved Ensembl response.")
          return(response.json())
        }
      })
      .then((json) => {
        this.log("Recieved Ensembl json.")
        this.setState( { ensembl: json })
      })
  }
  renderEnsembl(sym) {
    return (this.state.ensembl) ? (<div className="genenet"><b>Ensembl:</b> {this.state.ensembl.description}</div>) : "Loading from Ensembl..."
  }
  clearGraph() {
    if(!this.cy) {
      alert("cy not loaded!")
      return
    }
    this.cy.remove("*")
  }
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = parseInt(target.name.substr(1,2))
    var filter = this.state.filter
    filter[name] = value;
    this.setState({
      filter: filter
    });
    this.updateGraph()
  }
  componentDidMount() {
    this.updateGraph()
  }
  updateGraph() {
    this.clearGraph()
    this.loadGraph()
    this.relayout()
    this.setState({updated: this.state.updated+1})
  }
  saveGraph() {
    var imgBlob = this.cy.png({output: "blob", maxWidth: 1600, maxHeight: 1200})
    saveAs( imgBlob, 'graph.png' );
  }
  selectParameter1(e) {
    var p = this.state.parameters
    p[0] = e*1
    this.setState({parameters: p})
    this.updateGraph()
    this.forceUpdate()
  }
  selectParameter2(e) {
    var p = this.state.parameters
    p[1] = e*1
    this.setState({parameters: p})
    this.updateGraph()
    this.forceUpdate()
  }
  loadGraph() {
    if (!this.cy) {
      alert("Cytoscape not loaded!")
      return
    }

    this.cy.on('select', 'node', function(evt){
      var node = evt.target;
      console.log( 'selected ' + node.id() );
      this.selectNode(node);
    }.bind(this));
    this.cy.on('unselect', 'node', function(evt){
      var node = evt.target;
      console.log( 'selected ' + node.id() );
      this.selectNode(node);
    }.bind(this));

    var r = this.props.netdata
    var nodes = r.species.map( (x,i) => { return ({ data: {id: x, ix: i } }); });
    this.cy.add(nodes)
    var lambda1ix = this.state.parameters[0]
    var lambda2ix = this.state.parameters[1]
    var filter = this.state.filter
    var thresh = 1e-2
    var fusethresh = 1e-3
    var edgew = (x) => { return Math.sqrt(1+10*Math.abs(x)) }

    var createEdge = (r,from,to,xs) => {
      var x = 0
      for(var k=0; k < xs.length; ++k) x+= xs[k]/xs.length
      var fused = 0
      for(var k=0; k < xs.length; ++k) fused += (Math.abs(xs[k] - x) < fusethresh) ? 1 : 0;
      var color = "white"
      var s = r.species[from]
      var t = r.species[to]
      if (fused == xs.length) {
        console.log("creating fused edge "+r+" -> "+t+", x="+x)
        color = "black"
        if (Math.abs(x) < thresh) return (null)
        else {
          var edge = ({ data: {id: s+'_'+t, source: s, target: t, w: edgew(x), x: x, color: color, arrowColor: color, arrowShape: (x<0)?"square":"triangle-backcurve", ix: {from,to} }});
          this.cy.add( edge )
        }
      } else {
        console.log("creating edges "+r+" -> "+t+", x="+xs)
        for (var k=0; k < xs.length; ++k) {
          if (Math.abs(xs[k]) < thresh) continue;
          if(filter[k]) this.cy.add({ data: {id: s+'_'+t+"_"+r.descriptions[k], source: s, target: t, w: edgew(xs[k]), x: xs[k], color: edgecolors[k], arrowColor: edgecolors[k],netno: k, arrowShape: (xs[k]<0)?"square":"triangle-backcurve"  }})
        }
      }
    }
    if (r.sparse) {
      //alert("under construction: building graph from sparse data")
      for(var pa=0; pa < r.sparse.length; ++pa) {
        if(r.sparse[pa].lambda1ix == lambda1ix+1 &&
           r.sparse[pa].lambda2ix == lambda2ix+1) {
          var edges = r.sparse[pa].edgelist.map( (edge) => {
            var from = edge.s-1
            var to = edge.t-1
            if (from == to) return (null);
            var xs = edge.w
            createEdge(r,from,to,xs)
          })
        }
      }
    } else { // TODO factor this code to use above createEdge
      var edges = (r.A[lambda1ix][lambda2ix].map( (xss,i) => { 
        return (xss.map( (xs,j) => { 
          if (i == j) return (null) // skip diagonal, i.e. self-edges
          var x = 0
          for(var k=0; k < xs.length; ++k) x+= xs[k]/xs.length
          var fused = 0
          for(var k=0; k < xs.length; ++k) fused += (Math.abs(xs[k] - x) < fusethresh) ? 1 : 0;
          var color = "white"
          var s = r.species[i]
          var t = r.species[j]
          if (fused == xs.length) {
            color = "black"
            if (Math.abs(x) < thresh) return (null)
            else {
              var edge = ({ data: {id: s+'_'+t, source: s, target: t, w: edgew(x), x: x, color: color, arrowColor: color, arrowShape: (x<0)?"square":"triangle-backcurve", ix: {i,j} }});
              this.cy.add( edge )
            }
          } else {
            for (var k=0; k < xs.length; ++k) {
              if (Math.abs(xs[k]) < thresh) continue;
              if(filter[k]) this.cy.add({ data: {id: s+'_'+t+"_"+r.descriptions[k], source: s, target: t, w: edgew(xs[k]), x: xs[k], color: edgecolors[k], arrowColor: edgecolors[k],netno: k, arrowShape: (xs[k]<0)?"square":"triangle-backcurve"  }})
            }
          }
        }
      ))
      })
      );
//    edges = edges.flat();
//    edges = edges.filter( (x) => { return (x != null); });
//    cy.add( edges )
    }
    cy = this.cy
    this.cy.nodes( element => {
        if( element.isNode() && element.degree()<1){
            cy.remove(element)
        }
    })
    this.colorCensus()
    this.relayout()
  }
  fitGraph() {
    if(this.cy)
      this.cy.fit()
  }
  loadCOSMIC() {
    var url = "https://cancer.sanger.ac.uk/cosmic/gene/analysis?ln="+this.state.node.id()
    window.open(url, '_blank')
  }
  loadGeneCard() {
    var url = "https://www.genecards.org/cgi-bin/carddisp.pl?gene="+this.state.node.id()
    window.open(url, '_blank')
  }
  loadNCBI() {
    var url = "https://www.ncbi.nlm.nih.gov/gene?cmd=search&term="+this.state.node.id()+"%5Bsym%5D"
    window.open(url, '_blank')
  }
  render() {
    var r = this.props.netdata
    if (!r) {
      return (<span>Network data not loaded yet</span>);
    }
    var nets = r.descriptions.map( (netname,i) => { return (
      <span>
        <label style={ {color: "white", backgroundColor: edgecolors[i] } } >
          &nbsp;
          <input name={"c"+i} type="checkbox" checked={this.state.filter[i]} onChange={this.handleInputChange.bind(this)} />
          &nbsp;
          {netname}
          &nbsp;
        </label><br/>
      </span>
    )}, this)
    var parameter1items = r.parameters.lambda1.map( 
      (lambda,i) => { 
        return (<Dropdown.Item onSelect={this.selectParameter1.bind(this)} key={`lambda1-${i}`} eventKey={i}>{lambda}</Dropdown.Item>)
      })
    var parameter2items = r.parameters.lambda2.map( 
      (lambda,i) => { 
        return (<Dropdown.Item onSelect={this.selectParameter2.bind(this)} key={`lambda2-${i}`} eventKey={i}>{lambda}</Dropdown.Item>)
      })
    var parametermenus = (
      <ButtonToolbar>
      <DropdownButton
        bsstyle="default"
        title={`LASSO penalty`}
        key="lambda1menu"
        id="lambda1menu"
       >
       {parameter1items}
       </DropdownButton>
      <DropdownButton
        bsstyle="default"
        title={`Fused penalty`}
        key="lambda2menu"
        id="lambda2menu"
       >
       {parameter2items}
       </DropdownButton>
      </ButtonToolbar>
    )
    var edgeMenu = "";
    var genecard = ""
    if (this.state && this.state.node) {
      var sym = this.state.node.id()
      edgeMenu = this.state.node.connectedEdges().map( (e,i) => {
        var x = e.data('x')
        return (<Dropdown.Item onSelect={this.selectEdge} key={`neigh-${e.id()}`} eventKey={`${e.id()}`}>{e.id()} w={x}</Dropdown.Item>)
      });
      var census = ""
      if(this.isCensus(this.state.node.id()))
        census = this.renderCensusInfo(this.state.node.id())
      genecard = (
      <span>
        {census}
        <Genenetwork symbol={sym} log={this.log} />
      </span>
      )
    }
    var selected = (this.state && this.state.node) ? (
      <span>
      <DropdownButton
        bsstyle="default"
        title={`Actions for Species ${this.state.node.id()}`}
        key="speciesmenu"
        id="speciesmenu"
       >
         <Dropdown.Item onSelect={this.loadCOSMIC.bind(this)}>COSMIC</Dropdown.Item>
         <Dropdown.Item onSelect={this.loadGeneCard.bind(this)}>Genecard</Dropdown.Item>
         <Dropdown.Item onSelect={this.loadNCBI.bind(this)}>NCBI</Dropdown.Item>
       </DropdownButton>
      <DropdownButton
        bsstyle="default"
        title={`Edges of Species ${this.state.node.id()}`}
        key="speciesEdges"
        id="speciesEdges"
       >
         {edgeMenu}
       </DropdownButton>
       </span>
       ) : "";
    var lambda1ix = this.state.parameters[0]
    var lambda2ix = this.state.parameters[1]
/*
      <Button onClick={this.updateGraph.bind(this)}>Update Graph</Button>
      <Button onClick={this.clearGraph.bind(this)}>Clear Graph</Button>
      */
/*      <ResizableBox width={"100%"} height={800}
        minConstraints={[50, 500]} maxConstraints={[2000, 1000]}>*/
    return (<div>
      <CytoscapeComponent cy={cy =>  {
            this.log("new cy ", cy)
            this.cy = cy
          }
        }
        stylesheet={[
          {
            selector: 'node',
            style: {
              'width': 'label',
              'height': 'label',
              'background-color': '#eee',
              'border-color': "black",
              'border-style': "solid",
              'border-width': "2",
              'padding': "10px",
              'label': 'data(id)',
              'content': 'data(id)',
              'shape': 'rectangle',
              'text-valign': "center"
            }
          },
          {
            selector: 'node:selected',
            style: {
             'overlay-color': 'blue',
             'overlay-opacity': '0.2',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 'data(w)',
              //'width': 10,
              'line-color': 'data(color)',
              'target-arrow-color': 'data(arrowColor)',
              'arrow-scale': 1,
              'target-arrow-shape': 'data(arrowShape)',
              'curve-style': 'bezier' // need for arrows to work
            }
          },
          {
            selector: '.path_element',
            style: { 
              'line-color': 'purple',
              'line-style': 'dashed',
              width: 5,
              label: "data(x)",
              'text-background-color': "#5555FF",
              'text-background-shape': "roundrectangle",
              'text-background-opacity': 1,
              color: "white"
            }
          },
          {
            selector: '.dim',
            style: { 
              color: '#aaa',
              'background-color': '#fff',
              'border-color': "#aaa",
              'line-color': '#aaa',
            }
          },
          {
            selector: '.census',
            style: { 
              'background-color': '#faa',
            }
          }
        ]}
        id="cyreact"
      />
      <div id="options">
        {parametermenus}<br/>
        lambda1: {r.parameters.lambda1[lambda1ix]}&nbsp;
        lambda2: {r.parameters.lambda2[lambda2ix]}<br/>
        <label>Show links for net:</label><br/>
        {nets}<br/>
        <Button onClick={this.saveGraph.bind(this)}>Download Graph</Button><br/>
        <Button onClick={this.fitGraph.bind(this)}>Fit Graph</Button><br/>
        <DropdownButton
          bsstyle="default"
          title="Change Layout"
          key="layoutmenu"
          id="layoutmenu"
         >
          <Dropdown.Item onSelect={this.changeLayout.bind(this)} eventKey="cose">Cose</Dropdown.Item>
          <Dropdown.Item onSelect={this.changeLayout.bind(this)} eventKey="cola">Cola</Dropdown.Item>
          <Dropdown.Item onSelect={this.changeLayout.bind(this)} eventKey="dagre">Dagre</Dropdown.Item>
          <Dropdown.Item onSelect={this.changeLayout.bind(this)} eventKey="spread">Spread</Dropdown.Item>
          <Dropdown.Item onSelect={this.changeLayout.bind(this)} eventKey="concentric">Concentric</Dropdown.Item>
          <Dropdown.Item onSelect={this.changeLayout.bind(this)} eventKey="breadthfirst">Breadth First</Dropdown.Item>
        </DropdownButton>
        <Button onClick={this.relayout.bind(this)}>Re-layout</Button>
        <br/>
        {selected}<br/>
        <div className="genecard" >{genecard}</div>
      </div>
</div>
    );
    /*
      <div id="heatmap">
        <Heatmap parameters={[this.state.parameters[0],this.state.parameters[1]]} cy={this.cy} updated={this.state.updated} log={this.log} netdata={this.props.netdata}/><br/>
      </div>
</div>
    );
*/

  }
}
class Loader extends Component {
  constructor(props) {
    super(props)
    if (typeof netdata !== 'undefined') {
      this.state = { URL: null, netdata: netdata }
    } else {
      this.state = { URL: null }
    }
  }
  download (url) {
    this.setState( { message: "Downloading..." } )
    fetch(this.state.URL).then((response) => {
      if (!response.ok) {
        alert("Couldn't download result data");
        this.setState( { message: null })
      }
      return(response.json())
    })
    .then((json) => {
      this.setState({ netdata: json, message: null })
    })
    return false
  }
  handleChange(ev) {
    console.log(ev.target.value)
    this.setState( { URL: ev.target.value })
  }
  render () {
    if (this.state.message) {
      return (
	<div>
	{this.state.message}
	</div>
      )
    }
    else if (this.state.netdata) {
      return (
          <div>
          <Viewer netdata={this.state.netdata} />
          </div>
      )
    } else {
      return (
      <div>
      <p>
        This GUI instance found no built-in data. Please supply your own data or try 
        using (copy and paste data URL to field below)
        <ul>
        <li>the female cancers example result from http://epoc.med.gu.se/femalecancers.js</li>
        <li>the example result from <a href="http://github.com/tabenius/fusedepoc">the guide</a> at https://jsonstorage.net/api/items/f32e3ccf-a96d-44b5-86b8-ef923cc32e41</li>
        </ul>
        </p>
        <Form>
        <Form.Group controlId="formURL">
        <Form.Label>URL of data</Form.Label>
        <Form.Control type="url" placeholder="enter URL" onChange={this.handleChange.bind(this)} />
        </Form.Group>
        <Button variant="primary" type="button" onClick={this.download.bind(this)}>Submit</Button>
        </Form>
      </div>
      )
    }
  }
}

ReactDOM.render( <Loader />, document.getElementById('react'));

