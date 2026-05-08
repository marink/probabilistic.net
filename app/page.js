"use client";

import {
  Box, AppBar, Toolbar, Typography, Button, Container,
  Card, CardContent, CardActionArea, Stack, Chip, Divider, Alert,
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import BuildIcon from '@mui/icons-material/Build';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const resources = [
  {
    icon: <SchoolIcon sx={{ fontSize: 36, color: '#2E7D32' }} />,
    title: 'Brief Intro',
    desc: 'A brief introduction to Graphical Models and Bayesian Networks by Kevin Murphy (University of British Columbia).',
    href: 'https://www.cs.ubc.ca/~murphyk/Bayes/bnintro.html',
  },
  {
    icon: <ArticleIcon sx={{ fontSize: 36, color: '#2E7D32' }} />,
    title: 'Bayesian Nets Tutorial',
    desc: 'Constructing Bayesian networks from prior knowledge — Bayesian statistical methods for using data to improve models.',
    href: 'https://en.wikipedia.org/wiki/Bayesian_network',
  },
  {
    icon: <HubIcon sx={{ fontSize: 36, color: '#2E7D32' }} />,
    title: 'Wikipedia Reference',
    desc: 'Comprehensive reference on Bayesian networks — structure, inference algorithms, applications, and history.',
    href: 'https://en.wikipedia.org/wiki/Bayesian_network',
  },
];

const software = [
  {
    title: 'Weka',
    desc: 'The Weka machine learning package from Waikato University. Includes Bayesian network classifiers alongside classification, regression, clustering, and visualization tools.',
    href: 'https://www.cs.waikato.ac.nz/ml/weka/',
    note: 'Requires Java',
  },
  {
    title: 'Tetrad Project',
    desc: 'Creates, simulates, estimates, tests, and searches for causal and statistical models. Sophisticated methods in a friendly interface — no programming knowledge required.',
    href: 'https://www.cmu.edu/dietrich/philosophy/tetrad/',
    note: null,
  },
];

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
        color: '#fff',
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <AppBar position="fixed" elevation={0} sx={{
          bgcolor: 'rgba(27, 94, 32, 0.85)',
          backgroundImage: 'none',
          boxShadow: 'none',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: '44px !important' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: '-0.5px' }}>
              Probabilistic.net
            </Typography>
            <Button color="inherit" href="#overview">Overview</Button>
            <Button color="inherit" href="#software">Software</Button>
            <Button color="inherit" href="#about">About</Button>
            <Button
              color="inherit"
              href="https://github.com/marink/probabilistic.net"
              target="_blank"
              startIcon={<GitHubIcon />}
            >
              GitHub
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ position: 'relative', zIndex: 1, mt: 'calc(10vh + 30px)', pb: 6, px: 2, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ mt: '30px' }}>
            Bayesian Network
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.7, fontStyle: 'italic', mb: 2 }}>
            /ˈbeɪzɪən ˈnɛtˌwɜːk/
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 640, mx: 'auto', mb: 5 }}>
            A probabilistic graphical model — a <strong>D</strong>irected <strong>A</strong>cyclic <strong>G</strong>raph
            of nodes representing random variables, with edges encoding conditional probability relationships.
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.75, maxWidth: 600, mx: 'auto', mb: 4 }}>
            The web reference with information and tutorials for learning about Bayesian Networks.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            {['Bayesian Networks', 'Probabilistic Graphical Models', 'DAG', 'Conditional Probability', 'Inference'].map(t => (
              <Chip key={t} label={t} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} />
            ))}
          </Stack>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ py: 8, px: { xs: 3, sm: 5, md: 6 }, flexGrow: 1 }}>

        {/* Overview */}
        <Box id="overview" sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>Overview</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Follow the links below to access resources with abundant information on Bayesian Networks.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
            {resources.map(r => (
              <Card key={r.title} sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                <CardActionArea href={r.href} target="_blank" rel="noreferrer" sx={{ height: '100%', p: 1 }}>
                  <CardContent>
                    <Box mb={1}>{r.icon}</Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{r.desc}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 8 }} />

        {/* Software */}
        <Box id="software" sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>Software Implementations</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            There are numerous software implementations for Bayesian networks. The most popular are listed below.
          </Typography>
          <Alert severity="info" sx={{ mb: 4 }}>
            <strong>Java SDK Required</strong> — Some packages require Java. Download the bundled version if you don't have Java installed.
          </Alert>
          <Stack spacing={3}>
            {software.map(s => (
              <Card key={s.title} sx={{ '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.2s' }}>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <BuildIcon sx={{ color: '#2E7D32', mt: 0.5, flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <Typography variant="h6" fontWeight={700}>{s.title}</Typography>
                      {s.note && <Chip label={s.note} size="small" color="warning" variant="outlined" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{s.desc}</Typography>
                    <Button
                      size="small"
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      endIcon={<OpenInNewIcon />}
                      sx={{ color: '#2E7D32' }}
                    >
                      More Info
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 8 }} />

        {/* About */}
        <Box id="about" sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>About</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            This site was built to help those who want to learn and develop a deep understanding of Bayesian Networks.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Companion to{' '}
            <a href="https://machinelearning.js.org" target="_blank" rel="noreferrer" style={{ color: '#2E7D32' }}>
              MachineLearning.js
            </a>
            {' '}— interactive machine learning tools running entirely in your browser.
          </Typography>
        </Box>

      </Container>

      <Box sx={{
        py: 4,
        textAlign: 'center',
        bgcolor: '#F5F5F7',
        borderTop: '1px solid #D2D2D7',
      }}>
        <Typography sx={{ fontSize: 12, color: '#6E6E73' }}>
          © 2019–2026 Marin Kokona · Probabilistic.net · Open source · MIT License
        </Typography>
      </Box>

    </Box>
  );
}
