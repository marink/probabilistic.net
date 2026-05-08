import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from '@theme';
import './globals.css';

export const metadata = {
  title: 'Probabilistic.net',
  description: 'Probabilistic reasoning and Bayesian networks — interactive tools running in your browser.',
  metadataBase: new URL('https://probabilistic.net'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
