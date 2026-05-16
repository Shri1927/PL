package com.fintech.los;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class PersonalLoanLosApplication {

    public static void main(String[] args) {
        // Ensure UTC timezone before anything starts
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(PersonalLoanLosApplication.class, args);
    }
}
