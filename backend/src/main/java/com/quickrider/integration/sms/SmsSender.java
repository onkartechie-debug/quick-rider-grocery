package com.quickrider.integration.sms;

/**
 * Delivers a text message to an Indian mobile number. Implementations must never throw: an SMS
 * outage must not break the business operation that triggered it.
 * <ul>
 *   <li>{@link ConsoleSmsSender} - default (app.sms.enabled=false): logs instead of sending.</li>
 *   <li>{@link MyTodaySmsSender} - app.sms.enabled=true: mytoday BulkSms gateway.</li>
 * </ul>
 */
public interface SmsSender {

    /**
     * @param mobile  10-digit Indian mobile number (no country code)
     * @param message the text; in India it must match a DLT-registered template for the sender
     */
    void send(String mobile, String message);
}
