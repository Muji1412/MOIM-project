package com.example.moim.service.dm;

import com.example.moim.chatting.ChatMessage;
import com.example.moim.command.DirectMessageDTO;
import com.example.moim.command.DirectMessageRoomDTO;
import com.example.moim.entity.DirectMessage;
import com.example.moim.entity.DirectMessageRoom;
import com.example.moim.entity.Users;
import com.example.moim.repository.DirectMessageRepository;
import com.example.moim.repository.DirectMessageRoomRepository;
import com.example.moim.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DirectMessageService {

    private final DirectMessageRoomRepository dmRoomRepository;
    private final DirectMessageRepository dmRepository;
    private final UsersRepository usersRepository;

    @Transactional
    public DirectMessageRoomDTO createOrGetRoom(String currentUserNick, String recipientUserNick) {
        Users currentUser = usersRepository.findByUserNick(currentUserNick)
                .orElseThrow(() -> new IllegalArgumentException("현재 사용자를 찾을 수 없습니다."));
        Users recipientUser = usersRepository.findByUserNick(recipientUserNick)
                .orElseThrow(() -> new IllegalArgumentException("상대방 사용자를 찾을 수 없습니다."));

        DirectMessageRoom room = dmRoomRepository.findRoomByUsersWithUsers(currentUser, recipientUser)
                .orElseGet(() -> {
                    Users user1 = currentUser.getUserNo() < recipientUser.getUserNo() ? currentUser : recipientUser;
                    Users user2 = currentUser.getUserNo() < recipientUser.getUserNo() ? recipientUser : currentUser;

                    DirectMessageRoom newRoom = DirectMessageRoom.builder()
                            .user1(user1)
                            .user2(user2)
                            .build();
                    return dmRoomRepository.save(newRoom);
                });

        return new DirectMessageRoomDTO(room);
    }

    public List<DirectMessageRoomDTO> getRoomsForUser(String userNick) {
        Users user = usersRepository.findByUserNick(userNick)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<DirectMessageRoom> rooms = dmRoomRepository.findAllByUserWithUsers(user);
        for (DirectMessageRoom room : rooms) {
            System.out.println(room.getLastMessageSentAt());
        }

        rooms.sort(Comparator.comparing(DirectMessageRoom::getLastMessageSentAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        // 엔티티를 DTO로 변환
        return rooms.stream()
                .map(DirectMessageRoomDTO::new)
                .collect(Collectors.toList());
    }

    public List<DirectMessageDTO> getMessagesForRoom(Long roomId) {
        DirectMessageRoom room = dmRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        List<DirectMessage> messages = dmRepository.findByRoomOrderBySentAtAscWithSender(room);

        // 엔티티를 DTO로 변환
        return messages.stream()
                .map(DirectMessageDTO::new)
                .collect(Collectors.toList());


    }

    @Transactional
    public DirectMessage saveMessage(ChatMessage chatMessage) {
        Users sender = usersRepository.findByUserNick(chatMessage.getUser())
                .orElseThrow(() -> new IllegalArgumentException("발신자를 찾을 수 없습니다."));
        DirectMessageRoom room = dmRoomRepository.findById(Long.parseLong(chatMessage.getChannel()))
                .orElseThrow(() -> new IllegalArgumentException("DM방을 찾을 수 없습니다."));

        DirectMessage dm = DirectMessage.builder()
                .room(room)
                .sender(sender)
                .message(chatMessage.getText())
                .build();
        room.setLastMessageSentAt(LocalDateTime.now());
        dmRoomRepository.save(room);

        return dmRepository.save(dm);
    }

    //로그찍을라고
}
