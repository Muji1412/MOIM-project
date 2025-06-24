package com.example.moim.repository;

import com.example.moim.entity.UserGroup;
import com.example.moim.entity.Users;
import com.example.moim.util.UserGroupId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, UserGroupId> {

    // 사용자 번호로 속한 그룹 번호들만 조회 (간단한 방법)
    @Query("SELECT ug.id.groupNo FROM UserGroup ug WHERE ug.id.userNo = :userNo")
    List<Long> findGroupNosByUserNo(@Param("userNo") Long userNo);

    // 사용자가 특정 그룹에 속해있는지 확인
    @Query("SELECT COUNT(ug) > 0 FROM UserGroup ug WHERE ug.id.userNo = :userNo AND ug.id.groupNo = :groupNo")
    boolean existsByUserNoAndGroupNo(@Param("userNo") Long userNo, @Param("groupNo") Long groupNo);

    // 특정 그룹의 모든 사용자 조회
    @Query("SELECT ug.user FROM UserGroup ug WHERE ug.id.groupNo = :groupNo")
    List<Users> findUsersByGroupNo(@Param("groupNo") Long groupNo);
}
