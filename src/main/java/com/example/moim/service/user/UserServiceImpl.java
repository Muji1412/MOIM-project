package com.example.moim.service.user;

import com.example.moim.command.*;
import com.example.moim.entity.RefreshToken;
import com.example.moim.entity.Users;
import com.example.moim.jwt.JWTService;
import com.example.moim.jwt.TokenType;
import com.example.moim.repository.RefreshTokenRepository;
import com.example.moim.repository.UsersRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

@Slf4j
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
        //마지막로그인시간을 가입시간으로 넣기 위한 timestamp
        Date now = new Date();
        long time = now.getTime();
        Timestamp timestamp = new Timestamp(time);
        //user엔티티에 값 넣어 repository에 save
        Users user = new Users();
        user.setUsername(uservo.getUsername());
        user.setPassword(passwordEncoder.encode(uservo.getPassword()));
        user.setUserEmail(uservo.getUserEmail());
        user.setUserNick(uservo.getUserNick());
        user.setUserPhone(uservo.getUserPhone());
        user.setUserLastLoggedDate(timestamp);

        return usersRepository.save(user);
        }

    //로그인 메서드 - 인증 토큰과 리프레시 토큰이 들어 있는 TokenResponseVO 반환
    @Override
    public TokenResponseVO login(LoginDTO loginDTO) {
        //로그인VO에서 아이디와 비밀번호를 받아 DB에 해당 아이디 존재여부 및 존재시 비밀번호가 일치하는지 검사
        String username = loginDTO.getUsername();
        String password = loginDTO.getPassword();
        Optional<Users> user = usersRepository.findByUsername(username);
        if(user.isEmpty()) {
            throw new IllegalArgumentException("아이디가 없습니다.");
        } else if (!passwordEncoder.matches(password, user.get().getPassword())) {
            log.info("내가 입력한거 "+passwordEncoder.encode(password));
            log.info("DB에 있던거 "+user.get().getPassword());
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        } else if (user.get().isUserIsDeleted()) {
            throw new EntityNotFoundException("탈퇴한 유저입니다.");
        }

        Users users = user.get();

        //토큰에 넣을 값만을 필드로 갖는 vo 생성
        CustomUserInfoVO vo = new CustomUserInfoVO(
                                    user.get().getUserNo(),
                                    user.get().getUsername(),
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
        refreshTokenEntity.setTokenCreated(new Timestamp(System.currentTimeMillis()));
        refreshTokenEntity.setTokenExpires(Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
        refreshTokenRepository.save(refreshTokenEntity);

        return new TokenResponseVO(token,refreshToken); //토큰들이 든 vo 반환
    }

    //액세스 토큰 만료시 리프레시 토큰 확인하여 액세스 토큰과 리프레시 토큰 재생성 및 반환
    @Override
    public TokenResponseVO refresh(String refreshToken) {
        //리프레시토큰의 토큰타입 가져옴
        TokenType tokenType = jwtService.parseClaims(refreshToken).get("tokenType", TokenType.class);
        //리프레시토큰의 만료 및 유효성 검사하여 토큰 만료되었을 경우 빈 토큰vo 반환 -> 컨트롤러에서 빈 토큰vo 오는경우 재로그인 유도
        if(!jwtService.validateToken(refreshToken, tokenType)) {
            return new TokenResponseVO(null, null);
            //return  ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("리프레시 토큰이 만료되었거나 유효하지 않습니다.");
        }
        //리프레시토큰이 만료되지 않은 경우 토큰 내용을 가져와 DB의 리프레시토큰 테이블에서 값을 비교
        Optional<RefreshToken> storedTokenOpt = refreshTokenRepository.findByTokenCont(refreshToken);
        if(storedTokenOpt.isEmpty()) { //리프레시토큰이 없는 경우 빈 토큰vo 반환 -> 컨트롤러에서 빈 토큰vo 오는경우 재로그인 유도
            return new TokenResponseVO(null, null);
            //return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("리프레시 토큰을 찾을 수 없습니다.");
        }
        //DB의 리프레시토큰에 저장된 값과 일치 확인한 경우 토큰에서 User엔티티 생성 -> 새 토큰 생성하여 반환
        Users user = storedTokenOpt.get().getUser();
        CustomUserInfoVO userInfoVO = new CustomUserInfoVO(
                user.getUserNo(),
                user.getUsername(),
                null,
                user.getUserLastLoggedDate()
        );
        String newToken = jwtService.createToken(userInfoVO);
        String newRefreshToken = jwtService.createRefreshToken(userInfoVO);

        //기존 토큰 삭제
        refreshTokenRepository.delete(storedTokenOpt.get());

        //새 refresh token을 DB에 저장
        RefreshToken newRefreshTokenEntity = new RefreshToken();
        newRefreshTokenEntity.setTokenCont(newRefreshToken);
        newRefreshTokenEntity.setUser(user);
        newRefreshTokenEntity.setTokenExpires(Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
        refreshTokenRepository.save(newRefreshTokenEntity);

        return new TokenResponseVO(newToken, newRefreshToken);
    }

    //회원 정보 수정
    @Transactional
    @Override
    public Users modifyInfo(MyAccountDTO myAccountDTO) {
        Users user = usersRepository.findByUsername(myAccountDTO.username()).filter(u -> !u.isUserIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("해당하는 유저가 없습니다."));
        System.out.println("입력한 이메일"+myAccountDTO.userEmail());
        System.out.println("가져온 이메일"+user.getUsername());
        //이메일, 닉네임 중복 체크. 이때 자기자신의 이메일과 닉네임은 체크되지 않게 함
        if(!myAccountDTO.userEmail().equals(user.getUserEmail()) &&
                usersRepository.existsByUserEmail(myAccountDTO.userEmail())) {
            System.out.println(111);
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
        } else if (!myAccountDTO.userNick().equals(user.getUserNick()) &&
                usersRepository.existsByUserNick(myAccountDTO.userNick())) {
            System.out.println(222);
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다");
        }
        System.out.println(333);
        //user엔티티에 값 넣어 repository에 save
        user.setUserEmail(myAccountDTO.userEmail());
        user.setUserNick(myAccountDTO.userNick());
        user.setUserPhone(myAccountDTO.userPhone());
        user.setUserImg(myAccountDTO.userImg());
        user.setUserMsg(myAccountDTO.userMsg());

        return usersRepository.save(user);
    }

    //비밀번호 수정
    @Override
    public Users modifyPw(PWChangeDTO pwChangeDTO) {
        //dto의 유저아이디(username)을 받아 DB에서 해당 유저를 찾음
        Users user = usersRepository.findByUsername(pwChangeDTO.getUsername()).filter(u -> !u.isUserIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("해당하는 유저가 없습니다."));
        //기존 비밀번호 잘못 입력 시 오류 메시지 출력
        if (!passwordEncoder.matches(pwChangeDTO.getOldPw(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        //비밀번호 변경 후 DB에 저장
        user.setPassword(passwordEncoder.encode(pwChangeDTO.getNewPw()));
        //기존의 액세스 토큰 및 리프레쉬 토큰 삭제
        //Optional<RefreshToken> storedTokenOpt = refreshTokenRepository.findByUserUserNo(user.getUserNo());
        //storedTokenOpt.ifPresent(refreshTokenRepository::delete);

        return usersRepository.save(user);
    }

    //비밀번호 찾기 시 메일로 전송되는 임시비밀번호 생성
    @Override
    public String getTmpPw() {

        char[] charSet = new char[]{ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
                'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b',
                'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
                'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'};

        String newPassword = "";
        for (int i = 0; i < 10; i++) { //위 char[]에서 랜덤 10글자로 생성
            int idx = (int) (charSet.length * Math.random());
            newPassword += charSet[idx];
        }
        return newPassword;
    }

    //임시비밀번호 생성 후 DB에 기존 비밀번호를 임시비밀번호로 업데이트
    @Transactional
    @Override
    public void updatePw(String tmpPw, String email) {
        String encodedPw = passwordEncoder.encode(tmpPw); //임시비밀번호를 암호화
        //비밀번호 찾기 시 입력한 이메일을 통해 DB에서 해당 사용자를 찾은 뒤 비밀번호를 업데이트
        Users user = usersRepository.findByUserEmail(email).filter(u -> !u.isUserIsDeleted()).orElseThrow(
                () -> new EntityNotFoundException("해당 사용자가 없습니다."));
        user.setPassword(encodedPw);
        Timestamp now = new Timestamp(System.currentTimeMillis());
        user.setPasswordToken(now);
        usersRepository.save(user);
    }

    //비밀번호 찾기는 1시간에 한번으로 시간 제한
    @Transactional
    @Override
    public boolean updatePwToken(String username, String userEmail) {
        //사용자가 입력한 이메일로 DB에서 유저를 찾음
        System.out.println(username +" " + userEmail);
        Users user = usersRepository.findByUsernameAndUserEmail(username, userEmail).filter(u-> !u.isUserIsDeleted()).orElseThrow(
                () -> new EntityNotFoundException("해당 사용자가 없습니다."));
        //현재 시간
        Timestamp now = new Timestamp(System.currentTimeMillis());
        //유저가 마지막으로 비밀번호 찾기를 한 시간부터 아직 1시간이 지나지 않은 경우 false 반환
        if(user.getPasswordToken() != null &&
                now.getTime() - user.getPasswordToken().getTime() < 3600000) {
            return false;
        }
        //비밀번호 찾기가 처음이거나, 마지막으로 비밀번호 찾기를 한 지 1시간이 지난 경우 true를 반환
        return true;
    }

    //회원 탈퇴 - users 테이블의 user_is_deleted 컬럼을 true로 변경
    @Override
    public boolean deleteAccount(@RequestParam String password) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails principal = (CustomUserDetails)authentication.getPrincipal();
        String username = principal.getCustomUserInfoVO().getUsername();
        Users user = usersRepository.findByUsername(username).filter(u -> !u.isUserIsDeleted())
                .orElseThrow( () -> new EntityNotFoundException("유저가 없습니다."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
//            System.out.println("비밀번호 일치 여부: " + passwordEncoder.matches(password, user.getPassword()));
//            System.out.println("입력 비밀번호: " + password);
//            System.out.println("DB 비밀번호: " + user.getPassword());
            boolean isMatch = passwordEncoder.matches(password, user.getPassword());
//            System.out.println("일치 여부: " + isMatch);
            throw new IllegalArgumentException("비밀번호가 틀렸습니다.");
        }
        user.setUserIsDeleted(true);
        usersRepository.save(user);

        return true;
    }

    @Override
    public MyAccountDTO getMyAccount(long userNo) {
        Users user = usersRepository.findByUserNo(userNo)
                .filter(u -> !u.isUserIsDeleted()).orElseThrow(() -> new EntityNotFoundException("유저가 없습니다."));

        MyAccountDTO dto = new MyAccountDTO(user.getUserNo()
                                            , user.getUsername()
                                            , user.getUserEmail()
                                            , user.getUserNick()
                                            , user.getUserPhone()
                                            , user.getUserImg()
                                            , user.getUserMsg());
        return dto;
    }
}

//토큰에서 사용자 아이디 가져옴. 이 아이디로 DB에서 refresh token을 확인함
//String username = jwtService.getUsername(refreshToken);