import { v4 as uuidv4 } from 'uuid';
import { PlayerRole } from '../hooks/useGame';

export type MessageType = 'chat' | 'matchmaking' | 'match' | 'lobby';

export interface ChatMessage {
  type: 'chat';
  lobby_id: string;
  sender: string;
  message: string;
}

export interface MatchMessage {
  type: 'match';
  players: string[];
  timestamp: string;
}

export interface MatchmakingMessage {
  type: 'matchmaking';
  action: 'join' | 'leave';
}

export interface Lobby {
  id: string;
  name: string;
  commanders: string[];
  pawns: string[];
  maxCommanders: number;
  maxPawns: number;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
}

export interface LobbyMessage {
  type: 'lobby';
  action: 'create' | 'join' | 'leave' | 'update' | 'list';
  lobby_id?: string;
  lobby?: Lobby;
  lobbies?: Lobby[];
  name?: string;
  role?: PlayerRole;
  maxCommanders?: number;
  maxPawns?: number;
}

export type WebSocketMessage = ChatMessage | MatchMessage | MatchmakingMessage | LobbyMessage;

class WebSocketService {
  private ws: WebSocket | null = null;
  private clientId: string;
  private messageHandlers: Map<MessageType, ((message: any) => void)[]> = new Map();

  constructor() {
    this.clientId = uuidv4();
  }

  connect() {
    if (this.ws) {
      return;
    }

    this.ws = new WebSocket(`ws://localhost:8000/ws/${this.clientId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach(handler => handler(message));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws = null;
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(type: MessageType, handler: (message: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  offMessage(type: MessageType, handler: (message: any) => void) {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Helper methods for specific message types
  sendChatMessage(lobbyId: string, message: string) {
    this.sendMessage({
      type: 'chat',
      lobby_id: lobbyId,
      sender: this.clientId,
      message
    });
  }

  joinMatchmaking() {
    this.sendMessage({
      type: 'matchmaking',
      action: 'join'
    });
  }

  leaveMatchmaking() {
    this.sendMessage({
      type: 'matchmaking',
      action: 'leave'
    });
  }

  getClientId(): string {
    return this.clientId;
  }

  // Lobby methods
  createLobby(name: string, maxCommanders: number, maxPawns: number) {
    this.sendMessage({
      type: 'lobby',
      action: 'create',
      name,
      maxCommanders,
      maxPawns
    });
  }

  joinLobby(lobbyId: string, role: PlayerRole) {
    this.sendMessage({
      type: 'lobby',
      action: 'join',
      lobby_id: lobbyId,
      role
    });
  }

  leaveLobby(lobbyId: string) {
    this.sendMessage({
      type: 'lobby',
      action: 'leave',
      lobby_id: lobbyId
    });
  }

  requestLobbyList() {
    this.sendMessage({
      type: 'lobby',
      action: 'list'
    });
  }
}

export const websocketService = new WebSocketService(); 