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
    componentDidUpdate: function (oldProps) {
        var oldFrame = oldProps.frame,
            newFrame = this.props.frame;
        if (oldFrame.width != newFrame.width || oldFrame.height != newFrame.height) {
            this.updateDimensions();
        }
    },
    calcLinkPath: function(id, link) {
        var nodes = this.props.frame.nodes,
            lineCoords = id.split('_').map(function(nodeId) {
                var node = nodes[nodeId];
                return [node.x, node.y];
            });
        Array.prototype.splice.apply(lineCoords, [1, 0].concat(link.through || []));
        return 'M' + lineCoords.map(function(point) {
            return typeof point === 'string' ? point :
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
            {Object.keys(frame.nodes || {}).map(function(id) {
                var node = frame.nodes[id];
                return <text key={id}
                             x={(node.x + 1) * this.state.scaleX}
                             y={(node.y + 1) * this.state.scaleY}
                             dx={NODE_RADIUS} dy={NODE_RADIUS}
                             fontFamily="Verdana" fontSize="30">
                    {node.caption || id}
                </text>
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
        var frameIdxs = [];
        for (var i = 0; i < this.props.scenes.length; i++) frameIdxs.push(0);
        this.setState({
            frameIdxs: frameIdxs,
            sceneIdx: 0
        });
    },
    handleKey: function(e) {
        var frameIdxs = this.state.frameIdxs,
            sceneIdx = this.state.sceneIdx,
            scenes = this.props.scenes;
        switch (e.keyCode) {
            case KEY_LEFT:
                if (frameIdxs[sceneIdx] > 0) frameIdxs[sceneIdx]--;
                break;
            case KEY_RIGHT:
                if (frameIdxs[sceneIdx] < scenes[sceneIdx].length - 1) frameIdxs[sceneIdx]++;
                break;
            case KEY_UP:
                if (sceneIdx > 0) sceneIdx--;
                break;
            case KEY_DOWN:
                if (sceneIdx < scenes.length - 1) sceneIdx++;
                break;
            default:
                return;
        }
        this.setState({
            sceneIdx: sceneIdx,
            frameIdx: frameIdxs
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
        var scene = this.props.scenes[this.state.sceneIdx],
            framesCnt = this.state.frameIdxs[this.state.sceneIdx],
            frame = {};
        for (var i = 0; i <= framesCnt; i++) {
            frame = this.deepMerge(frame, scene[i]);
        }
        return <SvgGraph frame={frame} colors={['', CURR, PATH]} />
    }
});

var CURR = 'deeppink',
    PATH = 'lightseagreen',
    DONE = 'yellowgreen';

function Scene(initFrame, initNode) {
    initFrame.nodes[initNode].stroke = CURR;
    var path = [initNode],
        frames = [initFrame],
        marked = 0;
    function move(a, b, isFwd) {
        if (isFwd) {
            path.push(b);
        } else {
            path.pop();
        }
        var frame = {links: {}, nodes: {}};
        a = frame[a.indexOf('_') > -1 ? 'links' : 'nodes'][a] = {};
        b = frame[b.indexOf('_') > -1 ? 'links' : 'nodes'][b] = {};
        a.stroke = isFwd ? PATH : '';
        b.stroke = CURR;
        frames.push(frame);
    }
    return {
        walk: function() {
            var curr = path[path.length - 1], step, middle;
            for (var i = 0; i < arguments.length; i++) {
                step = arguments[i];
                if (curr.indexOf('_') > -1) {
                    middle = curr.split('_')[1];
                    move(curr, middle, true);
                    if (step.indexOf('_') > -1) {
                        move(middle, step, true);
                    }
                } else {
                    middle = curr;
                    if (step.indexOf('_') === -1) {
                        middle = curr + '_' + step;
                        move(curr, middle, true);
                    }
                    move(middle, step, true);
                }
                curr = step;
            }
            return this;
        },
        backTo: function(step) {
            var i = path.length - 1;
            while (path[i] !== step) {
                var last = path[i--];
                move(last, path[i], false);
            }
            return this;
        },
        mark: function(suffix) {
            var frame = {nodes: {}},
                id = path[path.length - 1];
            frame.nodes[id] = {
                fill: DONE,
                caption: id + '[' + (++marked) + ']' + (suffix || '')
            };
            frames.push(frame);
            return this;
        },
        text: function(caption) {
            var frame = {nodes: {}},
                last = path[path.length - 1].split('_');
            frame.nodes[last[last.length - 1]] = {caption: caption};
            frames.push(frame);
            return this;
        },
        jumpTo: function(step) {
            move(path[path.length - 1], step, true);
            return this;
        },
        frame: function(frame) {
            frames.push(frame);
            return this;
        },
        frames: function() {
            return frames;
        }
    }
}

var scenes = [
    Scene({
        width: 4,
        height: 2,
        nodes: {
            A: {x: 0, y: 1},
            B: {x: 1, y: 1},
            C: {x: 2, y: 0},
            D: {x: 2, y: 1},
            E: {x: 3, y: 0},
            F: {x: 3, y: 1}
        },
        links: {
            A_B: {}, B_C: {}, C_E: {},
            C_A: {dashed: true, through: ['Q', [1, 0]]},
            A_D: {dashed: true, through: ['C', [0, 2], [1, 2]]},
            D_E: {}, D_F: {}
        }
    }, 'A')
        .walk('B', 'C', 'E').mark()
        .backTo('C').mark()
        .walk('C_A').backTo('B').mark()
        .backTo('A').mark()
        .walk('D', 'D_E').backTo('D').walk('F').mark()
        .backTo('D').mark()
        .backTo('A')
        .frames(),
    Scene({
        width: 3,
        height: 1,
        nodes: {
            A: {x: 1, y: 0},
            B: {x: 2, y: 0},
            C: {x: 0, y: 0}
        },
        links: {
            A_B: {},
            B_C: {dashed: true, through: ['Q', [1, -1]]},
            C_A: {}
        }
    }, 'A')
        .walk('B').mark()
        .walk('C', 'C_A').backTo('C').mark()
        .backTo('A').mark()
        .frames(),
    Scene({
        width: 3,
        height: 1,
        nodes: {
            A: {x: 1, y: 0},
            B: {x: 2, y: 0},
            C: {x: 0, y: 0}
        },
        links: {
            A_B: {},
            B_C: {dashed: true, through: ['Q', [1, -1]]},
            C_A: {}
        }
    }, 'A')
        .walk('B').mark()
        .walk('C', 'C_A').text('A→C')
        .backTo('A').mark()
        .jumpTo('C').walk('C_A').backTo('C').mark()
        .backTo('A')
        .frames(),
    Scene({
        width: 5,
        height: 3,
        nodes: {
            A: {x: 2, y: 0},
            B: {x: 3, y: 1},
            C: {x: 4, y: 1},
            D: {x: 0, y: 1},
            E: {x: 2, y: 2},
            F: {x: 1, y: 1},
            G: {x: 3, y: 2}
        },
        links: {
            A_B: {through: ['Q', [2, 0.5]]}, B_C: {},
            C_D: {dashed: true, through: ['C', [1, -1], [3, -1]]},
            D_E: {through: ['C', [0, 2], [1, 2]]}, E_B: {},
            E_F: {dashed: true, through: ['Q', [1.5, 2]]},
            E_G: {}, F_A: {}, F_B: {}
        }
    }, 'A')
        .walk('B', 'C').mark()
        .walk('D', 'E', 'E_B').text('B→D')
        .backTo('E').walk('G').mark()
        .backTo('E').walk('F', 'F_A').text('A→F')
        .backTo('F').walk('F_B').text('B→D,F')
        .backTo('B').mark('→F')
        .jumpTo('D').walk('E', 'E_B').backTo('E').walk('E_G').backTo('E').mark()
        .walk('F', 'F_A').backTo('F').walk('F_B').backTo('D').mark()
        .backTo('B').text('B[3]')
        .jumpTo('F').walk('F_A').backTo('F').walk('F_B').backTo('A').mark()
        .jumpTo('F').walk('F_A').backTo('F').walk('F_B').backTo('F').mark()
        .backTo('A')
        .frames()
];

React.render(<Slides scenes={scenes} />, document.getElementById('react'));
