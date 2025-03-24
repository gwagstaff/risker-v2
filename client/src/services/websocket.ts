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
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.clientId = uuidv4();
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(`ws://localhost:8000/ws/${this.clientId}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('Received WebSocket message:', message);
          const handlers = this.messageHandlers.get(message.type) || [];
          handlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.connectionPromise = null;
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ws = null;
        this.connectionPromise = null;
        reject(error);
      };
    });

    return this.connectionPromise;
  }

  async sendMessage(message: WebSocketMessage): Promise<void> {
    try {
      await this.connect();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('Sending WebSocket message:', message);
        this.ws.send(JSON.stringify(message));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      throw error;
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
  async createLobby(name: string, maxCommanders: number, maxPawns: number) {
    await this.sendMessage({
      type: 'lobby',
      action: 'create',
      name,
      maxCommanders,
      maxPawns
    });
  }

  async joinLobby(lobbyId: string, role: PlayerRole, name: string) {
    await this.sendMessage({
      type: 'lobby',
      action: 'join',
      lobby_id: lobbyId,
      role,
      name
    });
  }

  async leaveLobby(lobbyId: string) {
    await this.sendMessage({
      type: 'lobby',
      action: 'leave',
      lobby_id: lobbyId
    });
  }

  async requestLobbyList() {
    await this.sendMessage({
      type: 'lobby',
      action: 'list'
    });
  }
}

export const websocketService = new WebSocketService(); 