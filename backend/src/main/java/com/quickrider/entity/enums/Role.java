package com.quickrider.entity.enums;

public enum Role {
    ADMIN,
    SHOPKEEPER,
    CUSTOMER;

    public String authority() {
        return "ROLE_" + name();
    }
}
