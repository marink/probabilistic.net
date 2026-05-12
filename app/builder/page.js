"use client";

import { useState, useRef, useEffect, useReducer } from 'react';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import {
  Box, Typography, Button, ButtonGroup, Tooltip, Chip,
  AppBar, Toolbar as MuiToolbar, Paper, Slider, Divider,
} from '@mui/material';
import NearMeIcon       from '@mui/icons-material/NearMe';
import AddCircleIcon    from '@mui/icons-material/AddCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon       from '@mui/icons-material/Delete';
import PlayArrowIcon    from '@mui/icons-material/PlayArrow';
import HubIcon          from '@mui/icons-material/Hub';
import GitHubIcon       from '@mui/icons-material/GitHub';
import Link             from 'next/link';

// ── Constants ─────────────────────────────────────────────────────────────────
const PURPLE       = '#563d7c';
const PURPLE_LIGHT = '#6f5499';
const PP           = '#f0ebf8';
const GREEN        = '#2e7d32';
const GREEN_L      = '#e8f5e9';
const RED          = '#c62828';
const RED_L        = '#ffebee';
const R            = 30;

// ── CPT helpers ───────────────────────────────────────────────────────────────

function getParents(nodeId, edges) {
  return edges.filter(e => e.to === nodeId).map(e => e.from);
}

function parentCombos(parentIds) {
  return Array.from({ length: 1 << parentIds.length }, (_, mask) =>
    Object.fromEntries(parentIds.map((id, i) => [id, !!((mask >> i) & 1)]))
  );
}

function cptKey(assignment, parentIds) {
  return parentIds.map(id => assignment[id] ? '1' : '0').join('');
}

function buildDefaultCpt(nodeId, edges) {
  const parents = getParents(nodeId, edges);
  return Object.fromEntries(parentCombos(parents).map(c => [cptKey(c, parents), 0.5]));
}

// ── Exact inference (brute-force enumeration over joint) ──────────────────────

function jointProb(assignment, cpts, edges, nodes) {
  let p = 1;
  for (const node of nodes) {
    const parents = getParents(node.id, edges);
    const key = cptKey(assignment, parents);
    const prob = cpts[node.id]?.[key] ?? 0.5;
    p *= assignment[node.id] ? prob : 1 - prob;
  }
  return p;
}

function runInference(nodes, edges, cpts, evidence) {
  const freeIds = nodes.map(n => n.id).filter(id => !(id in evidence));
  const results = Object.fromEntries(
    Object.entries(evidence).map(([id, v]) => [id, v ? 1 : 0])
  );
  for (const queryId of freeIds) {
    const hiddenIds = freeIds.filter(id => id !== queryId);
    let num = 0, den = 0;
    for (let mask = 0; mask < (1 << hiddenIds.length); mask++) {
      const a = { ...evidence };
      hiddenIds.forEach((id, i) => { a[id] = !!((mask >> i) & 1); });
      a[queryId] = true;  const pT = jointProb(a, cpts, edges, nodes);
      a[queryId] = false; const pF = jointProb(a, cpts, edges, nodes);
      num += pT; den += pT + pF;
    }
    results[queryId] = den > 0 ? num / den : 0.5;
  }
  return results;
}

