import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import { Chat } from '../components/Chat';
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
          <Grid item xs={12} md={8}>
            <Lobby />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: 400 }}>
              <Chat room="lobby" />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;