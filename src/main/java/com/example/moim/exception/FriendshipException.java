// src/main/java/com/example/moim/exception/FriendshipException.java

package com.example.moim.exception;

public class FriendshipException extends RuntimeException {

    public FriendshipException() {
        super();
    }

    public FriendshipException(String message) {
        super(message);
    }

    public FriendshipException(String message, Throwable cause) {
        super(message, cause);
    }

    public FriendshipException(Throwable cause) {
        super(cause);
    }
}
