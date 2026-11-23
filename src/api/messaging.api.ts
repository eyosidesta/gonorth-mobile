import { api } from '../lib/api';

export type ReferenceType = 'TRIP' | 'BOOKING' | 'DELIVERY';

export interface ThreadParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface MessageThread {
  id: string;
  participantAId: string;
  participantBId: string;
  referenceType: ReferenceType;
  referenceId: string;
  lastMessageAt: string | null;
  participantA: ThreadParticipant;
  participantB: ThreadParticipant;
  messages: {
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  }[];
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  sender: ThreadParticipant;
}

export const messagingApi = {
  getOrCreateThread: (otherUserId: string, referenceType: ReferenceType, referenceId: string) =>
    api.post<MessageThread>('/messaging/threads', { otherUserId, referenceType, referenceId }),

  listThreads: () =>
    api.get<MessageThread[]>('/messaging/threads'),

  getMessages: (threadId: string, cursor?: string, limit = 30) =>
    api.get<Message[]>(`/messaging/threads/${threadId}/messages`, {
      params: { ...(cursor ? { cursor } : {}), limit },
    }),

  markRead: (threadId: string) =>
    api.patch(`/messaging/threads/${threadId}/read`),

  unreadCount: () =>
    api.get<number>('/messaging/threads/unread-count'),
};
