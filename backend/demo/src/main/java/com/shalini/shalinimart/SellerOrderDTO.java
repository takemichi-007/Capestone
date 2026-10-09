package com.shalini.shalinimart;

public class SellerOrderDTO {

    private int orderId;
    private int customerId;
    private int productId;
    private String productName;
    private int quantity;
    private double price;
    private String status;
    private String color;
    private String size;
    private String phone;
    private String address;
    private String paymentMode;
    private String paymentStatus;

    public SellerOrderDTO() {
    }

    public SellerOrderDTO(
            int orderId,
            int customerId,
            int productId,
            String productName,
            int quantity,
            double price,
            String status,
            String color,
            String size,
            String phone,
            String address) {

        this.orderId = orderId;
        this.customerId = customerId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
        this.status = status;
        this.color = color;
        this.size = size;
        this.phone = phone;
        this.address = address;
        this.paymentMode = "OFFLINE";
        this.paymentStatus = "PENDING";
    }

    public SellerOrderDTO(
            int orderId,
            int customerId,
            int productId,
            String productName,
            int quantity,
            double price,
            String status,
            String color,
            String size,
            String phone,
            String address,
            String paymentMode,
            String paymentStatus) {

        this.orderId = orderId;
        this.customerId = customerId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
        this.status = status;
        this.color = color;
        this.size = size;
        this.phone = phone;
        this.address = address;
        this.paymentMode = paymentMode != null ? paymentMode : "OFFLINE";
        this.paymentStatus = paymentStatus != null ? paymentStatus : "PENDING";
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getProductId() {
        return productId;
    }

    public void setProductId(int productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
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

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
}