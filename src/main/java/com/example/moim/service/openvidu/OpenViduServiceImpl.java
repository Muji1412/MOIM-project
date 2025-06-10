package com.example.moim.service.openvidu;

import com.example.moim.exception.SessionNotFoundException;
import io.openvidu.java.client.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class OpenViduServiceImpl implements OpenViduService {

    private static final Logger logger = LoggerFactory.getLogger(OpenViduServiceImpl.class);

    @Value("${OPENVIDU_URL}")
    private String openviduUrl;

    @Value("${OPENVIDU_SECRET}")
    private String openviduSecret;

    private OpenVidu openvidu;

    @PostConstruct
    public void init() {
        this.openvidu = new OpenVidu(openviduUrl, openviduSecret);
        logger.info("OpenVidu 클라이언트 초기화 완료 - URL: {}", openviduUrl);
    }

    @Override
    public String createSession(Map<String, Object> params) throws OpenViduJavaClientException, OpenViduHttpException {
        SessionProperties.Builder propertiesBuilder = new SessionProperties.Builder();
        if (params != null && params.containsKey("customSessionId")) {
            propertiesBuilder.customSessionId((String) params.get("customSessionId"));
        }
        SessionProperties properties = propertiesBuilder.build();

        try {
            Session session = openvidu.createSession(properties);
            logger.info("세션 생성 성공: {}", session.getSessionId());
            return session.getSessionId();
        } catch (OpenViduHttpException e) {
            // 세션이 이미 존재하는 경우(409 Conflict), 기존 세션 ID를 반환
            if (e.getStatus() == 409 && params != null && params.containsKey("customSessionId")) {
                String existingSessionId = (String) params.get("customSessionId");
                logger.warn("세션이 이미 존재하여 기존 세션 ID를 반환합니다: {}", existingSessionId);
                return existingSessionId;
            }
            throw e; // 그 외의 HTTP 오류는 다시 던져서 컨트롤러에서 처리
        }
    }

    @Override
    public String createConnection(String sessionId, Map<String, Object> params) throws OpenViduJavaClientException, OpenViduHttpException {
        Session session = openvidu.getActiveSession(sessionId);
        if (session == null) {
            throw new SessionNotFoundException("요청된 세션을 찾을 수 없습니다: " + sessionId);
        }

        ConnectionProperties properties = buildConnectionProperties(params);
        Connection connection = session.createConnection(properties);

        logger.info("연결 생성 성공 - 세션: {}, 연결ID: {}", sessionId, connection.getConnectionId());
        return connection.getToken();
    }

    @Override
    public boolean isServiceHealthy() {
        try {
            openvidu.fetch();
            return true;
        } catch (Exception e) {
            logger.error("OpenVidu 서비스 헬스체크 실패: {}", e.getMessage());
            return false;
        }
    }

    private ConnectionProperties buildConnectionProperties(Map<String, Object> params) {
        if (params == null || params.isEmpty()) {
            return new ConnectionProperties.Builder().build();
        }
        return ConnectionProperties.fromJson(params).build();
    }
}
