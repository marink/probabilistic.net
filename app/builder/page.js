"use client";

import { useState, useRef } from 'react';
import {
  Box, Typography, Button, ButtonGroup, Tooltip, Chip,
  AppBar, Toolbar, Paper,
} from '@mui/material';
import NearMeIcon           from '@mui/icons-material/NearMe';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import ArrowForwardIcon     from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon    from '@mui/icons-material/Delete';
import HubIcon              from '@mui/icons-material/Hub';
import GitHubIcon           from '@mui/icons-material/GitHub';
import Link                 from 'next/link';

const PURPLE       = '#563d7c';
const PURPLE_LIGHT = '#6f5499';
const PURPLE_TEXT  = '#cdbfe3';
const PP           = '#f0ebf8';

const R = 32;

const EXAMPLES = {
  Sprinkler: {
    nodes: [
      { id: 'C', label: 'Cloudy',    x: 400, y:  90 },
      { id: 'S', label: 'Sprinkler', x: 240, y: 230 },
      { id: 'R', label: 'Rain',      x: 560, y: 230 },
      { id: 'W', label: 'Wet Grass', x: 400, y: 370 },
    ],
    edges: [
      { id: 'CS', from: 'C', to: 'S' }, { id: 'CR', from: 'C', to: 'R' },
      { id: 'SW', from: 'S', to: 'W' }, { id: 'RW', from: 'R', to: 'W' },
    ],
  },
  'Burglary / Alarm': {
    nodes: [
      { id: 'B', label: 'Burglary',   x: 220, y:  90 },
      { id: 'E', label: 'Earthquake', x: 580, y:  90 },
      { id: 'A', label: 'Alarm',      x: 400, y: 230 },
      { id: 'J', label: 'John Calls', x: 240, y: 370 },
      { id: 'M', label: 'Mary Calls', x: 560, y: 370 },
    ],
    edges: [
      { id: 'BA', from: 'B', to: 'A' }, { id: 'EA', from: 'E', to: 'A' },
      { id: 'AJ', from: 'A', to: 'J' }, { id: 'AM', from: 'A', to: 'M' },
    ],
  },
  Student: {
    nodes: [
      { id: 'D', label: 'Difficulty',   x: 200, y:  90 },
      { id: 'I', label: 'Intelligence', x: 560, y:  90 },
      { id: 'G', label: 'Grade',        x: 350, y: 230 },
      { id: 'S', label: 'SAT',          x: 570, y: 250 },
      { id: 'L', label: 'Letter',       x: 280, y: 370 },
    ],
    edges: [
      { id: 'DG', from: 'D', to: 'G' }, { id: 'IG', from: 'I', to: 'G' },
      { id: 'IS', from: 'I', to: 'S' }, { id: 'GL', from: 'G', to: 'L' },
    ],
  },
};

function wouldCycle(edges, fromId, toId) {
  const adj = {};
  for (const e of edges) (adj[e.from] ||= []).push(e.to);
  const seen = new Set(), q = [toId];
  while (q.length) {
    const n = q.pop();
    if (n === fromId) return true;
    if (!seen.has(n)) { seen.add(n); (adj[n] || []).forEach(nb => q.push(nb)); }
  }
  return false;
}

function linePts(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return {
    x1: a.x + ux * R,
    y1: a.y + uy * R,
    x2: b.x - ux * (R + 9),
    y2: b.y - uy * (R + 9),
  };
}

let _seq = 1;

