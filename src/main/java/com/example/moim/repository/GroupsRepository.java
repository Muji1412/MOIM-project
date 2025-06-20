package com.example.moim.repository;

import com.example.moim.entity.Groups;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupsRepository extends JpaRepository<Groups, Long> {

    Optional<Groups> findByGroupNo(long groupNo);
}


