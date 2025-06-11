export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    sender: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
  };
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
  }[];
}
