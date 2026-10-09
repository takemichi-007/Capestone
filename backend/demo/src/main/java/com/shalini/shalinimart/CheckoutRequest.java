package com.shalini.shalinimart;

public class CheckoutRequest {

    private String phone;
    private String address;
    private String paymentMode; // "ONLINE" or "OFFLINE"
    private String onlinePaymentMethod; // "UPI", "CARD", "NETBANKING"
    private String transactionRef;

    public CheckoutRequest() {
    }

    public CheckoutRequest(String phone, String address) {
        this.phone = phone;
        this.address = address;
        this.paymentMode = "OFFLINE";
    }

    public CheckoutRequest(String phone, String address, String paymentMode) {
        this.phone = phone;
        this.address = address;
        this.paymentMode = paymentMode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getOnlinePaymentMethod() {
        return onlinePaymentMethod;
    }

    public void setOnlinePaymentMethod(String onlinePaymentMethod) {
        this.onlinePaymentMethod = onlinePaymentMethod;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }
}
