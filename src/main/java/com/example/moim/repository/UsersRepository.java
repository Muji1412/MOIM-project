package com.example.moim.repository;

import com.example.moim.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {

    boolean existsByUsername(String username);
    boolean existsByUserEmail(String userEmail);
    boolean existsByUserNick(String nickname);
    Optional<Users> findByUsername(String username);
    Optional<Users> findByUserEmail(String userEmail);
    Optional<Users> findByUserNickAndUserPhoneAndUserEmail(String nickname, String phone, String userEmail);
    Optional<Users> findByUsernameAndUserNickAndUserPhoneAndUserEmail(String username, String nickname, String phone, String userEmail);

}
