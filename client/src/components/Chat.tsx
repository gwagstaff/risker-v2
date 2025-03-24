import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { websocketService, ChatMessage } from '../services/websocket';

interface ChatProps {
  room?: string;
}

export const Chat: React.FC<ChatProps> = ({ room = 'general' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientId = websocketService.getClientId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    websocketService.connect();

    const handleChatMessage = (message: ChatMessage) => {
      if (message.room === room) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    websocketService.onMessage('chat', handleChatMessage);

    return () => {
      websocketService.offMessage('chat', handleChatMessage);
    };
  }, [room]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      websocketService.sendChatMessage(newMessage, room);
      setNewMessage('');
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Chat Room: {room}</Typography>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={
                  <Typography
                    component="span"
                    variant="body2"
                    color={message.client_id === clientId ? 'primary' : 'text.primary'}
                  >
                    {message.client_id === clientId ? 'You' : `Player ${message.client_id.slice(0, 4)}`}:
                  </Typography>
                }
                secondary={message.message}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}; 