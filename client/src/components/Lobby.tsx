import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { websocketService, Lobby as LobbyType } from '../services/websocket';
import { useNavigate } from 'react-router-dom';
import { PlayerRole } from '../hooks/useGame';
import { LobbyConfig } from './LobbyConfig';

export const Lobby: React.FC = () => {
  const [lobbies, setLobbies] = useState<LobbyType[]>([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newLobbyName, setNewLobbyName] = useState('');
  const [maxCommanders, setMaxCommanders] = useState(2);
  const [maxPawns, setMaxPawns] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<PlayerRole>(PlayerRole.PAWN);
  const [currentLobby, setCurrentLobby] = useState<LobbyType | null>(null);
  const navigate = useNavigate();
  const clientId = websocketService.getClientId();

  useEffect(() => {
    websocketService.connect();
    websocketService.requestLobbyList();

    const handleLobbyUpdate = (message: any) => {
      if (message.action === 'list') {
        setLobbies(message.lobbies || []);
      } else if (message.action === 'update') {
        if (message.lobby) {
          setCurrentLobby(message.lobby);
        } else if (message.lobby_id) {
          setCurrentLobby(null);
        }
      }
    };

    websocketService.onMessage('lobby', handleLobbyUpdate);

    return () => {
      websocketService.offMessage('lobby', handleLobbyUpdate);
    };
  }, [clientId]);

  const handleCreateLobby = () => {
    if (newLobbyName.trim()) {
      websocketService.createLobby(newLobbyName.trim(), maxCommanders, maxPawns);
      setOpenCreateDialog(false);
      setNewLobbyName('');
      setMaxCommanders(2);
      setMaxPawns(4);
    }
  };

  const handleJoinLobby = (lobbyId: string) => {
    if (selectedRole === PlayerRole.COMMANDER && !canJoinAsCommander(lobbyId)) {
      setError('Cannot join as commander - maximum commanders reached');
      return;
    }
    if (selectedRole === PlayerRole.PAWN && !canJoinAsPawn(lobbyId)) {
      setError('Cannot join as pawn - maximum pawns reached');
      return;
    }
    websocketService.joinLobby(lobbyId, selectedRole);
  };

  const canJoinAsCommander = (lobbyId: string) => {
    const lobby = lobbies.find(l => l.id === lobbyId);
    return lobby && lobby.commanders.length < lobby.maxCommanders;
  };

  const canJoinAsPawn = (lobbyId: string) => {
    const lobby = lobbies.find(l => l.id === lobbyId);
    return lobby && lobby.pawns.length < lobby.maxPawns;
  };

  const handleLeaveLobby = (lobbyId: string) => {
    websocketService.leaveLobby(lobbyId);
  };

  const handleStartGame = () => {
    // TODO: Implement game start logic
    navigate('/game');
  };

  const isInLobby = (lobby: LobbyType) => {
    return lobby.commanders.includes(clientId) || lobby.pawns.includes(clientId);
  };

  if (currentLobby) {
    return <LobbyConfig lobby={currentLobby} onStartGame={handleStartGame} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Game Lobbies</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Lobby
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper>
        <List>
          {lobbies.map((lobby) => (
            <ListItem key={lobby.id} divider>
              <ListItemText
                primary={lobby.name}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Commanders: {lobby.commanders.length}/{lobby.maxCommanders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pawns: {lobby.pawns.length}/{lobby.maxPawns}
                    </Typography>
                    <Chip
                      label={lobby.status}
                      color={
                        lobby.status === 'waiting'
                          ? 'warning'
                          : lobby.status === 'in_progress'
                          ? 'success'
                          : 'default'
                      }
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {isInLobby(lobby) ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleLeaveLobby(lobby.id)}
                  >
                    Leave
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={selectedRole}
                        label="Role"
                        onChange={(e) => setSelectedRole(e.target.value as PlayerRole)}
                      >
                        <MenuItem value={PlayerRole.COMMANDER}>Commander</MenuItem>
                        <MenuItem value={PlayerRole.PAWN}>Pawn</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleJoinLobby(lobby.id)}
                      disabled={lobby.status !== 'waiting' || 
                        (selectedRole === PlayerRole.COMMANDER && !canJoinAsCommander(lobby.id)) ||
                        (selectedRole === PlayerRole.PAWN && !canJoinAsPawn(lobby.id))}
                    >
                      Join
                    </Button>
                  </Box>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Lobby</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                fullWidth
                label="Lobby Name"
                value={newLobbyName}
                onChange={(e) => setNewLobbyName(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Max Commanders</InputLabel>
                <Select
                  value={maxCommanders}
                  label="Max Commanders"
                  onChange={(e) => setMaxCommanders(Number(e.target.value))}
                >
                  <MenuItem value={2}>2 Commanders</MenuItem>
                  <MenuItem value={3}>3 Commanders</MenuItem>
                  <MenuItem value={4}>4 Commanders</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Max Pawns</InputLabel>
                <Select
                  value={maxPawns}
                  label="Max Pawns"
                  onChange={(e) => setMaxPawns(Number(e.target.value))}
                >
                  <MenuItem value={2}>2 Pawns</MenuItem>
                  <MenuItem value={3}>3 Pawns</MenuItem>
                  <MenuItem value={4}>4 Pawns</MenuItem>
                  <MenuItem value={6}>6 Pawns</MenuItem>
                  <MenuItem value={8}>8 Pawns</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateLobby} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 