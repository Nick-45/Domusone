// src/screens/CommunityScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Send, MessageCircle, ThumbsUp, User, Clock } from 'lucide-react-native';
import { tenantService } from '../services/supabaseService';
import { supabase } from '../config/supabase';

const CommunityScreen = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadCommunityData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('community_posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        (payload) => {
          setPosts(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const loadCommunityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profile, tenantDetails] = await Promise.all([
          tenantService.getTenantProfile(user.id),
          tenantService.getTenantDetails(user.id)
        ]);
        
        setUserProfile(profile);
        const communityPosts = await tenantService.getCommunityPosts(tenantDetails.building_id);
        setPosts(communityPosts);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load community posts');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityData();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantDetails = await tenantService.getTenantDetails(user.id);
      
      await tenantService.createCommunityPost(
        tenantDetails.building_id,
        'New Post',
        newPost,
        user.id
      );
      
      setNewPost('');
      Alert.alert('Success', 'Post created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      // Implement like functionality
      Alert.alert('Liked', 'Post liked!');
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = (now - postTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return postTime.toLocaleDateString();
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userAvatar}>
          <User size={20} color="#64748b" />
        </View>
        <View style={styles.postUserInfo}>
          <Text style={styles.userName}>{item.user_name || 'Tenant'}</Text>
          <View style={styles.postMeta}>
            <Clock size={12} color="#94a3b8" />
            <Text style={styles.postTime}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.postContent}>{item.message}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLikePost(item.id)}
        >
          <ThumbsUp size={16} color="#64748b" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={16} color="#64748b" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Create Post Section */}
      <View style={styles.createPostCard}>
        <TextInput
          style={styles.postInput}
          placeholder="What's happening in the building?"
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={500}
        />
        <View style={styles.postActionsBar}>
          <Text style={styles.charCount}>{newPost.length}/500</Text>
          <TouchableOpacity 
            style={[styles.postButton, (!newPost.trim() || loading) && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={!newPost.trim() || loading}
          >
            <Send size={16} color="white" />
            <Text style={styles.postButtonText}>
              {loading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No posts yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to start a conversation in your building!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  createPostCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postInput: {
    fontSize: 16,
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  postButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  postButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  postButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  postsList: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  postContent: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CommunityScreen;