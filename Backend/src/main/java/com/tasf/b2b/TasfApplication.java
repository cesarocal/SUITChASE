package com.tasf.b2b;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TasfApplication {

    public static void main(String[] args) {
        SpringApplication.run(TasfApplication.class, args);
    }

}
