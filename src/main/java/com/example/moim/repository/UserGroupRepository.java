package com.example.moim.repository;

import com.example.moim.entity.UserGroup;
import com.example.moim.util.UserGroupId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGroupRepository extends JpaRepository<UserGroup, UserGroupId> {
}
