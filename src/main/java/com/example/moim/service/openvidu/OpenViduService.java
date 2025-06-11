package com.example.moim.service.openvidu;

import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;

import java.util.Map;

public interface OpenViduService {

    /**
     * OpenVidu 세션을 생성하고 세션 ID를 반환합니다.
     * @param params 세션 속성 파라미터
     * @return 생성된 세션의 ID
     */
    String createSession(Map<String, Object> params) throws OpenViduJavaClientException, OpenViduHttpException;

    /**
     * 지정된 세션에 대한 연결을 생성하고 토큰을 반환합니다.
     * @param sessionId 연결을 생성할 세션의 ID
     * @param params 연결 속성 파라미터
     * @return 생성된 연결의 토큰
     */
    String createConnection(String sessionId, Map<String, Object> params) throws OpenViduJavaClientException, OpenViduHttpException;

    /**
     * OpenVidu 서비스의 상태를 확인합니다.
     * @return 서비스가 정상이면 true, 아니면 false
     */
    boolean isServiceHealthy();
}
