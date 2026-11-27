package com.quickrider.integration.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** DEV-ONLY: logs SMS instead of sending, so the notification flow is testable without a gateway. */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.sms", name = "enabled", havingValue = "false", matchIfMissing = true)
public class ConsoleSmsSender implements SmsSender {

    @Override
    public void send(String mobile, String message) {
        log.info("[DEV SMS -> {}] {}", mask(mobile), message);
    }

    static String mask(String mobile) {
        if (mobile == null || mobile.length() < 4) {
            return "****";
        }
        return "******" + mobile.substring(mobile.length() - 4);
    }
}
