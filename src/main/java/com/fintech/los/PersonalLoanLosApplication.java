package com.fintech.los;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PersonalLoanLosApplication {

    public static void main(String[] args) {
        SpringApplication.run(PersonalLoanLosApplication.class, args);
    }
}
