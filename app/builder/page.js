"use client";

import { useState, useRef, useEffect, useReducer } from 'react';
import {
  forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide,
} from 'd3-force';
import {
  Box, Typography, Button, ButtonGroup, Tooltip, Chip,
  AppBar, Toolbar, Paper,
} from '@mui/material';
import NearMeIcon       from '@mui/icons-material/NearMe';
import AddCircleIcon    from '@mui/icons-material/AddCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon       from '@mui/icons-material/Delete';
import HubIcon          from '@mui/icons-material/Hub';
import GitHubIcon       from '@mui/icons-material/GitHub';
import Link             from 'next/link';

const PURPLE       = '#563d7c';
const PURPLE_LIGHT = '#6f5499';
const PP           = '#f0ebf8';
const R            = 30;

const EXAMPLES = {
  Sprinkler: {
    nodes: [
      { id: 'C', label: 'Cloudy' },
      { id: 'S', label: 'Sprinkler' },
      { id: 'R', label: 'Rain' },
      { id: 'W', label: 'Wet Grass' },
    ],
    edges: [
      { id: 'CS', from: 'C', to: 'S' }, { id: 'CR', from: 'C', to: 'R' },
      { id: 'SW', from: 'S', to: 'W' }, { id: 'RW', from: 'R', to: 'W' },
    ],
  },
  'Burglary / Alarm': {
    nodes: [
      { id: 'B', label: 'Burglary' },
      { id: 'E', label: 'Earthquake' },
      { id: 'A', label: 'Alarm' },
      { id: 'J', label: 'John Calls' },
      { id: 'M', label: 'Mary Calls' },
    ],
    edges: [
      { id: 'BA', from: 'B', to: 'A' }, { id: 'EA', from: 'E', to: 'A' },
      { id: 'AJ', from: 'A', to: 'J' }, { id: 'AM', from: 'A', to: 'M' },
    ],
  },
  Student: {
    nodes: [
      { id: 'D', label: 'Difficulty' },
      { id: 'I', label: 'Intelligence' },
      { id: 'G', label: 'Grade' },
      { id: 'S', label: 'SAT' },
      { id: 'L', label: 'Letter' },
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

function linePts(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const d  = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return {
    x1: from.x + ux * R,
    y1: from.y + uy * R,
    x2: to.x   - ux * (R + 9),
    y2: to.y   - uy * (R + 9),
  };
}

let _seq = 1;

export default function Builder() {
  // ── Logical graph state ──────────────────────────────────────────────────
  const [nodes, setNodes] = useState(() =>
    EXAMPLES.Sprinkler.nodes.map(({ id, label }) => ({ id, label }))
  );
  const [edges, setEdges] = useState(() =>
    EXAMPLES.Sprinkler.edges.map(e => ({ ...e }))
  );

  // ── UI mode ──────────────────────────────────────────────────────────────
  const [mode,     setMode]     = useState('select');
  const [selected, setSelected] = useState(null);
  const [edgeFrom, setEdgeFrom] = useState(null);
  const [mouse,    setMouse]    = useState(null);
  const [newNode,  setNewNode]  = useState(null);
  const [newLabel, setNewLabel] = useState('');

  // ── Force simulation ─────────────────────────────────────────────────────
  const svgRef      = useRef(null);
  const simRef      = useRef(null);
  // Mutable d3 node objects — positions updated in-place by simulation
  const simNodesRef = useRef(
    EXAMPLES.Sprinkler.nodes.map((n, i) => ({
      id: n.id, label: n.label,
      // small ring spread so nodes don't all start exactly at the same point
      x: 400 + Math.cos((i / EXAMPLES.Sprinkler.nodes.length) * 2 * Math.PI) * 40,
      y: 300 + Math.sin((i / EXAMPLES.Sprinkler.nodes.length) * 2 * Math.PI) * 40,
    }))
  );
  const dragRef     = useRef(null); // { id } while pointer is held down
  const didDragRef  = useRef(false);
  const [, rerender] = useReducer(x => x + 1, 0);

  // Restart simulation whenever the logical graph changes
  useEffect(() => {
    const svgEl = svgRef.current;
    const W = svgEl ? svgEl.clientWidth  : 800;
    const H = svgEl ? svgEl.clientHeight : 500;

    // Preserve existing positions; seed new nodes near center
    const byId = Object.fromEntries(simNodesRef.current.map(n => [n.id, n]));
    simNodesRef.current = nodes.map(n =>
      byId[n.id]
        ? { ...byId[n.id], label: n.label }
        : {
            id: n.id, label: n.label,
            x: W / 2 + (Math.random() - 0.5) * 80,
            y: H / 2 + (Math.random() - 0.5) * 80,
          }
    );

    const simEdges = edges.map(e => ({ source: e.from, target: e.to, _id: e.id }));

    if (simRef.current) simRef.current.stop();

    const sim = forceSimulation(simNodesRef.current)
      .force('charge',  forceManyBody().strength(-380))
      .force('link',    forceLink(simEdges).id(d => d.id).distance(130).strength(0.5))
      .force('center',  forceCenter(W / 2, H / 2).strength(0.04))
      .force('collide', forceCollide(R + 14))
      .alphaDecay(0.025)
      .on('tick', () => rerender());

    simRef.current = sim;
    return () => sim.stop();
  }, [nodes, edges]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────
  function pt(e) {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function changeMode(m) {
    setMode(m); setSelected(null); setEdgeFrom(null);
    setNewNode(null); setNewLabel(''); setMouse(null);
    dragRef.current = null; didDragRef.current = false;
  }

  function loadExample(name) {
    if (!name) return;
    const ex = EXAMPLES[name];
    // Seed on a small ring so they burst outward organically
    simNodesRef.current = ex.nodes.map((n, i) => ({
      id: n.id, label: n.label,
      x: 400 + Math.cos((i / ex.nodes.length) * 2 * Math.PI) * 30,
      y: 300 + Math.sin((i / ex.nodes.length) * 2 * Math.PI) * 30,
    }));
    setNodes(ex.nodes.map(({ id, label }) => ({ id, label })));
    setEdges(ex.edges.map(e => ({ ...e })));
    setSelected(null); setEdgeFrom(null); setNewNode(null); setNewLabel('');
    setMode('select');
  }

  // ── Pointer events (SVG level) ──────────────────────────────────────────
  function handleSvgPointerMove(e) {
    const p = pt(e);
    setMouse(p);
    if (dragRef.current) {
      const n = simNodesRef.current.find(n => n.id === dragRef.current.id);
      if (n) {
        const moved = Math.hypot(p.x - (n.fx ?? n.x), p.y - (n.fy ?? n.y));
        if (moved > 3) didDragRef.current = true;
        n.fx = p.x;
        n.fy = p.y;
      }
      simRef.current?.alpha(0.3).restart();
    }
  }

  function handleSvgPointerUp() {
    if (dragRef.current) {
      const n = simNodesRef.current.find(n => n.id === dragRef.current.id);
      if (n) { n.fx = null; n.fy = null; }
      simRef.current?.alphaTarget(0).restart();
      dragRef.current = null;
    }
  }

  function handleSvgClick(e) {
    const tag = e.target.tagName.toLowerCase();
    const onCanvas = tag === 'svg' || tag === 'rect' || tag === 'line';

    if (mode === 'addNode' && onCanvas) {
      setNewNode(pt(e));
      setNewLabel('');
    }
    if (mode === 'addEdge' && edgeFrom && onCanvas) {
      setEdgeFrom(null);
    }
    if (mode === 'select' && onCanvas) {
      setSelected(null);
    }
  }

  // ── Node events ──────────────────────────────────────────────────────────
  function handleNodePointerDown(e, nodeId) {
    e.stopPropagation();
    if (mode !== 'select') return;
    dragRef.current = { id: nodeId };
    didDragRef.current = false;
    // Capture so we keep getting events if pointer leaves SVG
    try { svgRef.current.setPointerCapture(e.pointerId); } catch {}
    const n = simNodesRef.current.find(n => n.id === nodeId);
    if (n) { n.fx = n.x; n.fy = n.y; }
    simRef.current?.alphaTarget(0.3).restart();
  }

  function handleNodeClick(e, nodeId) {
    e.stopPropagation();
    if (didDragRef.current) { didDragRef.current = false; return; }

    if (mode === 'select') {
      setSelected({ type: 'node', id: nodeId });
    }
    if (mode === 'delete') {
      simNodesRef.current = simNodesRef.current.filter(n => n.id !== nodeId);
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(ed => ed.from !== nodeId && ed.to !== nodeId));
      setSelected(null);
    }
    if (mode === 'addEdge') {
      if (!edgeFrom) {
        setEdgeFrom(nodeId);
      } else {
        const from = edgeFrom, to = nodeId;
        if (from !== to && !wouldCycle(edges, from, to)) {
          const dup = edges.some(ed => ed.from === from && ed.to === to);
          if (!dup) setEdges(prev => [...prev, { id: `${from}${to}_${_seq++}`, from, to }]);
        }
        setEdgeFrom(null);
      }
    }
  }

  // ── Edge events ──────────────────────────────────────────────────────────
  function handleEdgeClick(e, edgeId) {
    e.stopPropagation();
    if (mode === 'select') setSelected({ type: 'edge', id: edgeId });
    if (mode === 'delete') {
      setEdges(prev => prev.filter(ed => ed.id !== edgeId));
      setSelected(null);
    }
  }

  // ── Add-node confirmation ────────────────────────────────────────────────
  function confirmNewNode() {
    const label = newLabel.trim();
    if (label) {
      const id = `N${_seq++}`;
      // Pre-seed position so it appears at the click point before simulation takes over
      simNodesRef.current.push({ id, label, x: newNode.x, y: newNode.y });
      setNodes(prev => [...prev, { id, label }]);
    }
    setNewNode(null);
    setNewLabel('');
    setMode('select');
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const simById    = Object.fromEntries(simNodesRef.current.map(n => [n.id, n]));
  const sourceNode = edgeFrom ? simById[edgeFrom] : null;

  const modeLabels = {
    select:  'Select / Drag',
    addNode: 'Add Node — click canvas',
    addEdge: edgeFrom ? 'Add Edge — click target node' : 'Add Edge — click source node',
    delete:  'Delete — click node or edge',
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>

      {/* AppBar */}
      <AppBar position="static" elevation={0} sx={{
        bgcolor: '#fff', borderBottom: '1px solid #e7e7e7', color: PURPLE,
      }}>
        <Toolbar variant="dense" sx={{ minHeight: '50px !important', gap: 1 }}>
          <HubIcon sx={{ color: PURPLE, mr: 0.5 }} />
          <Typography component={Link} href="/" variant="subtitle1"
            sx={{ fontWeight: 700, color: PURPLE, textDecoration: 'none', flexGrow: 1 }}>
            Bayesian Networks
          </Typography>
          <Button component="a" href="https://github.com/marink/probabilistic.net"
            target="_blank" rel="noreferrer"
            sx={{ color: '#777', minWidth: 0, p: 0.5 }}>
            <GitHubIcon sx={{ fontSize: 20 }} />
          </Button>
        </Toolbar>
      </AppBar>

      {/* Controls toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: 1.5, px: 2, py: 1,
        bgcolor: '#fff', borderBottom: '1px solid #e7e7e7',
      }}>
        <ButtonGroup size="small" variant="outlined">
          {[
            { key: 'select',  label: 'Select',   icon: <NearMeIcon />,       tip: 'Select / drag nodes' },
            { key: 'addNode', label: 'Add Node',  icon: <AddCircleIcon />,    tip: 'Click canvas to place a node' },
            { key: 'addEdge', label: 'Add Edge',  icon: <ArrowForwardIcon />, tip: 'Click source, then target' },
          ].map(({ key, label, icon, tip }) => (
            <Tooltip key={key} title={tip}>
              <Button onClick={() => changeMode(key)}
                variant={mode === key ? 'contained' : 'outlined'}
                startIcon={icon}
                sx={{
                  borderColor: PURPLE,
                  color: mode === key ? '#fff' : PURPLE,
                  bgcolor: mode === key ? PURPLE : 'transparent',
                  '&:hover': { bgcolor: mode === key ? PURPLE_LIGHT : PP },
                }}>
                {label}
              </Button>
            </Tooltip>
          ))}
          <Tooltip title="Click a node or edge to remove it">
            <Button onClick={() => changeMode('delete')}
              variant={mode === 'delete' ? 'contained' : 'outlined'}
              startIcon={<DeleteIcon />}
              sx={{
                borderColor: '#d9534f',
                color: mode === 'delete' ? '#fff' : '#d9534f',
                bgcolor: mode === 'delete' ? '#d9534f' : 'transparent',
                '&:hover': { bgcolor: mode === 'delete' ? '#c9302c' : '#fdf2f2' },
              }}>
              Delete
            </Button>
          </Tooltip>
        </ButtonGroup>

        <select defaultValue="" onChange={e => { loadExample(e.target.value); e.target.value = ''; }}
          style={{
            fontSize: 13, padding: '4px 8px',
            border: '1px solid #ccc', borderRadius: 4,
            color: '#555', cursor: 'pointer', background: '#fff',
          }}>
          <option value="" disabled>Load example…</option>
          {Object.keys(EXAMPLES).map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <Chip label={`${nodes.length} nodes`} size="small"
          sx={{ bgcolor: PP, color: PURPLE, fontWeight: 600 }} />
        <Chip label={`${edges.length} edges`} size="small"
          sx={{ bgcolor: '#f5f5f5', color: '#555' }} />

        <Typography variant="caption" sx={{ color: '#888', ml: 'auto', fontStyle: 'italic' }}>
          {modeLabels[mode]}
        </Typography>
      </Box>

      {/* SVG canvas */}
      <Box sx={{ flexGrow: 1, p: 1.5, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ width: '100%', height: '100%', borderRadius: 1, overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            width="100%" height="100%"
            style={{
              display: 'block',
              cursor: mode === 'addNode' ? 'crosshair' : mode === 'delete' ? 'not-allowed' : 'default',
            }}
            onClick={handleSvgClick}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerLeave={handleSvgPointerUp}
          >
            <defs>
              <marker id="arr"     markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={PURPLE} />
              </marker>
              <marker id="arr-g"   markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#aaa" />
              </marker>
              <marker id="arr-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#e67e22" />
              </marker>
            </defs>

            {/* Empty-canvas hint */}
            {nodes.length === 0 && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                fontSize={16} fill="#bbb"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                Switch to Add Node, then click here to start
              </text>
            )}

            {/* Ghost edge while drawing */}
            {mode === 'addEdge' && sourceNode && mouse && (
              <line
                x1={sourceNode.x} y1={sourceNode.y} x2={mouse.x} y2={mouse.y}
                stroke="#aaa" strokeWidth={1.5} strokeDasharray="6 4"
                markerEnd="url(#arr-g)"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Edges */}
            {edges.map(ed => {
              const from = simById[ed.from], to = simById[ed.to];
              if (!from || !to || from.x == null || to.x == null) return null;
              const { x1, y1, x2, y2 } = linePts(from, to);
              const isSel = selected?.type === 'edge' && selected.id === ed.id;
              return (
                <g key={ed.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isSel ? '#e67e22' : PURPLE}
                    strokeWidth={isSel ? 2.5 : 1.8}
                    markerEnd={isSel ? 'url(#arr-sel)' : 'url(#arr)'}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Wider invisible hit area */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="transparent" strokeWidth={12}
                    style={{ cursor: mode === 'delete' ? 'pointer' : 'default' }}
                    onClick={e => handleEdgeClick(e, ed.id)}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {simNodesRef.current.map(n => {
              if (n.x == null) return null;
              const isSel = selected?.type === 'node' && selected.id === n.id;
              const isSrc = edgeFrom === n.id;
              const fill   = isSel ? PP : isSrc ? '#e8e0f4' : '#fff';
              const stroke = isSel || isSrc ? PURPLE_LIGHT : PURPLE;
              const sw     = isSel || isSrc ? 2.5 : 1.8;
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}
                  style={{
                    cursor: mode === 'select'
                      ? (dragRef.current?.id === n.id ? 'grabbing' : 'grab')
                      : 'pointer',
                  }}
                  onPointerDown={e => handleNodePointerDown(e, n.id)}
                  onClick={e => handleNodeClick(e, n.id)}
                >
                  <circle r={R} fill={fill} stroke={stroke} strokeWidth={sw} />
                  <text textAnchor="middle" dominantBaseline="middle"
                    fontSize={n.label.length > 10 ? 9 : 11}
                    fontFamily="Helvetica Neue, Arial, sans-serif"
                    fill={PURPLE} fontWeight={600}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label}
                  </text>
                </g>
              );
            })}

            {/* Inline node-name input */}
            {newNode && (
              <foreignObject x={newNode.x - 70} y={newNode.y - 18} width={140} height={36}>
                <div xmlns="http://www.w3.org/1999/xhtml"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
                      width: 130, fontSize: 13, padding: '4px 8px',
                      border: `2px solid ${PURPLE}`, borderRadius: 20,
                      outline: 'none', textAlign: 'center',
                      fontFamily: 'Helvetica Neue, Arial, sans-serif',
                      color: PURPLE, background: '#fff',
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
        borderTop: '1px solid #e5e5e5', bgcolor: '#f5f5f5',
        py: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography variant="caption" color="text.secondary">
          probabilistic.net ·{' '}
          <a href="https://marin.kokona.website" target="_blank" rel="noreferrer"
            style={{ color: PURPLE, textDecoration: 'none' }}>
            Marin&apos;s Web Site
          </a>
        </Typography>
      </Box>
    </Box>
  );
}
