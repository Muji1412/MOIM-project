package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "direct_message_room")
public class DirectMessageRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_no", nullable = false)
    private Users user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_no", nullable = false)
    private Users user2;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DirectMessage> messages = new ArrayList<>();

    private LocalDateTime lastMessageSentAt;


    @Builder
    public DirectMessageRoom(Users user1, Users user2) {
        this.user1 = user1;
        this.user2 = user2;
    }
}