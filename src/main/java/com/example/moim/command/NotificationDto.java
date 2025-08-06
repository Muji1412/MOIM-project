package com.example.moim.command;

public record NotificationDto(
        Long userId,      // 알림을 받을 사용자의 ID
        String message    // 알림 메시지
) {
}