// ── Examples with real CPTs ───────────────────────────────────────────────────

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
    // parents: S←[C], R←[C], W←[S,R]
    cpts: {
      C: { '': 0.5 },
      S: { '0': 0.5,  '1': 0.1  },
      R: { '0': 0.2,  '1': 0.8  },
      W: { '00': 0.01, '10': 0.9, '01': 0.9, '11': 0.99 },
    },
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
    // parents: A←[B,E], J←[A], M←[A]
    cpts: {
      B: { '': 0.001 },
      E: { '': 0.002 },
      A: { '00': 0.001, '10': 0.94, '01': 0.29, '11': 0.95 },
      J: { '0': 0.05,  '1': 0.90 },
      M: { '0': 0.01,  '1': 0.70 },
    },
  },
  Student: {
    nodes: [
      { id: 'D', label: 'Difficulty' },
      { id: 'I', label: 'Intelligence' },
      { id: 'G', label: 'Grade (A)' },
      { id: 'S', label: 'SAT' },
      { id: 'L', label: 'Letter' },
    ],
    edges: [
      { id: 'DG', from: 'D', to: 'G' }, { id: 'IG', from: 'I', to: 'G' },
      { id: 'IS', from: 'I', to: 'S' }, { id: 'GL', from: 'G', to: 'L' },
    ],
    // parents: G←[D,I], S←[I], L←[G]
    cpts: {
      D: { '': 0.4  },
      I: { '': 0.3  },
      G: { '00': 0.3, '10': 0.05, '01': 0.9, '11': 0.5 },
      S: { '0': 0.2,  '1': 0.95 },
      L: { '0': 0.1,  '1': 0.9  },
    },
  },
};

// ── Geometry helpers ──────────────────────────────────────────────────────────

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
  const d = Math.hypot(dx, dy) || 1;
  return {
    x1: from.x + (dx / d) * R,
    y1: from.y + (dy / d) * R,
    x2: to.x   - (dx / d) * (R + 9),
    y2: to.y   - (dy / d) * (R + 9),
  };
}

// ── Probability color helper ─────────────────────────────────────────────────

function probColor(p) {
  if (p >= 0.65) return '#2e7d32';
  if (p <= 0.35) return '#c62828';
  return '#e65100';
}

// ── CPT Panel ─────────────────────────────────────────────────────────────────

