package com.quickrider.util;

import com.quickrider.entity.Shop;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/** Business-time helpers (shop opening hours, "today" boundaries) in the platform's local time zone. */
@Component
public class BusinessClock {

    private final ZoneId zone;

    public BusinessClock(@Value("${app.business.timezone:Asia/Kolkata}") String timezone) {
        this.zone = ZoneId.of(timezone);
    }

    public ZoneId zone() {
        return zone;
    }

    public Instant startOfToday() {
        return LocalDate.now(zone).atStartOfDay(zone).toInstant();
    }

    /** Supports overnight hours, e.g. 18:00-02:00. Equal open/close times mean open 24 hours. */
    public boolean isOpenNow(Shop shop) {
        return isOpenAt(shop.getOpeningTime(), shop.getClosingTime(), LocalTime.now(zone));
    }

    public static boolean isOpenAt(LocalTime open, LocalTime close, LocalTime now) {
        if (open.equals(close)) {
            return true;
        }
        if (open.isBefore(close)) {
            return !now.isBefore(open) && now.isBefore(close);
        }
        return !now.isBefore(open) || now.isBefore(close);
    }
}
