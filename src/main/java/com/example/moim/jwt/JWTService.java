package com.example.moim.jwt;


import com.example.moim.command.CustomUserInfoVO;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.ZonedDateTime;
import java.util.Date;

@Slf4j
@Component
public class JWTService {

    private final Key key;
    private final long accessTokenExpTime;

    public JWTService(@Value("${jwt.secret}") String secretKey,
                        @Value("${jwt.expiration_time}") long accessTokenExpTime) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpTime = accessTokenExpTime;
    }

    /**
     * JWT 생성
     * @param vo
     * @return JWT String
     */
    public String createToken(CustomUserInfoVO vo) {
        Claims claims = Jwts.claims();
        claims.put("userNo", vo.getUserNo());
        claims.put("username", vo.getUsername());
        claims.put("userEmail", vo.getUserEmail());
        claims.put("userNick", vo.getUserNick());
        claims.put("userLastLoggedDate", vo.getUserLastLoggedDate());

        ZonedDateTime now = ZonedDateTime.now();
        long expireTime = 10800000; //유효 3시간
        ZonedDateTime tokenValidity = now.plusSeconds(expireTime);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(Date.from(now.toInstant()))
                .setExpiration(Date.from(tokenValidity.toInstant()))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /*
    * 리프레시 토큰 생성
    * */
    public String createRefreshToken(CustomUserInfoVO vo) {
        Claims claims = Jwts.claims();
        claims.put("userNo", vo.getUserNo());
        claims.put("username", vo.getUsername());

        ZonedDateTime now = ZonedDateTime.now();
        long expireTime = 604800000; //유효 7일
        ZonedDateTime tokenValidity = now.plusSeconds(expireTime);

        return Jwts.builder()
                .setClaims(claims)
                .setExpiration(Date.from(tokenValidity.toInstant()))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Token에서 User ID 추출
     * @param token
     * @return User ID
     */
    public String getUsername(String token) {
        return parseClaims(token).get("username", String.class);
    }

    /**
     * JWT Claims 추출
     * @param accessToken
     * @return JWT Claims
     */
    public Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    /**
    * JWT 검증
    * @param token
    * @return IsValidate
    */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.info("Invalid Token", e);
        } catch (ExpiredJwtException e) {
            log.info("Expired Token", e);
        } catch (UnsupportedJwtException e) {
            log.info("Unsupported Token", e);
        } catch (IllegalArgumentException e) {
            log.info("JWT claims string is empty.", e);
        }
        return false;
    }


}


//    // JWT 토큰 생성
//    public static String createToken(CustomUserInfoVO vo) {
//    //암호화알고리즘
//    Algorithm algorithm = Algorithm.HMAC256(secretKey);
//    //만료시간
//    long expire = System.currentTimeMillis() + 10800000; //3시간
//
//    Claims claims = Jwts.claims();
//    claims.put("id", vo.getId());
//    claims.put("email", vo.getUserEmail());
//    claims.put("nickname", vo.getUserNick());
//
//    ZonedDateTime now = ZonedDateTime.now();
//    ZonedDateTime tokenValidity = now.plusSeconds(expire);
//
//
//    return Jwts.builder()
//             .setClaims(claims)
//             .setIssuedAt(Date.from(now.toInstant()))
//             .setExpiration(Date.from(tokenValidity.toInstant()))
//             .signWith(key)
//             .compact();
//
//
//    JWTCreator.Builder builder = JWT.create()
//            .withSubject(vo.getId()) // 토큰의 주제(subject) - 아이디
//            .withIssuedAt(new Date()) // 토큰 발급 시간 설정 (현재 시간)
//            .withExpiresAt(new Date(expire)) // 토큰 만료 시간 설정
//            .withIssuer("moim-login-service") //토큰발행자
//            .withClaim("admin", "나야나~"); //공개클래임

//    return builder.sign(algorithm); // 비밀 키로 서명하여 토큰 생성
//    }

//    //토큰검증
//    public static boolean validateToken(String token) throws TokenExpiredException, JWTVerificationException { //만료에러, 위조 에러
//        Algorithm algorithm = Algorithm.HMAC256(secretKey); //검증 알고리즘
//        JWTVerifier verifier = JWT.require(algorithm).build(); //token을 검증할 객체생성
//
//        verifier.verify(token); // 토큰 검증을 수행하며, 만료 시간도 자동으로 검사됨
//
//        return true; // 검증 성공 시 true 반환
//    }