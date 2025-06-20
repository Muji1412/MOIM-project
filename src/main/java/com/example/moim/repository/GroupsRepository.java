package com.example.moim.repository;

import com.example.moim.entity.Groups;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupsRepository extends JpaRepository<Groups, Long> {

    // 사용자가 소유한 서버 조회
    @Query("SELECT g FROM Groups g WHERE g.groupOwnerId = :userId")
    List<Groups> findByGroupOwnerId(@Param("userId") String userId);

    // 소유자별 서버 개수 조회
    long countByGroupOwnerId(String groupOwnerId);

    // 서버 이름으로 검색
    List<Groups> findByGroupNameContaining(String groupName);

    // 특정 기간 이후 생성된 서버 조회
    @Query("SELECT g FROM Groups g WHERE g.groupCreatedAt >= :fromDate")
    List<Groups> findGroupsCreatedAfter(@Param("fromDate") java.sql.Timestamp fromDate);

    // 서버 존재 여부 확인 (소유자 기준)
    boolean existsByGroupNoAndGroupOwnerId(Long groupNo, String groupOwnerId);

    //그룹번호로 그룹찾기 - 캘린더 일정넣을때
    Optional<Groups> findByGroupNo(long groupNo);
}
