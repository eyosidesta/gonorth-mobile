import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { messagingApi, Message, ThreadParticipant } from '../../api/messaging.api';
import { useAuthStore } from '../../store/auth.store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AV_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function avatarColor(id: string) { return AV_COLORS[id.charCodeAt(0) % AV_COLORS.length]; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDateGroup(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <View style={[S.bubbleWrap, isMe ? S.bubbleWrapMe : S.bubbleWrapThem]}>
      <View style={[S.bubble, isMe ? S.bubbleMe : S.bubbleThem]}>
        <Text style={[S.bubbleText, isMe ? S.bubbleTextMe : S.bubbleTextThem]}>
          {msg.content}
        </Text>
      </View>
      <Text style={S.bubbleTime}>{formatTime(msg.createdAt)}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { threadId: string; otherUser: ThreadParticipant; tripRoute?: string } };
};

export default function ChatScreen({ navigation, route }: Props) {
  const { threadId, otherUser, tripRoute } = route.params;
  const user = useAuthStore(s => s.user);
  const currentUserId = user?.id ?? '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const listRef = useRef<FlatList>(null);

  // Load message history
  const loadMessages = useCallback(async () => {
    try {
      const { data } = await messagingApi.getMessages(threadId);
      // API returns newest-first; reverse for display (oldest at top)
      setMessages(Array.isArray(data) ? [...data].reverse() : []);
      messagingApi.markRead(threadId).catch(() => {});
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Socket.IO connection
  useEffect(() => {
    let socket: Socket;

    (async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 3,
      });

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join_thread', { threadId });
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('new_message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId !== currentUserId) {
          messagingApi.markRead(threadId).catch(() => {});
        }
      });

      socket.on('typing', ({ userId }: { userId: string }) => {
        if (userId !== currentUserId) {
          setTypingVisible(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingVisible(false), 2500);
        }
      });

      socketRef.current = socket;
    })();

    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (socket) {
        socket.emit('leave_thread', { threadId });
        socket.disconnect();
      }
    };
  }, [threadId, currentUserId]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socketRef.current || !connected) return;

    setSending(true);
    socketRef.current.emit('send_message', { threadId, content: text });
    setInput('');
    setSending(false);
  };

  const handleTyping = (text: string) => {
    setInput(text);
    if (socketRef.current && connected) {
      socketRef.current.emit('typing', { threadId });
    }
  };

  // Group messages by date
  const grouped: { type: 'date'; label: string } | Message[] = [];
  const items: ({ type: 'date'; label: string } | Message)[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) {
      items.push({ type: 'date', label: formatDateGroup(msg.createdAt) });
      lastDate = d;
    }
    items.push(msg);
  }

  const initials = `${otherUser.firstName[0]}${otherUser.lastName?.[0] ?? ''}`.toUpperCase();
  const bgColor = avatarColor(otherUser.id);

  return (
    <SafeAreaView style={S.safe}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[S.headerAvatar, { backgroundColor: bgColor }]}>
          <Text style={S.headerAvatarTxt}>{initials}</Text>
        </View>
        <View style={S.headerInfo}>
          <Text style={S.headerName}>{otherUser.firstName} {otherUser.lastName}</Text>
          {tripRoute ? (
            <Text style={S.headerSub} numberOfLines={1}>{tripRoute}</Text>
          ) : (
            <Text style={[S.headerSub, { color: connected ? Colors.primary : Colors.textMuted }]}>
              {connected ? 'Online' : 'Connecting…'}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={S.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item, i) => ('type' in item ? `date-${i}` : item.id)}
            contentContainerStyle={S.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if ('type' in item) {
                return <Text style={S.dateSep}>{item.label}</Text>;
              }
              return <Bubble msg={item} isMe={item.senderId === currentUserId} />;
            }}
            ListEmptyComponent={
              <View style={S.emptyChat}>
                <Text style={S.emptyChatText}>
                  Send a message to start the conversation.
                </Text>
              </View>
            }
          />
        )}

        {/* Typing indicator */}
        {typingVisible && (
          <View style={S.typing}>
            <Text style={S.typingText}>{otherUser.firstName} is typing…</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={S.inputBar}>
          <TextInput
            style={S.input}
            value={input}
            onChangeText={handleTyping}
            placeholder="Message…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[S.sendBtn, (!input.trim() || !connected) && S.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || !connected || sending}
          >
            <Ionicons name="send" size={18} color={!input.trim() || !connected ? Colors.textMuted : '#fff'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  flex:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerAvatar:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerAvatarTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  headerInfo:     { flex: 1 },
  headerName:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  headerSub:      { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  list:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexGrow: 1, justifyContent: 'flex-end' },

  dateSep:  { alignSelf: 'center', fontSize: 11, color: Colors.textMuted, fontWeight: '600', backgroundColor: Colors.surfaceVariant, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginVertical: 12 },

  bubbleWrap:   { marginBottom: 4, maxWidth: '78%' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapThem:{ alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble:       { borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMe:     { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText:   { fontSize: FontSize.md, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem:{ color: Colors.textPrimary },
  bubbleTime:   { fontSize: 10, color: Colors.textMuted, marginTop: 2, marginHorizontal: 4 },

  emptyChat:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  typing:     { paddingHorizontal: Spacing.md, paddingBottom: 4 },
  typingText: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 8, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  input:      { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: Colors.surfaceVariant, borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: FontSize.md, color: Colors.textPrimary },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.surfaceVariant },
});
