package com.example.moim.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * OpenVidu 세션을 찾을 수 없을 때 발생하는 커스텀 예외.
 * 이 예외가 컨트롤러까지 전달되면 404 NOT FOUND 응답을 반환합니다.
 */
@ResponseStatus(value = HttpStatus.NOT_FOUND, reason = "해당 세션을 찾을 수 없습니다.")
public class SessionNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public SessionNotFoundException(String message) {
        super(message);
    }
}
