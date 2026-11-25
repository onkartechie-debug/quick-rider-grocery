package com.quickrider;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class QuickRiderApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuickRiderApplication.class, args);
    }
}