function CptPanel({ nodeId, nodes, edges, cpts, evidence, onCptChange, onEvidenceChange }) {
  const node     = nodes.find(n => n.id === nodeId);
  const parents  = getParents(nodeId, edges);
  const combos   = parentCombos(parents);
  const nodeCpt  = cpts[nodeId] ?? {};
  const ev       = nodeId in evidence ? (evidence[nodeId] ? 'true' : 'false') : 'none';

  if (!node) return null;

  return (
    <Box sx={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #e0e0e0', bgcolor: '#fafafa', overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1, bgcolor: PURPLE, color: '#fff' }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{node.label}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.75 }}>
          {parents.length === 0 ? 'Root node (prior)' : `Parents: ${parents.map(p => nodes.find(n => n.id === p)?.label ?? p).join(', ')}`}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1.5 }}>

        {/* Evidence */}
        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
          OBSERVE AS
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
          {[
            { val: 'none',  label: '—',     color: '#9e9e9e' },
            { val: 'true',  label: 'True',  color: GREEN },
            { val: 'false', label: 'False', color: RED },
          ].map(opt => (
            <Button key={opt.val} size="small"
              variant={ev === opt.val ? 'contained' : 'outlined'}
              onClick={() => onEvidenceChange(nodeId, opt.val)}
              sx={{
                flex: 1, fontSize: 11, py: 0.25,
                borderColor: opt.color,
                color: ev === opt.val ? '#fff' : opt.color,
                bgcolor: ev === opt.val ? opt.color : 'transparent',
                '&:hover': { bgcolor: ev === opt.val ? opt.color : `${opt.color}18` },
                minWidth: 0,
              }}>
              {opt.label}
            </Button>
          ))}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* CPT */}
        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
          P({node.label} = True{parents.length > 0 ? ' | …' : ''})
        </Typography>

        {combos.map(combo => {
          const key = cptKey(combo, parents);
          const val = nodeCpt[key] ?? 0.5;
          const condLabel = parents.length === 0
            ? null
            : parents.map(pId => {
                const pLabel = nodes.find(n => n.id === pId)?.label ?? pId;
                return `${pLabel} = ${combo[pId] ? 'T' : 'F'}`;
              }).join(', ');

          return (
            <Box key={key} sx={{ mb: 1.5 }}>
              {condLabel && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.3, mb: 0.25 }}>
                  {condLabel}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Slider
                  value={val}
                  min={0} max={1} step={0.01}
                  size="small"
                  sx={{ color: PURPLE, flexGrow: 1, py: '6px' }}
                  onChange={(_, v) => onCptChange(nodeId, key, v)}
                />
                <Typography
                  variant="caption"
                  sx={{ minWidth: 30, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: probColor(val) }}>
                  {val.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

let _seq = 1;

export default function Builder() {
  const initEx = EXAMPLES.Sprinkler;

  // ── Graph state ──
  const [nodes,    setNodes]    = useState(() => initEx.nodes.map(n => ({ ...n })));
  const [edges,    setEdges]    = useState(() => initEx.edges.map(e => ({ ...e })));
  const [cpts,     setCpts]     = useState(initEx.cpts);
  const [evidence, setEvidence] = useState({});
  const [results,  setResults]  = useState(null);  // { [nodeId]: number }

  // ── UI state ──
  const [mode,          setMode]          = useState('select');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [edgeFrom,      setEdgeFrom]      = useState(null);
  const [mouse,         setMouse]         = useState(null);
  const [newNode,       setNewNode]        = useState(null);
  const [newLabel,      setNewLabel]       = useState('');
  const [inferring,     setInferring]      = useState(false);

  // ── Force simulation ──
  const svgRef      = useRef(null);
  const simRef      = useRef(null);
  const simNodesRef = useRef(
    initEx.nodes.map((n, i) => ({
      id: n.id, label: n.label,
      x: 380 + Math.cos((i / initEx.nodes.length) * 2 * Math.PI) * 40,
      y: 280 + Math.sin((i / initEx.nodes.length) * 2 * Math.PI) * 40,
    }))
  );
  const dragRef    = useRef(null);
  const didDragRef = useRef(false);
  const [, rerender] = useReducer(x => x + 1, 0);

  // ── Keep CPTs in sync when edges change ──────────────────────────────────
  useEffect(() => {
    setCpts(prev => {
      const next = { ...prev };
      for (const node of nodes) {
        const parents   = getParents(node.id, edges);
        const wantedKeys = new Set(parentCombos(parents).map(c => cptKey(c, parents)));
        const existing   = prev[node.id] ?? {};
        const gotKeys    = new Set(Object.keys(existing));
        const changed    = [...wantedKeys].some(k => !gotKeys.has(k))
                        || [...gotKeys].some(k => !wantedKeys.has(k));
        if (changed || gotKeys.size === 0) {
          next[node.id] = Object.fromEntries(
            [...wantedKeys].map(k => [k, existing[k] ?? 0.5])
          );
        }
      }
      return next;
    });
  }, [nodes, edges]);

  // ── Auto re-run inference when CPT or evidence changes ───────────────────
  useEffect(() => {
    if (results === null) return;
    setResults(runInference(nodes, edges, cpts, evidence));
  }, [cpts, evidence]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Force simulation ─────────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    const W = svgEl?.clientWidth  ?? 700;
    const H = svgEl?.clientHeight ?? 500;

    const byId = Object.fromEntries(simNodesRef.current.map(n => [n.id, n]));
    simNodesRef.current = nodes.map(n =>
      byId[n.id]
        ? { ...byId[n.id], label: n.label }
        : { id: n.id, label: n.label,
            x: W / 2 + (Math.random() - 0.5) * 80,
            y: H / 2 + (Math.random() - 0.5) * 80 }
    );

    if (simRef.current) simRef.current.stop();
    const sim = forceSimulation(simNodesRef.current)
      .force('charge',  forceManyBody().strength(-380))
      .force('link',    forceLink(edges.map(e => ({ source: e.from, target: e.to }))).id(d => d.id).distance(130).strength(0.5))
      .force('center',  forceCenter(W / 2, H / 2).strength(0.04))
      .force('collide', forceCollide(R + 14))
      .alphaDecay(0.025)
      .on('tick', () => rerender());
    simRef.current = sim;
    return () => sim.stop();
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────
  function pt(e) {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function changeMode(m) {
    setMode(m); setEdgeFrom(null); setNewNode(null); setNewLabel(''); setMouse(null);
    dragRef.current = null; didDragRef.current = false;
  }

  function loadExample(name) {
    if (!name) return;
    const ex = EXAMPLES[name];
    simNodesRef.current = ex.nodes.map((n, i) => ({
      id: n.id, label: n.label,
      x: 380 + Math.cos((i / ex.nodes.length) * 2 * Math.PI) * 30,
      y: 280 + Math.sin((i / ex.nodes.length) * 2 * Math.PI) * 30,
    }));
    setNodes(ex.nodes.map(n => ({ ...n })));
    setEdges(ex.edges.map(e => ({ ...e })));
    setCpts(ex.cpts);
    setEvidence({});
    setResults(null);
    setSelectedNodeId(null);
    setEdgeFrom(null); setNewNode(null); setNewLabel('');
    setMode('select');
  }

  function doInference() {
    setInferring(true);
    setTimeout(() => {
      setResults(runInference(nodes, edges, cpts, evidence));
      setInferring(false);
    }, 80);
  }

  function handleCptChange(nodeId, key, value) {
    setCpts(prev => ({ ...prev, [nodeId]: { ...prev[nodeId], [key]: value } }));
  }

  function handleEvidenceChange(nodeId, val) {
    setEvidence(prev => {
      const next = { ...prev };
      if (val === 'none') delete next[nodeId];
      else next[nodeId] = val === 'true';
      return next;
    });
  }

  // ── SVG pointer events ───────────────────────────────────────────────────
  function handleSvgPointerMove(e) {
    setMouse(pt(e));
    if (dragRef.current) {
      const p = pt(e);
      const n = simNodesRef.current.find(n => n.id === dragRef.current.id);
      if (n) {
        if (Math.hypot(p.x - (n.fx ?? n.x), p.y - (n.fy ?? n.y)) > 3) didDragRef.current = true;
        n.fx = p.x; n.fy = p.y;
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
    if (mode === 'addNode' && onCanvas) { setNewNode(pt(e)); setNewLabel(''); }
    if (mode === 'addEdge' && edgeFrom && onCanvas) setEdgeFrom(null);
    if (mode === 'select' && onCanvas) setSelectedNodeId(null);
  }

  // ── Node events ──────────────────────────────────────────────────────────
  function handleNodePointerDown(e, nodeId) {
    e.stopPropagation();
    if (mode !== 'select') return;
    dragRef.current = { id: nodeId };
    didDragRef.current = false;
    // Note: do NOT call setPointerCapture here — it re-routes the synthetic click
    // event to the SVG element, bypassing handleNodeClick and breaking CPT panel.
    // onPointerMove/Up on the SVG parent already handle drag correctly.
    const n = simNodesRef.current.find(n => n.id === nodeId);
    if (n) { n.fx = n.x; n.fy = n.y; }
    simRef.current?.alphaTarget(0.3).restart();
  }

  function handleNodeClick(e, nodeId) {
    e.stopPropagation();
    if (didDragRef.current) { didDragRef.current = false; return; }

    if (mode === 'select') {
      setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    }
    if (mode === 'delete') {
      simNodesRef.current = simNodesRef.current.filter(n => n.id !== nodeId);
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(ed => ed.from !== nodeId && ed.to !== nodeId));
      setCpts(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      setEvidence(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      setResults(null);
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

  function handleEdgeClick(e, edgeId) {
    e.stopPropagation();
    if (mode === 'delete') {
      setEdges(prev => prev.filter(ed => ed.id !== edgeId));
      setResults(null);
    }
  }

  function confirmNewNode() {
    const label = newLabel.trim();
    if (label) {
      const id = `N${_seq++}`;
      simNodesRef.current.push({ id, label, x: newNode.x, y: newNode.y });
      setNodes(prev => [...prev, { id, label }]);
    }
    setNewNode(null); setNewLabel(''); setMode('select');
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const simById    = Object.fromEntries(simNodesRef.current.map(n => [n.id, n]));
  const sourceNode = edgeFrom ? simById[edgeFrom] : null;
  const modeLabels = {
    select:  'Select / Drag',
    addNode: 'Add Node — click canvas',
    addEdge: edgeFrom ? 'Add Edge — click target' : 'Add Edge — click source',
    delete:  'Delete — click node or edge',
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>

      {/* AppBar */}
      <AppBar position="static" elevation={0}
        sx={{ bgcolor: '#fff', borderBottom: '1px solid #e7e7e7', color: PURPLE }}>
        <MuiToolbar variant="dense" sx={{ minHeight: '50px !important', gap: 1 }}>
          <HubIcon sx={{ color: PURPLE, mr: 0.5 }} />
          <Typography component={Link} href="/" variant="subtitle1"
            sx={{ fontWeight: 700, color: PURPLE, textDecoration: 'none', flexGrow: 1 }}>
            Bayesian Networks
          </Typography>
          <Button component="a" href="https://github.com/marink/probabilistic.net"
            target="_blank" rel="noreferrer" sx={{ color: '#777', minWidth: 0, p: 0.5 }}>
            <GitHubIcon sx={{ fontSize: 20 }} />
          </Button>
        </MuiToolbar>
      </AppBar>

      {/* Toolbar */}
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
                  borderColor: PURPLE, color: mode === key ? '#fff' : PURPLE,
                  bgcolor: mode === key ? PURPLE : 'transparent',
                  '&:hover': { bgcolor: mode === key ? PURPLE_LIGHT : PP },
                }}>
                {label}
              </Button>
            </Tooltip>
          ))}
          <Tooltip title="Click node or edge to remove">
            <Button onClick={() => changeMode('delete')}
              variant={mode === 'delete' ? 'contained' : 'outlined'}
              startIcon={<DeleteIcon />}
              sx={{
                borderColor: '#d9534f', color: mode === 'delete' ? '#fff' : '#d9534f',
                bgcolor: mode === 'delete' ? '#d9534f' : 'transparent',
                '&:hover': { bgcolor: mode === 'delete' ? '#c9302c' : '#fdf2f2' },
              }}>
              Delete
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Example loader */}
        <select defaultValue="" onChange={e => { loadExample(e.target.value); e.target.value = ''; }}
          style={{
            fontSize: 13, padding: '4px 8px',
            border: '1px solid #ccc', borderRadius: 4,
            color: '#555', cursor: 'pointer', background: '#fff',
          }}>
          <option value="" disabled>Load example…</option>
          {Object.keys(EXAMPLES).map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <Chip label={`${nodes.length} nodes`} size="small" sx={{ bgcolor: PP, color: PURPLE, fontWeight: 600 }} />
        <Chip label={`${edges.length} edges`} size="small" sx={{ bgcolor: '#f5f5f5', color: '#555' }} />

        {/* Run Inference */}
        <Button
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={doInference}
          disabled={inferring || nodes.length === 0}
          sx={{
            ml: 'auto',
            bgcolor: '#00695C', '&:hover': { bgcolor: '#004D40' },
            '&:disabled': { bgcolor: '#e0e0e0' },
          }}>
          {inferring ? 'Running…' : 'Run Inference'}
        </Button>

        <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic', display: { xs: 'none', sm: 'block' } }}>
          {modeLabels[mode]}
        </Typography>
      </Box>

      {/* Canvas + CPT panel */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>

        {/* SVG Canvas */}
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
                <marker id="arr"     markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={PURPLE} /></marker>
                <marker id="arr-g"   markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#aaa" /></marker>
                <marker id="arr-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#e67e22" /></marker>
              </defs>

              {nodes.length === 0 && (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                  fontSize={16} fill="#bbb" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  Switch to Add Node, then click here to start
                </text>
              )}

              {/* Ghost edge */}
              {mode === 'addEdge' && sourceNode && mouse && (
                <line x1={sourceNode.x} y1={sourceNode.y} x2={mouse.x} y2={mouse.y}
                  stroke="#aaa" strokeWidth={1.5} strokeDasharray="6 4" markerEnd="url(#arr-g)"
                  style={{ pointerEvents: 'none' }} />
              )}

              {/* Edges */}
              {edges.map(ed => {
                const from = simById[ed.from], to = simById[ed.to];
                if (!from || !to || from.x == null || to.x == null) return null;
                const { x1, y1, x2, y2 } = linePts(from, to);
                return (
                  <g key={ed.id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={PURPLE} strokeWidth={1.8} markerEnd="url(#arr)"
                      style={{ pointerEvents: 'none' }} />
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="transparent" strokeWidth={12}
                      style={{ cursor: mode === 'delete' ? 'pointer' : 'default' }}
                      onClick={e => handleEdgeClick(e, ed.id)} />
                  </g>
                );
              })}

              {/* Nodes */}
              {simNodesRef.current.map(n => {
                if (n.x == null) return null;
                const isSel  = selectedNodeId === n.id;
                const isSrc  = edgeFrom === n.id;
                const hasEvT = evidence[n.id] === true;
                const hasEvF = evidence[n.id] === false;
                const prob   = results?.[n.id];

                const fill   = hasEvT ? GREEN_L : hasEvF ? RED_L : isSel ? PP : '#fff';
                const stroke = hasEvT ? GREEN   : hasEvF ? RED   : isSel || isSrc ? PURPLE_LIGHT : PURPLE;
                const sw     = isSel || isSrc || hasEvT || hasEvF ? 2.5 : 1.8;

                return (
                  <g key={n.id} transform={`translate(${n.x},${n.y})`}
                    style={{ cursor: mode === 'select' ? (dragRef.current?.id === n.id ? 'grabbing' : 'grab') : 'pointer' }}
                    onPointerDown={e => handleNodePointerDown(e, n.id)}
                    onClick={e => handleNodeClick(e, n.id)}>

                    <circle r={R} fill={fill} stroke={stroke} strokeWidth={sw} />

                    {/* Label */}
                    <text textAnchor="middle" dominantBaseline="middle"
                      y={prob != null ? -6 : 0}
                      fontSize={n.label.length > 10 ? 9 : 11}
                      fontFamily="Helvetica Neue, Arial, sans-serif"
                      fill={PURPLE} fontWeight={600}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label}
                    </text>

                    {/* Inference probability badge */}
                    {prob != null && (
                      <text textAnchor="middle" y={8}
                        fontSize={10} fontWeight={700}
                        fontFamily="Helvetica Neue, Arial, sans-serif"
                        fill={probColor(prob)}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {(prob * 100).toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Inline node-name input */}
              {newNode && (
                <foreignObject x={newNode.x - 70} y={newNode.y - 18} width={140} height={36}>
                  <div xmlns="http://www.w3.org/1999/xhtml"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <input autoFocus value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmNewNode(); if (e.key === 'Escape') { setNewNode(null); setNewLabel(''); } }}
                      onBlur={confirmNewNode}
                      placeholder="Node name…"
                      style={{ width: 130, fontSize: 13, padding: '4px 8px', border: `2px solid ${PURPLE}`, borderRadius: 20, outline: 'none', textAlign: 'center', fontFamily: 'Helvetica Neue, Arial, sans-serif', color: PURPLE, background: '#fff' }}
                    />
                  </div>
                </foreignObject>
              )}
            </svg>
          </Paper>
        </Box>

        {/* CPT Panel */}
        {selectedNodeId && (
          <CptPanel
            nodeId={selectedNodeId}
            nodes={nodes}
            edges={edges}
            cpts={cpts}
            evidence={evidence}
            onCptChange={handleCptChange}
            onEvidenceChange={handleEvidenceChange}
          />
        )}
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{
        borderTop: '1px solid #e5e5e5', bgcolor: '#f5f5f5',
        py: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography variant="caption" color="text.secondary">
          {results
            ? `Inference complete — click a node to edit its CPT`
            : 'Click a node to edit its CPT, then hit Run Inference'}
        </Typography>
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
