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
            scaleX: Math.round(width / (this.props.frame.width + 1)),
            scaleY: Math.round(height / (this.props.frame.height + 1))
        });
    },
    componentWillMount: function() {
        this.updateDimensions();

    },
    componentDidMount: function() {
        window.addEventListener('resize', this.updateDimensions);
    },
    componentWillUnmount: function() {
        window.removeEventListener('resize', this.updateDimensions);
    },
    calcLinkPath: function(id, link) {
        var nodes = this.props.frame.nodes,
            lineCoords = id.split('_').map(function(nodeId) {
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
        var frame = this.props.frame;
        function markerId(color) {
            return 'marker-arrow' + (color ? '-' + color : '');
        }
        return <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
            width={this.state.width}
            height={this.state.height}>
            <defs>
                {(this.props.colors || ['']).map(function(color) {
                    return <marker is="my-svg-marker" key={color} id={markerId(color)}
                                   markerWidth="13" markerHeight="13"
                                   refX={10 + NODE_RADIUS / STROKE_WIDTH} refY="6" orient="auto"
                                   stroke={color || 'black'} fill={color || 'black'}>
                        <path d="M2,4 L2,9 L10,6 z"/>
                    </marker>
                }.bind(this))}
            </defs>
            {Object.keys(frame.links || {}).map(function(id) {
                var link = frame.links[id];
                return <path key={id}
                             d={this.calcLinkPath(id, link)}
                             stroke={link.stroke || 'black'} strokeWidth={STROKE_WIDTH}
                             strokeDasharray={link.dashed ? '10,10' : ''}
                             fill="transparent" markerEnd={'url(#' + markerId(link.stroke) + ')'} />
            }.bind(this))}
            {Object.keys(frame.nodes || {}).map(function(id) {
                var node = frame.nodes[id];
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

var KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40;

var Slides = React.createClass({
    componentWillMount: function() {
        this.setState({
            sceneIdx: 0,
            frameIdx: 0
        });
    },
    handleKey: function(e) {
        var s = this.state.sceneIdx,
            f = this.state.frameIdx,
            scenes = this.props.scenes;
        switch (e.keyCode) {
            case KEY_LEFT:
                if (f > 0) {
                    f--;
                } else if (s > 0) {
                    f = scenes[--s].length - 1;
                }
                break;
            case KEY_RIGHT:
                if (f < scenes[s].length - 1) {
                    f++;
                } else if (s < scenes.length - 1){
                    f = 0;
                    s++;
                }
                break;
            //TODO: UP, DOWN
        }
        this.setState({
            sceneIdx: s,
            frameIdx: f
        });
    },
    componentDidMount: function() {
        window.addEventListener('keydown', this.handleKey);
    },
    componentWillUnmount: function() {
        window.removeEventListener('keydown', this.handleKey);
    },
    deepMerge: function(dest, source) {
        Object.keys(source).forEach(function(key) {
            if (typeof dest[key] === 'object' && typeof source[key] === 'object') {
                var value = {};
                this.deepMerge(value, dest[key]);
                this.deepMerge(value, source[key]);
                dest[key] = value;
            } else {
                dest[key] = source[key];
            }
        }.bind(this));
        return dest;
    },
    render: function () {
        var scene = this.props.scenes[this.state.sceneIdx];
        var frame = {};
        for (var i = 0; i <= this.state.frameIdx; i++) {
            frame = this.deepMerge(frame, scene[i]);
        }
        return <SvgGraph frame={frame} colors={['', CURR, PATH]} />
    }
});

var CURR = 'mediumorchid',
    PATH = 'lightseagreen',
    DONE = 'palegoldenrod';

var scenes = [[

    {
        width: 2,
        height: 2,
        nodes: {
            A: {x: 0, y: 0, stroke: CURR},
            B: {x: 1, y: 0},
            C: {x: 0, y: 1}
        },
        links: {
            A_B: {},
            B_C: {dashed: true, through: [1, 1, 'Q']},
            C_A: {}
        }
    },
    {links: {A_B: {stroke: CURR}}, nodes: {A: {stroke: PATH}}},
    {links: {A_B: {stroke: PATH}}, nodes: {B: {stroke: CURR}}},
    {nodes: {B: {fill: DONE}}},
    {links: {B_C: {stroke: PATH}}, nodes: {B: {stroke: CURR}}},
]];

React.render(<Slides scenes={scenes} />, document.getElementById('react'));
