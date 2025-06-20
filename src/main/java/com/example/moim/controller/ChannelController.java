package com.example.moim.controller;

import com.example.moim.entity.Channels;
import com.example.moim.service.channel.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    /**
     * 새로운 채널 생성
     * POST /api/groups/1/channels
     */
    @PostMapping
    public ResponseEntity<Channels> createChannel(@PathVariable Long groupId, @RequestParam("channel_name") String chanName) {


        try {
            Channels channel = channelService.createChannel(groupId, chanName);
            return ResponseEntity.ok(channel);
        } catch (Exception e) {
            System.err.println("채널 생성 실패: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * 채널 목록 조회
     * GET /api/groups/1/channels
     */
    @GetMapping
    public ResponseEntity<List<Channels>> getChannels(@PathVariable Long groupId) {
        List<Channels> channels = channelService.getChannelsByGroupNo(groupId);
        return ResponseEntity.ok(channels);
    }

    /**
     * 채널 이름 수정
     * POST /api/groups/1/channels/5/update
     */
    @PostMapping("/{channelId}/update")
    public ResponseEntity<Channels> updateChannel(@PathVariable Long channelId, @RequestParam String chanName) {
        Channels channel = channelService.updateChannel(channelId, chanName);
        return ResponseEntity.ok(channel);
    }

    /**
     * 채널 삭제
     * POST /api/groups/1/channels/5/delete
     */
    @PostMapping("/{channelId}/delete")
    public ResponseEntity<Void> deleteChannel(@PathVariable Long channelId) {
        channelService.deleteChannel(channelId);
        return ResponseEntity.ok().build();
    }
}
