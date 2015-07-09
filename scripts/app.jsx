/** @jsx React.DOM */
'use strict';

var NODE_RADIUS = 40,
    STROKE_WIDTH = 4;

var SvgGraph = React.createClass({
    updateDimensions: function() {
        var width = window.innerWidth - 4,
            height = window.innerHeight - 4;

        this.setState({
            width: width,
            height: height,
            scaleX: Math.round(width / (this.props.width + 1)),
            scaleY: Math.round(height / (this.props.height + 1))
        });
    },
    componentWillMount: function() {
        this.updateDimensions();
    },
    componentDidMount: function() {
        window.addEventListener("resize", this.updateDimensions);
    },
    componentWillUnmount: function() {
        window.removeEventListener("resize", this.updateDimensions);
    },
    calcLinkPath: function(id, link) {
        var nodes = this.props.model.nodes,
            lineCoords = id.split('-').map(function(nodeId) {
                var node = nodes[nodeId];
                return [node.x, node.y];
            });
        var through = !link.through || link.through.length === 0 ? []
            : typeof link.through[0] !== 'object' ? [link.through]
            : link.through;
        Array.prototype.splice.apply(lineCoords, [1, 0].concat(through));
        return 'M' + lineCoords.map(function(point) {
            return (point.length === 3 ? point[2] + ' ' : '') +
                ((point[0] + 1) * this.state.scaleX) + ',' +
                ((point[1] + 1) * this.state.scaleY);
        }.bind(this)).join(' ');
    },
    render: function () {
        var model = this.props.model;
        function markerId(color) {
            return 'marker-arrow' + (color ? '-' + color : '');
        }
        var linkColors = {};
        Object.keys(model.links || {}).forEach(function(id) {
            linkColors[model.links[id].stroke || ''] = true;
        });
        return <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
            width={this.state.width}
            height={this.state.height}>
            <defs>
                {Object.keys(linkColors).map(function(color) {
                    return <marker is="my-svg-marker" key={color} id={markerId(color)}
                                   markerWidth="13" markerHeight="13"
                                   refX={10 + NODE_RADIUS / STROKE_WIDTH} refY="6" orient="auto"
                                   stroke={color || 'black'} fill={color || 'black'}>
                        <path d="M2,4 L2,9 L10,6 z"/>
                    </marker>
                }.bind(this))}
            </defs>
            {Object.keys(model.links || {}).map(function(id) {
                var link = model.links[id];
                return <path key={id}
                             d={this.calcLinkPath(id, link)}
                             stroke={link.stroke || 'black'} strokeWidth={STROKE_WIDTH}
                             strokeDasharray={link.dashed ? '10,10' : ''}
                             fill="transparent" markerEnd={'url(#' + markerId(link.stroke) + ')'} />
            }.bind(this))}
            {Object.keys(model.nodes || {}).map(function(id) {
                var node = model.nodes[id];
                return <circle key={id}
                               cx={(node.x + 1) * this.state.scaleX}
                               cy={(node.y + 1) * this.state.scaleY}
                               r={NODE_RADIUS}
                               stroke={node.stroke || 'black'} strokeWidth={STROKE_WIDTH}
                               fill={node.fill || 'white'} />
            }.bind(this))}
        </svg>
    }
});

var model = {
    nodes: {
       A: {x: 0, y: 1},
       B: {x: 1, y: 0, stroke: 'red'},
       C: {x: 2, y: 1, stroke: 'red', fill: 'cyan'}
    },
    links: {
        'A-B': {},
        'B-C': {stroke: 'red'},
        'C-A': {stroke: 'red', dashed: true, through: [1, 0.5, 'Q']}
    }
};

React.render(<SvgGraph height={2} width={3} model={model} />, document.getElementById('react'));
