package com.fintech.los.common.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fintech.los.common.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (ex.getMessage().contains("credentials") || ex.getMessage().contains("not found") || ex.getMessage().contains("Unauthorized")) {
            status = HttpStatus.UNAUTHORIZED;
        }
        
        return ResponseEntity.status(status).body(
                ApiResponse.<Void>builder()
                        .timestamp(Instant.now())
                        .success(false)
                        .message(ex.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(
                ApiResponse.<Void>builder().timestamp(Instant.now()).success(false).message(msg).build()
        );
    }

    @ExceptionHandler(InvalidFormatException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidFormat(InvalidFormatException ex) {
        String message = "Invalid format for field: " + ex.getPath().get(0).getFieldName();
        // Check if it's a date field
        if (ex.getTargetType() != null && ex.getTargetType().equals(LocalDate.class)) {
            message = "Please enter a valid Date of Birth.";
        }
        return ResponseEntity.badRequest().body(
                ApiResponse.<Void>builder()
                        .timestamp(Instant.now())
                        .success(false)
                        .message(message)
                        .build()
        );
    }

    /**
     * BUG-002: Handles extreme/invalid date values (e.g. year 275760) that Jackson
     * fails to deserialize into LocalDate and wraps in HttpMessageNotReadableException
     * rather than InvalidFormatException. Without this handler, the raw
     * DateTimeParseException message was exposed to clients as a 500 error.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getCause();
        // Unwrap nested cause (Jackson wraps InvalidFormatException inside MismatchedInputException, etc.)
        while (cause != null) {
            if (cause instanceof DateTimeParseException) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.<Void>builder()
                                .timestamp(Instant.now())
                                .success(false)
                                .message("Please enter a valid Date of Birth (e.g. 1990-06-07).")
                                .build()
                );
            }
            if (cause instanceof InvalidFormatException ife
                    && ife.getTargetType() != null
                    && ife.getTargetType().equals(LocalDate.class)) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.<Void>builder()
                                .timestamp(Instant.now())
                                .success(false)
                                .message("Please enter a valid Date of Birth (e.g. 1990-06-07).")
                                .build()
                );
            }
            cause = cause.getCause();
        }
        // Generic malformed request
        log.warn("[GlobalExceptionHandler] Unreadable HTTP message: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                ApiResponse.<Void>builder()
                        .timestamp(Instant.now())
                        .success(false)
                        .message("Malformed request body. Please check your input and try again.")
                        .build()
        );
    }

    @ExceptionHandler({ConstraintViolationException.class, Exception.class})
    public ResponseEntity<ApiResponse<Void>> handleUnhandled(Exception ex) {
        // Log full detail server-side; never expose raw exception messages to clients.
        log.error("[GlobalExceptionHandler] Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.<Void>builder()
                        .timestamp(Instant.now())
                        .success(false)
                        .message("An unexpected error occurred. Please try again later.")
                        .build()
        );
    }
}
