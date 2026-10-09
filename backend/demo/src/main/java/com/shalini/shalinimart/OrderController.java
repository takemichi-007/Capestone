package com.shalini.shalinimart;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public OrderController(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository) {

        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    // =========================================================
    // F5 - CHECKOUT
    // =========================================================

    @PostMapping("/checkout/{customerId}")
    public Object checkout(
            @PathVariable int customerId,
            @RequestBody(required = false) CheckoutRequest checkoutRequest) {

        // Get customer's cart
        List<CartItem> cartItems =
                cartItemRepository.findByCustomerId(customerId);

        // Check whether cart is empty
        if (cartItems.isEmpty()) {
            return "Cart is empty!";
        }

        // Calculate total amount
        double totalAmount = 0;

        for (CartItem item : cartItems) {

            totalAmount +=
                    item.getPrice() * item.getQuantity();
        }

        String phone = checkoutRequest != null ? checkoutRequest.getPhone() : "";
        String address = checkoutRequest != null ? checkoutRequest.getAddress() : "";
        String paymentMode = checkoutRequest != null && checkoutRequest.getPaymentMode() != null && !checkoutRequest.getPaymentMode().isBlank() 
                ? checkoutRequest.getPaymentMode().toUpperCase() : "OFFLINE";
        String paymentStatus = "ONLINE".equalsIgnoreCase(paymentMode) ? "PAID (CONFIRMED)" : "CASH ON DELIVERY (PENDING)";

        // Create order
        Order order =
                new Order(
                        customerId,
                        totalAmount,
                        "CONFIRMED",
                        phone,
                        address,
                        paymentMode,
                        paymentStatus
                );

        // Save order first
        Order savedOrder =
                orderRepository.save(order);

        // Create order items
        for (CartItem item : cartItems) {

            OrderItem orderItem =
                    new OrderItem(
                            savedOrder.getId(),
                            item.getProductId(),
                            item.getQuantity(),
                            item.getPrice(),
                            item.getColor(),
                            item.getSize()
                    );

            orderItemRepository.save(orderItem);
        }

        // Clear customer's cart
        cartItemRepository.deleteAll(cartItems);

        return savedOrder;
    }


    // =========================================================
    // F6 - CUSTOMER ORDER HISTORY
    // =========================================================

    @GetMapping("/customer/{customerId}")
    public List<Order> getCustomerOrders(
            @PathVariable int customerId) {

        return orderRepository.findByCustomerId(
                customerId
        );
    }


    // =========================================================
    // F6 - GET ORDER ITEMS
    // =========================================================

    @GetMapping("/{orderId}/items")
    public List<OrderItem> getOrderItems(
            @PathVariable int orderId) {

        return orderItemRepository.findByOrderId(
                orderId
        );
    }


    // =========================================================
    // SELLER INCOMING ORDERS
    // =========================================================

    @GetMapping("/seller/{sellerId}")
    public List<SellerOrderDTO> getSellerOrders(
            @PathVariable int sellerId) {

        List<Product> sellerProducts = productRepository.findBySellerId(sellerId);
        if (sellerProducts.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Integer, Product> productMap = sellerProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (p1, p2) -> p1));

        List<Integer> productIds = new ArrayList<>(productMap.keySet());
        List<OrderItem> orderItems = orderItemRepository.findByProductIdIn(productIds);

        List<SellerOrderDTO> dtoList = new ArrayList<>();
        for (OrderItem item : orderItems) {
            Product prod = productMap.get(item.getProductId());
            Optional<Order> orderOpt = orderRepository.findById(item.getOrderId());
            if (orderOpt.isPresent() && prod != null) {
                Order ord = orderOpt.get();
                dtoList.add(new SellerOrderDTO(
                        ord.getId(),
                        ord.getCustomerId(),
                        prod.getId(),
                        prod.getName(),
                        item.getQuantity(),
                        item.getPrice(),
                        ord.getStatus(),
                        item.getColor(),
                        item.getSize(),
                        ord.getPhone(),
                        ord.getAddress(),
                        ord.getPaymentMode(),
                        ord.getPaymentStatus()
                ));
            }
        }

        return dtoList;
    }


    // =========================================================
    // F8 - CUSTOMER RECEIVED ORDER
    // =========================================================

    @PutMapping("/{orderId}/received")
    public Object markOrderReceived(
            @PathVariable int orderId,
            @RequestParam int customerId) {

        // Find order
        Optional<Order> optionalOrder =
                orderRepository.findById(orderId);

        // Check order exists
        if (optionalOrder.isEmpty()) {

            return "Order not found!";
        }

        Order order =
                optionalOrder.get();

        // Check whether this order belongs to this customer
        if (order.getCustomerId() != customerId) {

            return "You cannot update this order!";
        }

        // Only CONFIRMED orders can be marked as RECEIVED
        if (!"CONFIRMED".equalsIgnoreCase(
                order.getStatus())) {

            return "Only confirmed orders can be marked as received!";
        }

        // Change status
        order.setStatus("RECEIVED");
        if ("OFFLINE".equalsIgnoreCase(order.getPaymentMode())) {
            order.setPaymentStatus("PAID ON DELIVERY (CONFIRMED)");
        }

        // Save updated order
        Order updatedOrder =
                orderRepository.save(order);

        // Return updated order as JSON
        return updatedOrder;
    }

    // =========================================================
    // CONFIRM PAYMENT (FOR ADMIN OR OFFLINE COLLECTION)
    // =========================================================
    @PutMapping("/{orderId}/confirm-payment")
    public Object confirmOrderPayment(@PathVariable int orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isEmpty()) {
            return "Order not found!";
        }
        Order order = optionalOrder.get();
        order.setPaymentStatus("PAID (CONFIRMED)");
        return orderRepository.save(order);
    }
}