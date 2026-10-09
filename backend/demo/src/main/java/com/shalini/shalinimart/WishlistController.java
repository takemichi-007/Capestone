package com.shalini.shalinimart;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class WishlistController {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;

    public WishlistController(
            WishlistItemRepository wishlistItemRepository,
            ProductRepository productRepository) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
    }

    // =========================================================
    // GET WISHLIST ITEMS FOR A CUSTOMER
    // =========================================================
    @GetMapping("/{customerId}")
    public List<WishlistItem> getWishlist(@PathVariable int customerId) {
        return wishlistItemRepository.findByCustomerId(customerId);
    }

    // =========================================================
    // ADD PRODUCT TO WISHLIST
    // =========================================================
    @PostMapping
    public ResponseEntity<?> addToWishlist(@RequestBody WishlistItem wishlistItem) {
        if (wishlistItem.getCustomerId() <= 0 || wishlistItem.getProductId() <= 0) {
            return ResponseEntity.badRequest().body("Invalid customer ID or product ID");
        }

        // Check if product exists
        if (!productRepository.existsById(wishlistItem.getProductId())) {
            return ResponseEntity.badRequest().body("Product does not exist");
        }

        // Check if already in wishlist
        Optional<WishlistItem> existing = wishlistItemRepository.findByCustomerIdAndProductId(
                wishlistItem.getCustomerId(),
                wishlistItem.getProductId()
        );

        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        WishlistItem item = new WishlistItem(wishlistItem.getCustomerId(), wishlistItem.getProductId());
        WishlistItem saved = wishlistItemRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    // =========================================================
    // TOGGLE WISHLIST (ADD / REMOVE)
    // =========================================================
    @Transactional
    @PostMapping("/toggle")
    public ResponseEntity<?> toggleWishlist(@RequestBody WishlistItem wishlistItem) {
        if (wishlistItem.getCustomerId() <= 0 || wishlistItem.getProductId() <= 0) {
            return ResponseEntity.badRequest().body("Invalid customer ID or product ID");
        }

        Optional<WishlistItem> existing = wishlistItemRepository.findByCustomerIdAndProductId(
                wishlistItem.getCustomerId(),
                wishlistItem.getProductId()
        );

        if (existing.isPresent()) {
            wishlistItemRepository.delete(existing.get());
            return ResponseEntity.ok(java.util.Map.of("status", "REMOVED", "productId", wishlistItem.getProductId()));
        } else {
            WishlistItem item = new WishlistItem(wishlistItem.getCustomerId(), wishlistItem.getProductId());
            WishlistItem saved = wishlistItemRepository.save(item);
            return ResponseEntity.ok(java.util.Map.of("status", "ADDED", "item", saved));
        }
    }

    // =========================================================
    // REMOVE PRODUCT FROM WISHLIST BY ITEM ID
    // =========================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable int id) {
        if (!wishlistItemRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Wishlist item not found");
        }
        wishlistItemRepository.deleteById(id);
        return ResponseEntity.ok("Item removed from wishlist");
    }

    // =========================================================
    // REMOVE PRODUCT FROM WISHLIST BY CUSTOMER AND PRODUCT ID
    // =========================================================
    @Transactional
    @DeleteMapping("/customer/{customerId}/product/{productId}")
    public ResponseEntity<?> removeByCustomerAndProduct(
            @PathVariable int customerId,
            @PathVariable int productId) {
        wishlistItemRepository.deleteByCustomerIdAndProductId(customerId, productId);
        return ResponseEntity.ok("Item removed from wishlist");
    }
}
