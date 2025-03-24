import { useEffect, useState } from 'react';
import { gameClient, GameResponse } from '../services/gameClient';

export enum PlayerRole {
    COMMANDER = 'commander',
    PAWN = 'pawn'
}

interface GameState {
    playerId: string | null;
    sessionId: string | null;
    isConnected: boolean;
    error: string | null;
}

export function useGame() {
    const [gameState, setGameState] = useState<GameState>({
        playerId: null,
        sessionId: null,
        isConnected: false,
        error: null
    });

    useEffect(() => {
        // Connect to WebSocket when component mounts
        gameClient.connect();

        // Set up response handlers
        const handleJoined = (response: GameResponse) => {
            setGameState(prev => ({
                ...prev,
                playerId: response.player_id || null,
                sessionId: response.session_id || null,
                error: null
            }));
        };

        const handleSessionCreated = (response: GameResponse) => {
            setGameState(prev => ({
                ...prev,
                sessionId: response.session_id || null,
                error: null
            }));
        };

        const handleLeft = (response: GameResponse) => {
            setGameState(prev => ({
                ...prev,
                playerId: null,
                sessionId: null,
                error: null
            }));
        };

        const handleError = (response: GameResponse) => {
            setGameState(prev => ({
                ...prev,
                error: response.message || 'An error occurred'
            }));
        };

        // Register handlers
        gameClient.onResponse('joined', handleJoined);
        gameClient.onResponse('session_created', handleSessionCreated);
        gameClient.onResponse('left', handleLeft);
        gameClient.onResponse('error', handleError);

        // Cleanup on unmount
        return () => {
            gameClient.offResponse('joined', handleJoined);
            gameClient.offResponse('session_created', handleSessionCreated);
            gameClient.offResponse('left', handleLeft);
            gameClient.offResponse('error', handleError);
            gameClient.disconnect();
        };
    }, []);

    const createSession = (name: string) => {
        gameClient.createSession(name);
    };

    const joinSession = (name: string, role: PlayerRole, sessionId: string) => {
        gameClient.joinSession(name, role, sessionId);
    };

    const leaveSession = () => {
        if (gameState.playerId) {
            gameClient.leaveSession(gameState.playerId);
        }
    };

    return {
        ...gameState,
        createSession,
        joinSession,
        leaveSession
    };
} 