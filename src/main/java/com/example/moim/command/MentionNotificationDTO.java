package com.example.moim.command;

public record MentionNotificationDTO(
        String groupId,
        String groupName,
        String message) {
}
