package com.example.moim.repository;

import com.example.moim.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {

    @Query("SELECT u.userNick FROM Users u WHERE u.username = :username")
    String findUserNickByUsername(@Param("username") String username);
    boolean existsByUsername(String username);
    boolean existsByUserEmail(String userEmail);
    boolean existsByUserNick(String nickname);
    Optional<Users> findByUserNo(long userNo);
    Optional<Users> findByUsername(String username);
    Optional<Users> findByUserEmail(String userEmail);
    Optional<Users> findByUsernameAndUserEmail(String username, String userEmail);
    Optional<Users> findByUserNickAndUserPhoneAndUserEmail(String nickname, String phone, String userEmail);
    Optional<Users> findByUsernameAndUserNickAndUserPhoneAndUserEmail(String username, String nickname, String phone, String userEmail);
    Optional<Users> findByUserNick(String userNick);
}
