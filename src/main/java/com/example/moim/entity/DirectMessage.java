package com.example.moim.entity;

import jakarta.persistence.*;
        import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "direct_message")
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private DirectMessageRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_no", nullable = false)
    private Users sender;

    @Column(nullable = false, length = 1000)
    private String message;


    @CreatedDate
    @Column
    private LocalDateTime sentAt;

    @Builder
    public DirectMessage(DirectMessageRoom room, Users sender, String message) {
        this.room = room;
        this.sender = sender;
        this.message = message;
    }
}
