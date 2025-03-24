import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import { Lobby } from '../components/Lobby';

const Home: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to Riskier 2.0
        </Typography>
        
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          A modern take on the classic Risk game
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Lobby />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;