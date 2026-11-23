import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { messagingApi, MessageThread, ThreadParticipant } from '../../api/messaging.api';
import { useAuthStore } from '../../store/auth.store';

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AV_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function avatarColor(id: string) { return AV_COLORS[id.charCodeAt(0) % AV_COLORS.length]; }

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_THREADS: MessageThread[] = [
  {
    id: 't1', participantAId: 'me', participantBId: 'p1',
    referenceType: 'TRIP', referenceId: 'd1',
    lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
    participantA: { id: 'me', firstName: 'You', lastName: '', avatarUrl: null },
    participantB: { id: 'p1', firstName: 'Amina', lastName: 'Touré', avatarUrl: null },
    messages: [{ content: 'I have a small backpack, no problem right?', senderId: 'p1', createdAt: new Date(Date.now() - 1800000).toISOString(), isRead: false }],
  },
  {
    id: 't2', participantAId: 'me', participantBId: 'p2',
    referenceType: 'TRIP', referenceId: 'd1',
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    participantA: { id: 'me', firstName: 'You', lastName: '', avatarUrl: null },
    participantB: { id: 'p2', firstName: 'Liam', lastName: 'Nguyen', avatarUrl: null },
    messages: [{ content: 'Thanks, see you at Union Station!', senderId: 'me', createdAt: new Date(Date.now() - 86400000).toISOString(), isRead: true }],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const date = new Date(iso);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ─── Thread row ───────────────────────────────────────────────────────────────

function ThreadRow({
  thread, currentUserId, onPress,
}: {
  thread: MessageThread;
  currentUserId: string;
  onPress: () => void;
}) {
  const other: ThreadParticipant =
    thread.participantAId === currentUserId ? thread.participantB : thread.participantA;

  const lastMsg = thread.messages?.[0];
  const isUnread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUserId;
  const initials = `${other.firstName[0]}${other.lastName?.[0] ?? ''}`.toUpperCase();
  const bgColor = avatarColor(other.id);

  return (
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[S.rowAvatar, { backgroundColor: bgColor }]}>
        <Text style={S.rowAvatarTxt}>{initials}</Text>
      </View>

      <View style={S.rowBody}>
        <View style={S.rowTop}>
          <Text style={[S.rowName, isUnread && S.rowNameBold]}>
            {other.firstName} {other.lastName}
          </Text>
          <Text style={S.rowTime}>{timeAgo(thread.lastMessageAt)}</Text>
        </View>
        {lastMsg ? (
          <Text style={[S.rowPreview, isUnread && S.rowPreviewBold]} numberOfLines={1}>
            {lastMsg.senderId === currentUserId ? 'You: ' : ''}{lastMsg.content}
          </Text>
        ) : (
          <Text style={S.rowPreview}>No messages yet</Text>
        )}
      </View>

      {isUnread && <View style={S.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = { navigation: NativeStackNavigationProp<any> };

export default function ThreadListScreen({ navigation }: Props) {
  const user = useAuthStore(s => s.user);
  const currentUserId = user?.id ?? 'me';

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      const { data } = await messagingApi.listThreads();
      setThreads(Array.isArray(data) && data.length > 0 ? data : DUMMY_THREADS);
    } catch {
      setThreads(DUMMY_THREADS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const onRefresh = () => { setRefreshing(true); fetchThreads(); };

  const openChat = (thread: MessageThread) => {
    const other =
      thread.participantAId === currentUserId ? thread.participantB : thread.participantA;
    navigation.navigate('Chat', {
      threadId: thread.id,
      otherUser: other,
    });
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <View style={S.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={t => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <ThreadRow
              thread={item}
              currentUserId={currentUserId}
              onPress={() => openChat(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={S.sep} />}
          ListEmptyComponent={
            <View style={S.empty}>
              <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
              <Text style={S.emptyTitle}>No messages yet</Text>
              <Text style={S.emptyBody}>
                Start a conversation from a trip booking or passenger list.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:      { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: Colors.surface },
  rowAvatar:   { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  rowAvatarTxt:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  rowBody:     { flex: 1, marginLeft: 12 },
  rowTop:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  rowName:     { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  rowNameBold: { fontWeight: '700' },
  rowTime:     { fontSize: 12, color: Colors.textMuted },
  rowPreview:  { fontSize: 13, color: Colors.textMuted, fontWeight: '400' },
  rowPreviewBold: { color: Colors.textPrimary, fontWeight: '600' },
  unreadDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginLeft: 8 },

  sep:     { height: 1, backgroundColor: Colors.border, marginLeft: 74 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyBody:  { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
});
