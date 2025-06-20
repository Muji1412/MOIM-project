package com.example.moim.repository;

import com.example.moim.entity.Channels;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChannelRepository extends JpaRepository<Channels, Long> {

    // 특정 서버의 채널들을 생성 시간 순으로 조회 (중요: 채널 순서 유지)
    List<Channels> findByGroupNoOrderByChanCreatedAt(Long groupNo);

    // 특정 서버의 모든 채널 조회
    List<Channels> findByGroupNo(Long groupNo);

    // 서버 삭제 시 해당 서버의 모든 채널 삭제 (CASCADE)
    void deleteByGroupNo(Long groupNo);
}