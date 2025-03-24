import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Paper
} from '@mui/material';
import { useGame, PlayerRole } from '../hooks/useGame';

export function GameLobby() {
    const [playerName, setPlayerName] = useState('');
    const [selectedRole, setSelectedRole] = useState<PlayerRole>(PlayerRole.PAWN);
    const [sessionName, setSessionName] = useState('');
    const [sessionId, setSessionId] = useState('');

    const {
        playerId,
        sessionId: currentSessionId,
        error,
        createSession,
        joinSession,
        leaveSession
    } = useGame();

    const handleCreateSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName && sessionName) {
            createSession(sessionName);
        }
    };

    const handleJoinSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName && sessionId) {
            joinSession(playerName, selectedRole, sessionId);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 2 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Game Lobby
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {currentSessionId ? (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Connected to session: {currentSessionId}
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={leaveSession}
                            fullWidth
                        >
                            Leave Session
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleCreateSession}>
                        <TextField
                            fullWidth
                            label="Your Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            margin="normal"
                            required
                        />

                        <FormControl fullWidth margin="normal">
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

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Create New Session
                            </Typography>
                            <TextField
                                fullWidth
                                label="Session Name"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                margin="normal"
                                required
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                Create Session
                            </Button>
                        </Box>

                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Join Existing Session
                            </Typography>
                            <TextField
                                fullWidth
                                label="Session ID"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                margin="normal"
                                required
                            />
                            <Button
                                variant="contained"
                                color="secondary"
                                fullWidth
                                sx={{ mt: 2 }}
                                onClick={handleJoinSession}
                            >
                                Join Session
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
} 