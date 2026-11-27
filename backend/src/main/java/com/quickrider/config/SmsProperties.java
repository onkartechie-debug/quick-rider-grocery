package com.quickrider.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * SMS gateway settings (mytoday BulkSms) - see app.sms in application.yml. Credentials are only
 * required when {@code enabled=true}; MyTodaySmsSender validates them at startup.
 */
@ConfigurationProperties(prefix = "app.sms")
public record SmsProperties(
        boolean enabled,
        String baseUrl,
        String feedId,
        String username,
        String password,
        String jobName,
        String senderSuffix) {
}
