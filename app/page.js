"use client";

import {
  Box, AppBar, Toolbar, Typography, Button, Container,
  Card, CardContent, Stack, Chip,
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import FunctionsIcon from '@mui/icons-material/Functions';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import GitHubIcon from '@mui/icons-material/GitHub';

const features = [
  {
    icon: <HubIcon sx={{ fontSize: 40, color: '#2E7D32' }} />,
    title: 'Bayesian Networks',
    desc: 'Model conditional dependencies between variables. Build directed acyclic graphs and perform exact inference.',
  },
  {
    icon: <FunctionsIcon sx={{ fontSize: 40, color: '#2E7D32' }} />,
    title: 'Probability Theory',
    desc: 'Apply Bayes\' theorem, prior and posterior distributions, and likelihood estimation interactively.',
  },
  {
    icon: <AutoGraphIcon sx={{ fontSize: 40, color: '#2E7D32' }} />,
    title: 'Visualize',
    desc: 'Explore probability distributions and network structures with interactive visualizations.',
  },
];

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
        color: '#fff',
        minHeight: 520,
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
            Probabilistic Reasoning
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 600, mx: 'auto', mb: 7 }}>
            Interactive Bayesian networks and probability tools — running entirely in your browser.
            No install required.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            {['Bayesian Networks','Conditional Probability','DAG','Inference','Zero Install'].map(t => (
              <Chip key={t} label={t} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Feature cards */}
      <Container maxWidth="md" sx={{ py: 8, px: { xs: 3, sm: 5, md: 6 }, flexGrow: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
          {features.map(f => (
            <Card key={f.title} sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
              <CardContent>
                <Box mb={1}>{f.icon}</Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Companion to{' '}
            <a href="https://machinelearning.js.org" target="_blank" rel="noreferrer"
               style={{ color: '#2E7D32' }}>
              MachineLearning.js
            </a>
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
          Copyright © 2025 Probabilistic.net · Open source · MIT License
        </Typography>
      </Box>
    </Box>
  );
}
