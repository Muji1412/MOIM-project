package com.example.moim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;


@Entity
@Table(name = "group")
@Getter
@Setter
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GROUP_NO")
    private Long groupNo;

    @Column(name = "GROUP_NAME", nullable = false, length = 40)
    private String groupName;

    @Column(name = "GROUP_CREATED_AT")
    private Timestamp groupCreatedAt;

    @Column(name = "GROUP_OWNER_ID", length = 20)
    private String groupOwnerId;
}
