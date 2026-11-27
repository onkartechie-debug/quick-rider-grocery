package com.quickrider.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @EnableAsync: order SMS notifications are sent off the request thread (OrderSmsNotifier).
 * @EnableScheduling: unpaid online orders are expired by PaymentExpiryJob.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncSchedulingConfig {
}
