package com.example.moim.service.user;

import com.example.moim.command.CustomUserInfoVO;
import com.example.moim.command.LoginVO;
import com.example.moim.command.TokenResponseVO;
import com.example.moim.command.UserVO;
import com.example.moim.entity.RefreshToken;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.repository.UsersRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

@Service("UserService")
@Transactional
public class UserServiceImpl implements UserService {

    private final UsersRepository usersRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;

    public UserServiceImpl(UsersRepository usersRepository
            , RefreshTokenRepository refreshTokenRepository
            , PasswordEncoder passwordEncoder
            , JWTService jwtService) {
        this.usersRepository = usersRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    //가입 메서드
    public Users signUp(UserVO uservo) {
        //아이디, 이메일, 닉네임 중복 체크
        if(usersRepository.existsByUsername(uservo.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다");
        } else if(usersRepository.existsByUserEmail(uservo.getUserEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
        } else if (usersRepository.existsByUserNick(uservo.getUserNick())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다");
        }

        Date now = new Date();
        long time = now.getTime();
        Timestamp timestamp = new Timestamp(time);

        Users user = new Users();
        user.setUsername(uservo.getUsername());
        user.setPassword(passwordEncoder.encode(uservo.getPassword()));
        user.setUserEmail(uservo.getUserEmail());
        user.setUserNick(uservo.getUserNick());
        user.setUserPhone(uservo.getUserPhone());
        user.setUserLastLoggedDate(timestamp);
        user.setUserIsDeleted("n");

        return usersRepository.save(user);
        }

    //로그인 메서드 - 인증 토큰과 리프레시 토큰이 들어 있는 TokenResponseVO 반환
    @Override
    public TokenResponseVO login(LoginVO loginVO) {
        //로그인VO에서 아이디와 비밀번호를 받아 DB에 해당 아이디 존재여부 및 존재시 비밀번호가 일치하는지 검사
        String username = loginVO.getUsername();
        String password = loginVO.getPassword();
        Optional<Users> user = usersRepository.findByUsername(username);
        if(user.isEmpty()) {
            throw new IllegalArgumentException("아이디가 없습니다.");
        } else if (!passwordEncoder.matches(password, user.get().getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        Users users = user.get();

        //토큰에 넣을 값만을 필드로 갖는 vo 생성
        CustomUserInfoVO vo = new CustomUserInfoVO(
                                    user.get().getUserNo(),
                                    user.get().getUsername(),
                                    user.get().getUserEmail(),
                                    user.get().getUserNick(),
                                    null,
                                    user.get().getUserLastLoggedDate()
        );

        // 해당 vo jwtService에 전달하여 토큰 및 리프레시토큰 생성
        String token = jwtService.createToken(vo);
        String refreshToken = jwtService.createRefreshToken(vo);

        //refreshToken은 DB에 저장해 둔다
        RefreshToken refreshTokenEntity = new  RefreshToken();
        refreshTokenEntity.setTokenCont(refreshToken);
        refreshTokenEntity.setUser(users);
        refreshTokenEntity.setTokenExpires(Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
        refreshTokenRepository.save(refreshTokenEntity);

        return new TokenResponseVO(token,refreshToken); //토큰들이 든 vo 반환
    }


}
