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
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState<LobbyType | null>(null);
  const [joinRole, setJoinRole] = useState<PlayerRole>(PlayerRole.COMMANDER);
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const connectAndRequestList = async () => {
      try {
        await websocketService.connect();
        if (isSubscribed) {
          await websocketService.requestLobbyList();
        }
      } catch (error) {
        if (isSubscribed) {
          console.error('Failed to connect to WebSocket:', error);
          setError('Failed to connect to server. Please try refreshing the page.');
        }
      }
    };

    connectAndRequestList();

    const handleLobbyUpdate = (message: any) => {
      if (!isSubscribed) return;
      console.log('Received lobby message:', message);
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
      isSubscribed = false;
      websocketService.offMessage('lobby', handleLobbyUpdate);
    };
  }, [clientId]);

  const handleRefresh = async () => {
    try {
      await websocketService.requestLobbyList();
    } catch (error) {
      console.error('Failed to refresh lobby list:', error);
      setError('Failed to refresh lobby list. Please try again.');
    }
  };

  const handleCreateLobby = async () => {
    if (newLobbyName.trim()) {
      try {
        await websocketService.createLobby(
          newLobbyName.trim(),
          maxCommanders,
          maxPawns,
          "Host" // Default name for the creator
        );
        setOpenCreateDialog(false);
        setNewLobbyName('');
        setMaxCommanders(2);
        setMaxPawns(4);
      } catch (error) {
        console.error('Failed to create lobby:', error);
        setError('Failed to create lobby. Please try again.');
      }
    }
  };

  const handleJoinClick = (lobby: LobbyType) => {
    setSelectedLobby(lobby);
    setJoinDialogOpen(true);
  };

  const handleJoinSubmit = async () => {
    if (!selectedLobby || !joinName.trim()) {
      setJoinError('Please enter a name');
      return;
    }

    try {
      setJoinError(null);
      await websocketService.joinLobby(selectedLobby.id, joinRole, joinName.trim());
      setJoinDialogOpen(false);
      setJoinName('');
      setSelectedLobby(null);
    } catch (error) {
      console.error('Failed to join lobby:', error);
      setJoinError('Failed to join lobby. Please try again.');
    }
  };

  const canJoinAsCommander = (lobby: LobbyType) => {
    return lobby.commanders.length < lobby.maxCommanders;
  };

  const canJoinAsPawn = (lobby: LobbyType) => {
    return lobby.pawns.length < lobby.maxPawns;
  };

  const handleLeaveLobby = async (lobbyId: string) => {
    try {
      await websocketService.leaveLobby(lobbyId);
    } catch (error) {
      console.error('Failed to leave lobby:', error);
      setError('Failed to leave lobby. Please try again.');
    }
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Lobby
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lobby List */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Lobbies
        </Typography>
        <Grid container spacing={2}>
          {lobbies.map((lobby) => (
            <Grid item xs={12} sm={6} md={4} key={lobby.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{lobby.name}</Typography>
                  <Typography color="textSecondary">
                    Commanders: {lobby.commanders.length}/{lobby.maxCommanders}
                  </Typography>
                  <Typography color="textSecondary">
                    Pawns: {lobby.pawns.length}/{lobby.maxPawns}
                  </Typography>
                  <Typography color="textSecondary">
                    Status: {lobby.status}
                  </Typography>
                </CardContent>
                <CardActions>
                  {isInLobby(lobby) ? (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleLeaveLobby(lobby.id)}
                    >
                      Leave
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleJoinClick(lobby)}
                      disabled={
                        (joinRole === PlayerRole.COMMANDER &&
                          lobby.commanders.length >= lobby.maxCommanders) ||
                        (joinRole === PlayerRole.PAWN &&
                          lobby.pawns.length >= lobby.maxPawns) ||
                        lobby.status !== 'waiting'
                      }
                    >
                      Join
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

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

      {/* Join Lobby Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)}>
        <DialogTitle>Join Lobby</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Your Name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              fullWidth
              error={!!joinError}
              helperText={joinError}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={joinRole}
                onChange={(e) => setJoinRole(e.target.value as PlayerRole)}
                label="Role"
              >
                <MenuItem value={PlayerRole.COMMANDER}>Commander</MenuItem>
                <MenuItem value={PlayerRole.PAWN}>Pawn</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinSubmit} variant="contained" color="primary">
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 