package com.example.moim.repository;

import com.example.moim.entity.RefreshToken;
import com.example.moim.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenCont(String tokenCont);
    Optional<RefreshToken> findByUserNo(Long userNo);
}
