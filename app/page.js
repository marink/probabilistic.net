"use client";

import { useState, useEffect } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, Container, Divider,
} from '@mui/material';
import HubIcon   from '@mui/icons-material/Hub';
import GitHubIcon from '@mui/icons-material/GitHub';
import Link      from 'next/link';

const PURPLE       = '#563d7c';
const PURPLE_LIGHT = '#6f5499';
const PURPLE_TEXT  = '#cdbfe3';
const PP           = '#f0ebf8';
const LINK_COLOR   = '#428bca';
const WARN_BORDER  = '#f0ad4e';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'concepts',  label: 'Key Concepts' },
  { id: 'software',  label: 'Software Implementations' },
  { id: 'about',     label: 'About' },
  { id: 'contact',   label: 'Contact' },
];

function useActiveSection() {
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const observers = NAV_ITEMS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);
  return active;
}

function Section({ id, title, children }) {
  return (
    <Box id={id} component="section" sx={{ mb: 5 }}>
      <Typography variant="h4" fontWeight={700} sx={{ borderBottom: '1px solid #e5e5e5', pb: 1, mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function A({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: LINK_COLOR }}>
      {children}
    </a>
  );
}

export default function Home() {
  const active = useActiveSection();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>

      {/* Navbar — white, purple brand text */}
      <AppBar position="sticky" elevation={0} sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #e7e7e7',
        color: PURPLE,
      }}>
        <Toolbar variant="dense" sx={{ minHeight: '50px !important' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1, color: PURPLE }}>
            Bayesian Networks
          </Typography>
          <Button sx={{ color: '#777', fontWeight: 400, textTransform: 'none' }} href="#top">Home</Button>
          <Button component={Link} href="/builder/" sx={{ color: '#777', fontWeight: 400, textTransform: 'none' }}>Builder</Button>
          <Button sx={{ color: '#777', fontWeight: 400, textTransform: 'none' }} href="#about">About</Button>
          <Button sx={{ color: '#777', fontWeight: 400, textTransform: 'none' }} href="#contact">Contact</Button>
        </Toolbar>
      </AppBar>

      {/* Hero — purple gradient, left-aligned, definition box right */}
      <Box id="top" sx={{
        background: `linear-gradient(to bottom, ${PURPLE} 0%, ${PURPLE_LIGHT} 100%)`,
        color: '#fff',
        py: 3.75,
        px: { xs: 3, md: 8 },
      }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          {/* Left: title + subtitle */}
          <Box sx={{ flex: '1 1 auto' }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Bayesian Network
            </Typography>
            <Typography variant="body1" sx={{ color: PURPLE_TEXT, maxWidth: 480 }}>
              The web reference with information and tutorials for learning about Bayesian Networks.
            </Typography>
          </Box>

          {/* Right: definition box */}
          <Box sx={{
            flex: '0 0 340px',
            bgcolor: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 1,
            p: 2,
            display: { xs: 'none', md: 'block' },
          }}>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
              bayesian network: /ˈbeɪzɪən ˈnɛtˌwɜːk/
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box sx={{ opacity: 0.7, flexShrink: 0 }}>
                <HubIcon sx={{ fontSize: 48, color: PURPLE_TEXT }} />
              </Box>
              <Typography variant="body2" sx={{ color: PURPLE_TEXT, fontSize: 13 }}>
                A probabilistic graphical model, which is a <strong>D</strong>irected <strong>A</strong>cyclic{' '}
                <strong>G</strong>raph of nodes that represent random variables, and directed edges that
                represent conditional probability relationship between these variables.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Body — main content + sticky sidebar */}
      <Container maxWidth="lg" sx={{ py: 5, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>

          {/* Main content */}
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>

            <Section id="overview" title="Overview">
              <Typography variant="body1" sx={{ mb: 3 }}>
                Follow the links below to access resources with abundant information Bayesian Networks.
              </Typography>

              {/* 3-column resource cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, mb: 4 }}>
                {[
                  {
                    title: 'Brief Intro',
                    body: <>A brief introduction to <strong>Graphical Models</strong> and Bayesian Networks by Kevin Murphy (<em>since 1998</em>).</>,
                    href: 'https://www.cs.ubc.ca/~murphyk/Bayes/bnintro.html',
                  },
                  {
                    title: 'Bayesian Nets Tutorial',
                    body: <>A paper that discusses methods for <em>constructing Bayesian networks from prior knowledge</em> and summarize <strong>Bayesian statistical methods</strong> for using data to improve these models.</>,
                    href: 'https://en.wikipedia.org/wiki/Bayesian_network',
                  },
                  {
                    title: 'Microsoft BN Editor',
                    body: <><strong>Microsoft Bayesian Network Editor</strong> — a component-based Windows application for creating, assessing, and evaluating Bayesian Networks, created at <A href="http://research.microsoft.com/en-us/about/default.aspx">Microsoft Research</A>.</>,
                    href: 'http://research.microsoft.com/en-us/um/redmond/groups/adapt/msbnx/',
                  },
                ].map(r => (
                  <Box key={r.title}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{r.body}</Typography>
                    <a href={r.href} target="_blank" rel="noreferrer" style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      fontSize: 13,
                      color: '#333',
                      textDecoration: 'none',
                      background: '#fff',
                    }}>
                      More Info »
                    </a>
                  </Box>
                ))}
              </Box>

              <Typography variant="h6" fontWeight={600} gutterBottom>More Info on the Web</Typography>
              <Typography variant="body2" color="text.secondary">
                A great resource of information is the Wikipedia{' '}
                <A href="https://en.wikipedia.org/wiki/Bayesian_network">Bayesian network page</A>.
              </Typography>
            </Section>

            {/* ── Key Concepts ── */}
            <Section id="concepts" title="Key Concepts">
              <Typography variant="body1" sx={{ mb: 3 }}>
                A Bayesian Network is defined by two components: a <strong>directed acyclic graph (DAG)</strong> whose
                nodes represent random variables, and a set of <strong>conditional probability distributions</strong>
                — one per node — that together specify the full joint distribution over all variables.
              </Typography>

              {/* 2×2 concept grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 4 }}>
                {[
                  {
                    title: 'Nodes',
                    body: 'Each node represents a random variable. It can be binary (True/False), discrete (low/med/high), or continuous — whatever domain the variable inhabits.',
                  },
                  {
                    title: 'Directed Edges',
                    body: 'An arrow A → B means A is a direct parent of B. B\'s probability distribution depends on the value of A. The graph must remain acyclic — no variable can be its own ancestor.',
                  },
                  {
                    title: 'Conditional Probability Tables',
                    body: 'Each node stores P(node | parents). Root nodes (no parents) store a prior P(node). Together these tables encode the full joint distribution compactly.',
                  },
                  {
                    title: 'D-separation',
                    body: 'A graphical criterion for reading off conditional independencies directly from the graph structure — without computing any probabilities. It is the key to efficient inference.',
                  },
                ].map(c => (
                  <Box key={c.title} sx={{
                    border: '1px solid #e5e5e5',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: '#fff',
                  }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: PURPLE, mb: 0.5 }}>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.body}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Static Sprinkler network SVG */}
              <Box sx={{ mb: 1.5 }}>
                <svg
                  viewBox="0 0 400 280"
                  width="400"
                  height="280"
                  style={{ display: 'block', overflow: 'visible' }}
                  aria-label="The Sprinkler Network diagram"
                >
                  <defs>
                    <marker id="arr-static" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill={PURPLE} />
                    </marker>
                  </defs>

                  {/* Edges: Cloudy→Sprinkler, Cloudy→Rain, Sprinkler→WetGrass, Rain→WetGrass */}
                  {/* Cloudy(200,50) → Sprinkler(80,160) */}
                  <line x1={187} y1={78} x2={97} y2={133} stroke={PURPLE} strokeWidth={1.8} markerEnd="url(#arr-static)" />
                  {/* Cloudy(200,50) → Rain(320,160) */}
                  <line x1={213} y1={78} x2={303} y2={133} stroke={PURPLE} strokeWidth={1.8} markerEnd="url(#arr-static)" />
                  {/* Sprinkler(80,160) → WetGrass(200,260) */}
                  <line x1={103} y1={188} x2={183} y2={233} stroke={PURPLE} strokeWidth={1.8} markerEnd="url(#arr-static)" />
                  {/* Rain(320,160) → WetGrass(200,260) */}
                  <line x1={297} y1={188} x2={217} y2={233} stroke={PURPLE} strokeWidth={1.8} markerEnd="url(#arr-static)" />

                  {/* Nodes */}
                  {[
                    { label: 'Cloudy',     x: 200, y:  50 },
                    { label: 'Sprinkler',  x:  80, y: 160 },
                    { label: 'Rain',       x: 320, y: 160 },
                    { label: 'Wet Grass',  x: 200, y: 260 },
                  ].map(n => (
                    <g key={n.label} transform={`translate(${n.x},${n.y})`}>
                      <circle r={38} fill="#fff" stroke={PURPLE} strokeWidth={1.8} />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={n.label.length > 9 ? 9 : 11}
                        fontFamily="Helvetica Neue, Arial, sans-serif"
                        fill={PURPLE}
                        fontWeight={600}
                      >
                        {n.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                The Sprinkler Network — a classic teaching example.
              </Typography>

              <Button
                component={Link}
                href="/builder/"
                variant="outlined"
                sx={{
                  borderColor: PURPLE,
                  color: PURPLE,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { bgcolor: PP, borderColor: PURPLE },
                }}
              >
                → Try the Interactive Builder
              </Button>
            </Section>

            <Section id="software" title="Software Implementations">
              <Typography variant="body1" sx={{ mb: 3 }}>
                There are numerous software implementations for the Bayesian networks. The most popular implementations are listed below.
              </Typography>

              {/* Java SDK callout */}
              <Box sx={{
                borderLeft: `4px solid ${WARN_BORDER}`,
                bgcolor: '#fcf8e3',
                px: 2.5,
                py: 2,
                mb: 4,
                borderRadius: '0 4px 4px 0',
              }}>
                <Typography variant="body2" sx={{ color: '#8a6d3b', fontWeight: 700, mb: 0.5 }}>
                  Java SDK Required
                </Typography>
                <Typography variant="body2" sx={{ color: '#8a6d3b' }}>
                  There are two types of downloads for the Weka Machine learning package: one that includes the JVM,
                  and the other that assumes you have it already installed. If you don't have Java on your machine
                  download the bigger package.
                </Typography>
              </Box>

              <Typography variant="h5" fontWeight={700} gutterBottom>The Weka Data Mining Software</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                This package makes available most Machine Learning algorithms as tools for data pre-processing,
                classification, regression, clustering, association rules, and visualization, wich can be applied
                to practical problems.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                The Weka machine learning package can be downloaded from the Waikato University{' '}
                <A href="https://www.cs.waikato.ac.nz/ml/weka/">machine learning</A> site.
              </Typography>

              <Typography variant="h5" fontWeight={700} gutterBottom>The Tetrad Project</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tetrad is a program which creates, simulates data from, estimates, tests, predicts with, and searches
                for causal and statistical models. The aim of the program is to provide sophisticated methods in a
                friendly interface requiring very little statistical sophistication of the user and no programming knowledge.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The Tetrad packages can be downloaded from the{' '}
                <A href="https://www.cmu.edu/dietrich/philosophy/tetrad/">Tetrad</A> page.
              </Typography>
            </Section>

            <Section id="about" title="About">
              <Typography variant="body1">
                This web site was built to help all those who want to learn and get a deep understanding about Bayesian Networks.
              </Typography>
            </Section>

            <Section id="contact" title="Contact">
              <Typography variant="body1">
                For questions or suggestions on how to improve this site please email Marin Kokona with user
                name <code style={{ background: '#f5f5f5', padding: '2px 5px', borderRadius: 3, color: PURPLE }}>mar1n</code> at Yahoo! email.
              </Typography>
            </Section>

          </Box>

          {/* Sticky sidebar TOC with scrollspy */}
          <Box sx={{
            flex: '0 0 180px',
            display: { xs: 'none', lg: 'block' },
            position: 'sticky',
            top: 70,
            alignSelf: 'flex-start',
          }}>
            <Box component="nav">
              {NAV_ITEMS.map(({ id, label }) => (
                <Box key={id} sx={{ mb: 0.5 }}>
                  <a href={`#${id}`} style={{
                    color: active === id ? PURPLE : '#999',
                    fontWeight: active === id ? 700 : 400,
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}>
                    {label}
                  </a>
                </Box>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <a href="#top" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>
                Back to top
              </a>
            </Box>
          </Box>

        </Box>
      </Container>

      {/* Footer */}
      <Box component="footer" sx={{
        borderTop: '1px solid #e5e5e5',
        bgcolor: '#f5f5f5',
        py: 4,
        px: { xs: 3, md: 8 },
      }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © 2009–2026 Marin Kokona · probabilistic.net / bayesian.network
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <a href="https://machinelearning.js.org" target="_blank" rel="noreferrer"
              style={{ color: PURPLE, fontSize: 13, textDecoration: 'none' }}>
              MachineLearning.js
            </a>
            <a href="https://github.com/marink/probabilistic.net" target="_blank" rel="noreferrer"
              style={{ color: '#999', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <GitHubIcon sx={{ fontSize: 16 }} /> GitHub
            </a>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', maxWidth: 960, mx: 'auto', mt: 2, color: '#aaa' }}>
          For educational and research use only. Results are provided &ldquo;as is&rdquo; without
          warranty of any kind and should not be relied upon for clinical, financial, safety-critical,
          or other consequential decisions.
        </Typography>
      </Box>

    </Box>
  );
}
