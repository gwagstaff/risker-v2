import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { websocketService, MatchMessage } from '../services/websocket';
import { useNavigate } from 'react-router-dom';

export const Matchmaking: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const clientId = websocketService.getClientId();

  useEffect(() => {
    websocketService.connect();

    const handleMatch = (message: MatchMessage) => {
      if (message.players.includes(clientId)) {
        setIsSearching(false);
        // Navigate to game with match details
        navigate('/game', { state: { matchId: message.timestamp, players: message.players } });
      }
    };

    websocketService.onMessage('match', handleMatch);

    return () => {
      websocketService.offMessage('match', handleMatch);
      if (isSearching) {
        websocketService.leaveMatchmaking();
      }
    };
  }, [clientId, navigate, isSearching]);

  const handleSearchToggle = () => {
    if (isSearching) {
      websocketService.leaveMatchmaking();
      setIsSearching(false);
    } else {
      websocketService.joinMatchmaking();
      setIsSearching(true);
      setError(null);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Find a Game
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant={isSearching ? 'outlined' : 'contained'}
          color={isSearching ? 'error' : 'primary'}
          onClick={handleSearchToggle}
          disabled={isSearching}
          sx={{ minWidth: 200 }}
        >
          {isSearching ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Searching...
            </>
          ) : (
            'Find Match'
          )}
        </Button>

        {isSearching && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Looking for an opponent...
          </Typography>
        )}
      </Box>
    </Paper>
  );
}; 