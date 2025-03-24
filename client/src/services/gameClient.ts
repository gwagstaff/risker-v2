import { v4 as uuidv4 } from 'uuid';

export enum PlayerRole {
    COMMANDER = "commander",
    PAWN = "pawn"
}

export interface GameMessage {
    type: 'join' | 'create_session' | 'leave';
    player_id?: string;
    name?: string;
    role?: PlayerRole;
    session_id?: string;
}

export interface GameResponse {
    type: 'joined' | 'session_created' | 'left' | 'error';
    player_id?: string;
    session_id?: string;
    message?: string;
}

export class GameClient {
    private ws: WebSocket | null = null;
    private messageHandlers: Map<string, ((response: GameResponse) => void)[]> = new Map();
    private clientId: string;

    constructor(private serverUrl: string = 'ws://localhost:8000') {
        this.clientId = uuidv4();
    }

    connect() {
        if (this.ws) {
            return;
        }

        this.ws = new WebSocket(`${this.serverUrl}/ws/${this.clientId}`);

        this.ws.onopen = () => {
            console.log('Game WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            const response = JSON.parse(event.data) as GameResponse;
            const handlers = this.messageHandlers.get(response.type) || [];
            handlers.forEach(handler => handler(response));
        };

        this.ws.onclose = () => {
            console.log('Game WebSocket disconnected');
            this.ws = null;
        };

        this.ws.onerror = (error) => {
            console.error('Game WebSocket error:', error);
            this.ws = null;
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private sendMessage(message: GameMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('Game WebSocket is not connected');
        }
    }

    onResponse(type: string, handler: (response: GameResponse) => void) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)?.push(handler);
    }

    offResponse(type: string, handler: (response: GameResponse) => void) {
        const handlers = this.messageHandlers.get(type) || [];
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    // Game-specific methods
    createSession(name: string) {
        this.sendMessage({
            type: 'create_session',
            name
        });
    }

    joinSession(name: string, role: PlayerRole, sessionId: string) {
        this.sendMessage({
            type: 'join',
            name,
            role,
            session_id: sessionId
        });
    }

    leaveSession(playerId: string) {
        this.sendMessage({
            type: 'leave',
            player_id: playerId
        });
    }

    getClientId(): string {
        return this.clientId;
    }
}

// Create a singleton instance
export const gameClient = new GameClient(); 