export default function Builder() {
  const [nodes, setNodes]   = useState(() => EXAMPLES.Sprinkler.nodes.map(n => ({ ...n })));
  const [edges, setEdges]   = useState(() => EXAMPLES.Sprinkler.edges.map(e => ({ ...e })));
  const [mode, setMode]     = useState('select');
  const [selected, setSelected] = useState(null); // { type: 'node'|'edge', id }
  const [edgeFrom, setEdgeFrom] = useState(null);
  const [drag, setDrag]     = useState(null);  // { id, ox, oy }
  const [mouse, setMouse]   = useState(null);  // for ghost edge { x, y }
  const [newNode, setNewNode]   = useState(null); // { x, y }
  const [newLabel, setNewLabel] = useState('');
  const svgRef = useRef();

  function pt(e) {
    const { left, top } = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - left, y: e.clientY - top };
  }

  function changeMode(m) {
    setMode(m);
    setSelected(null);
    setEdgeFrom(null);
    setNewNode(null);
    setNewLabel('');
    setDrag(null);
    setMouse(null);
  }

  function loadExample(name) {
    if (!name) return;
    const ex = EXAMPLES[name];
    setNodes(ex.nodes.map(n => ({ ...n })));
    setEdges(ex.edges.map(e => ({ ...e })));
    setSelected(null);
    setEdgeFrom(null);
    setNewNode(null);
    setNewLabel('');
    setMode('select');
  }

  /* ── SVG pointer handlers ── */

  function handleSvgMouseMove(e) {
    const p = pt(e);
    setMouse(p);
    if (drag) {
      setNodes(prev => prev.map(n =>
        n.id === drag.id ? { ...n, x: p.x + drag.ox, y: p.y + drag.oy } : n
      ));
    }
  }

  function handleSvgMouseUp() {
    setDrag(null);
  }

  function handleSvgClick(e) {
    if (drag) return;

    if (mode === 'addNode') {
      const p = pt(e);
      // Only open input if click was on SVG canvas (not a node)
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'rect') {
        setNewNode(p);
        setNewLabel('');
      }
    }

    if (mode === 'addEdge' && edgeFrom) {
      // clicked canvas — cancel edge
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'rect') {
        setEdgeFrom(null);
      }
    }

    if (mode === 'select') {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'rect') {
        setSelected(null);
      }
    }
  }

  function handleNodeMouseDown(e, nodeId) {
    e.stopPropagation();
    if (mode !== 'select') return;
    const p = pt(e);
    const node = nodes.find(n => n.id === nodeId);
    setDrag({ id: nodeId, ox: node.x - p.x, oy: node.y - p.y });
  }

  function handleNodeClick(e, nodeId) {
    e.stopPropagation();

    if (mode === 'select') {
      setSelected({ type: 'node', id: nodeId });
    }

    if (mode === 'delete') {
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(ed => ed.from !== nodeId && ed.to !== nodeId));
      setSelected(null);
    }

    if (mode === 'addEdge') {
      if (!edgeFrom) {
        setEdgeFrom(nodeId);
      } else {
        const from = edgeFrom;
        const to   = nodeId;
        if (from !== to && !wouldCycle(edges, from, to)) {
          const exists = edges.some(ed => ed.from === from && ed.to === to);
          if (!exists) {
            setEdges(prev => [...prev, { id: `${from}${to}_${_seq++}`, from, to }]);
          }
        }
        setEdgeFrom(null);
      }
    }
  }

  function handleEdgeClick(e, edgeId) {
    e.stopPropagation();
    if (mode === 'select') {
      setSelected({ type: 'edge', id: edgeId });
    }
    if (mode === 'delete') {
      setEdges(prev => prev.filter(ed => ed.id !== edgeId));
      setSelected(null);
    }
  }

  function confirmNewNode() {
    const label = newLabel.trim();
    if (!label) { setNewNode(null); return; }
    const id = `N${_seq++}`;
    setNodes(prev => [...prev, { id, label, x: newNode.x, y: newNode.y }]);
    setNewNode(null);
    setNewLabel('');
    setMode('select');
  }

  /* ── Mode label ── */
  const modeLabels = {
    select:  'Select / Drag',
    addNode: 'Add Node — click canvas',
    addEdge: edgeFrom
      ? `Add Edge — click target node`
      : 'Add Edge — click source node',
    delete:  'Delete — click node or edge',
  };

  /* ── Ghost line ── */
  const sourceNode = edgeFrom ? nodes.find(n => n.id === edgeFrom) : null;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>

      {/* AppBar */}
      <AppBar position="static" elevation={0} sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #e7e7e7',
        color: PURPLE,
      }}>
        <Toolbar variant="dense" sx={{ minHeight: '50px !important', gap: 1 }}>
          <HubIcon sx={{ color: PURPLE, mr: 0.5 }} />
          <Typography
            component={Link}
            href="/"
            variant="subtitle1"
            sx={{ fontWeight: 700, color: PURPLE, textDecoration: 'none', flexGrow: 1 }}
          >
            Bayesian Networks
          </Typography>
          <Button
            component="a"
            href="https://github.com/marink/probabilistic.net"
            target="_blank"
            rel="noreferrer"
            sx={{ color: '#777', minWidth: 0, p: 0.5 }}
          >
            <GitHubIcon sx={{ fontSize: 20 }} />
          </Button>
        </Toolbar>
      </AppBar>

      {/* Toolbar: controls */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2,
        py: 1,
        bgcolor: '#fff',
        borderBottom: '1px solid #e7e7e7',
      }}>
        {/* Mode buttons */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Select / Drag nodes">
            <Button
              onClick={() => changeMode('select')}
              variant={mode === 'select' ? 'contained' : 'outlined'}
              sx={{
                borderColor: PURPLE,
                color: mode === 'select' ? '#fff' : PURPLE,
                bgcolor: mode === 'select' ? PURPLE : 'transparent',
                '&:hover': { bgcolor: mode === 'select' ? PURPLE_LIGHT : PP },
              }}
              startIcon={<NearMeIcon />}
            >
              Select
            </Button>
          </Tooltip>
          <Tooltip title="Click canvas to add a node">
            <Button
              onClick={() => changeMode('addNode')}
              variant={mode === 'addNode' ? 'contained' : 'outlined'}
              sx={{
                borderColor: PURPLE,
                color: mode === 'addNode' ? '#fff' : PURPLE,
                bgcolor: mode === 'addNode' ? PURPLE : 'transparent',
                '&:hover': { bgcolor: mode === 'addNode' ? PURPLE_LIGHT : PP },
              }}
              startIcon={<AddCircleOutlineIcon />}
            >
              Add Node
            </Button>
          </Tooltip>
          <Tooltip title="Click source then target node">
            <Button
              onClick={() => changeMode('addEdge')}
              variant={mode === 'addEdge' ? 'contained' : 'outlined'}
              sx={{
                borderColor: PURPLE,
                color: mode === 'addEdge' ? '#fff' : PURPLE,
                bgcolor: mode === 'addEdge' ? PURPLE : 'transparent',
                '&:hover': { bgcolor: mode === 'addEdge' ? PURPLE_LIGHT : PP },
              }}
              startIcon={<ArrowForwardIcon />}
            >
              Add Edge
            </Button>
          </Tooltip>
          <Tooltip title="Click a node or edge to delete it">
            <Button
              onClick={() => changeMode('delete')}
              variant={mode === 'delete' ? 'contained' : 'outlined'}
              sx={{
                borderColor: '#d9534f',
                color: mode === 'delete' ? '#fff' : '#d9534f',
                bgcolor: mode === 'delete' ? '#d9534f' : 'transparent',
                '&:hover': { bgcolor: mode === 'delete' ? '#c9302c' : '#fdf2f2' },
              }}
              startIcon={<DeleteOutlineIcon />}
            >
              Delete
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Example loader */}
        <select
          defaultValue=""
          onChange={e => { loadExample(e.target.value); e.target.value = ''; }}
          style={{
            fontSize: 13,
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: 4,
            color: '#555',
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          <option value="" disabled>Load example…</option>
          {Object.keys(EXAMPLES).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {/* Counts */}
        <Chip label={`${nodes.length} nodes`} size="small" sx={{ bgcolor: PP, color: PURPLE, fontWeight: 600 }} />
        <Chip label={`${edges.length} edges`} size="small" sx={{ bgcolor: '#f5f5f5', color: '#555' }} />

        {/* Status */}
        <Typography variant="caption" sx={{ color: '#888', ml: 'auto', fontStyle: 'italic' }}>
          {modeLabels[mode]}
        </Typography>
      </Box>

      {/* SVG canvas */}
      <Box sx={{ flexGrow: 1, p: 1.5, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ width: '100%', height: '100%', borderRadius: 1, overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block', cursor: mode === 'addNode' ? 'crosshair' : mode === 'delete' ? 'not-allowed' : 'default' }}
            onClick={handleSvgClick}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={() => { setMouse(null); setDrag(null); }}
          >
            <defs>
              {/* Purple arrowhead */}
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={PURPLE} />
              </marker>
              {/* Gray arrowhead for ghost */}
              <marker id="arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#aaa" />
              </marker>
              {/* Orange arrowhead for selected edge */}
              <marker id="arr-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#e67e22" />
              </marker>
            </defs>

            {/* Empty canvas hint */}
            {nodes.length === 0 && (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={16}
                fill="#bbb"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                Click &ldquo;Add Node&rdquo; then click the canvas to add your first node
              </text>
            )}

            {/* Ghost edge while drawing */}
            {mode === 'addEdge' && sourceNode && mouse && (
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={mouse.x}
                y2={mouse.y}
                stroke="#aaa"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                markerEnd="url(#arr-g)"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Edges */}
            {edges.map(ed => {
              const from = nodes.find(n => n.id === ed.from);
              const to   = nodes.find(n => n.id === ed.to);
              if (!from || !to) return null;
              const { x1, y1, x2, y2 } = linePts(from, to);
              const isSel = selected?.type === 'edge' && selected.id === ed.id;
              return (
                <line
                  key={ed.id}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isSel ? '#e67e22' : PURPLE}
                  strokeWidth={isSel ? 2.5 : 1.8}
                  markerEnd={isSel ? 'url(#arr-sel)' : 'url(#arr)'}
                  style={{ cursor: mode === 'delete' ? 'pointer' : 'default' }}
                  onClick={e => handleEdgeClick(e, ed.id)}
                >
                  {/* Wider invisible hit area */}
                  <title>{`${ed.from} → ${ed.to}`}</title>
                </line>
              );
            })}

            {/* Invisible wider hit areas for edges */}
            {edges.map(ed => {
              const from = nodes.find(n => n.id === ed.from);
              const to   = nodes.find(n => n.id === ed.to);
              if (!from || !to) return null;
              const { x1, y1, x2, y2 } = linePts(from, to);
              return (
                <line
                  key={`hit-${ed.id}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ cursor: mode === 'delete' ? 'pointer' : 'default' }}
                  onClick={e => handleEdgeClick(e, ed.id)}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const isSel  = selected?.type === 'node' && selected.id === n.id;
              const isSrc  = edgeFrom === n.id;
              const fill   = isSel ? PP : isSrc ? '#e8e0f4' : '#fff';
              const stroke = isSel ? PURPLE : isSrc ? PURPLE_LIGHT : PURPLE;
              const sw     = isSel || isSrc ? 2.5 : 1.8;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{
                    cursor: mode === 'select' ? 'grab' : mode === 'delete' ? 'pointer' : 'pointer',
                  }}
                  onMouseDown={e => handleNodeMouseDown(e, n.id)}
                  onClick={e => handleNodeClick(e, n.id)}
                >
                  <circle
                    r={R}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={n.label.length > 9 ? 9 : 11}
                    fontFamily="Helvetica Neue, Arial, sans-serif"
                    fill={PURPLE}
                    fontWeight={600}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}

            {/* Inline node-name input */}
            {newNode && (
              <foreignObject
                x={newNode.x - 70}
                y={newNode.y - 18}
                width={140}
                height={36}
              >
                <div xmlns="http://www.w3.org/1999/xhtml"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                >
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  confirmNewNode();
                      if (e.key === 'Escape') { setNewNode(null); setNewLabel(''); }
                    }}
                    onBlur={confirmNewNode}
                    placeholder="Node name…"
                    style={{
                      width: '130px',
                      fontSize: 13,
                      padding: '4px 8px',
                      border: `2px solid ${PURPLE}`,
                      borderRadius: 20,
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'Helvetica Neue, Arial, sans-serif',
                      color: PURPLE,
                      background: '#fff',
                    }}
                  />
                </div>
              </foreignObject>
            )}
          </svg>
        </Paper>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{
        borderTop: '1px solid #e5e5e5',
        bgcolor: '#f5f5f5',
        py: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
      }}>
        <Typography variant="caption" color="text.secondary">
          probabilistic.net ·{' '}
          <a
            href="https://marin.kokona.website"
            target="_blank"
            rel="noreferrer"
            style={{ color: PURPLE, textDecoration: 'none' }}
          >
            Marin&apos;s Web Site
          </a>
        </Typography>
      </Box>

    </Box>
  );
}
