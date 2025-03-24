import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Battle: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Battle View
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pawn battle interface coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Battle; 