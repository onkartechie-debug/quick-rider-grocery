package com.quickrider.integration.sms;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.quickrider.config.SmsProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Sends SMS through mytoday's BulkSms JsonSingleApi gateway (same provider/contract as the KMD
 * project's OTP sender). Active only when app.sms.enabled=true. Credentials have no defaults: a
 * missing value fails startup here instead of silently sending with a bogus credential.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.sms", name = "enabled", havingValue = "true")
public class MyTodaySmsSender implements SmsSender {

    private final RestClient restClient;
    private final long feedId;
    private final long username;
    private final String password;
    private final String jobName;

    public MyTodaySmsSender(RestClient.Builder builder, SmsProperties properties) {
        this.feedId = parseRequired("app.sms.feed-id", properties.feedId());
        this.username = parseRequired("app.sms.username", properties.username());
        this.password = required("app.sms.password", properties.password());
        this.jobName = required("app.sms.job-name", properties.jobName());

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(10_000);
        this.restClient = builder
                .baseUrl(required("app.sms.base-url", properties.baseUrl()))
                .requestFactory(requestFactory)
                .build();
        log.info("SMS gateway enabled (mytoday BulkSms, job {})", jobName);
    }

    @Override
    public void send(String mobile, String message) {
        String masked = ConsoleSmsSender.mask(mobile);
        if (mobile == null || !mobile.matches("^[6-9][0-9]{9}$")) {
            log.warn("Skipping SMS to invalid mobile {}", masked);
            return;
        }
        try {
            String response = restClient.post()
                    .uri("/BulkSms/JsonSingleApi")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(new Request(feedId, username, password, jobName, Long.parseLong(mobile), message))
                    .retrieve()
                    .body(String.class);
            // 2xx only means the gateway accepted the request; the body carries its req_id for tracing.
            log.info("SMS sent to {}: {}", masked, response);
        } catch (Exception ex) {
            log.error("Failed to send SMS to {}: {}", masked, ex.getMessage());
        }
    }

    private static String required(String name, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " must be set when app.sms.enabled=true");
        }
        return value.trim();
    }

    private static long parseRequired(String name, String value) {
        try {
            return Long.parseLong(required(name, value));
        } catch (NumberFormatException ex) {
            throw new IllegalStateException(name + " must be numeric", ex);
        }
    }

    /** JSON body for JsonSingleApi - feedid/username are numeric in this provider's contract. */
    record Request(
            @JsonProperty("feedid") long feedId,
            @JsonProperty("username") long username,
            @JsonProperty("password") String password,
            @JsonProperty("jobname") String jobName,
            @JsonProperty("mobile") long mobile,
            @JsonProperty("messages") String messages) {
    }
}
