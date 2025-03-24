import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  TextField,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { websocketService, Lobby } from '../services/websocket';
import { PlayerRole } from '../hooks/useGame';

interface LobbyConfigProps {
  lobby: Lobby;
  onStartGame: () => void;
}

export const LobbyConfig: React.FC<LobbyConfigProps> = ({ lobby, onStartGame }) => {
  const [messages, setMessages] = useState<Array<{ sender: string; message: string; timestamp: string }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const clientId = websocketService.getClientId();
  const isCommander = lobby.commanders.includes(clientId);
  const isHost = lobby.commanders[0] === clientId;

  useEffect(() => {
    const handleChatMessage = (message: any) => {
      if (message.type === 'chat' && message.lobby_id === lobby.id) {
        setMessages(prev => [...prev, {
          sender: message.sender,
          message: message.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    websocketService.onMessage('chat', handleChatMessage);
    return () => websocketService.offMessage('chat', handleChatMessage);
  }, [lobby.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      websocketService.sendChatMessage(lobby.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const canStartGame = isHost && 
    lobby.commanders.length >= 2 && 
    lobby.commanders.length <= 4 && 
    lobby.pawns.length > 0;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5">{lobby.name}</Typography>
          </Grid>
          <Grid item>
            <Chip 
              label={`${lobby.commanders.length}/${lobby.maxCommanders} Commanders`} 
              color="primary" 
              sx={{ mr: 1 }} 
            />
            <Chip 
              label={`${lobby.pawns.length}/${lobby.maxPawns} Pawns`} 
              color="secondary" 
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Players</Typography>
            </Box>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {lobby.commanders.map((commanderId) => (
                <ListItem key={commanderId}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>C</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`Commander ${commanderId === clientId ? '(You)' : ''}`}
                    secondary={commanderId === lobby.commanders[0] ? 'Host' : ''}
                  />
                </ListItem>
              ))}
              {lobby.pawns.map((pawnId) => (
                <ListItem key={pawnId}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>P</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`Pawn ${pawnId === clientId ? '(You)' : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Chat</Typography>
            </Box>
            <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.map((msg, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {msg.timestamp}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{msg.sender}:</strong> {msg.message}
                  </Typography>
                </Box>
              ))}
            </List>
            <Divider />
            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {isHost && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onStartGame}
            disabled={!canStartGame}
          >
            Start Game
          </Button>
        </Box>
      )}
    </Box>
  );
}; 