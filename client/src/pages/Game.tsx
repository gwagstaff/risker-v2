import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Game: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Game View
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Commander interface coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Game; 