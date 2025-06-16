package com.example.moim.command;

// PushSubscriptionDto.java
public record PushSubscriptionDto(String endpoint, Keys keys) {
    public record Keys(String p256dh, String auth) {}
}