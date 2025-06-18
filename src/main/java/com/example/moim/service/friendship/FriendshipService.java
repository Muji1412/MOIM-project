package com.example.moim.service.friendship;

import com.example.moim.entity.Friendship;

import java.util.List;

public interface FriendshipService {
    void sendFriendRequest(Long requesterId, Long receiverId);
    void acceptFriendRequest(Long accepterId, Long requesterId);
    void rejectFriendRequest(Long accepterId, Long requesterId);
    void removeFriendship(Long accepterId, Long requesterId);
    List<Friendship> getFriends(Long userId);
    List<Friendship> getPendingRequests(Long userId);
}
