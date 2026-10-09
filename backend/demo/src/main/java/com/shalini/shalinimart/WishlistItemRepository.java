package com.shalini.shalinimart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Integer> {

    List<WishlistItem> findByCustomerId(int customerId);

    Optional<WishlistItem> findByCustomerIdAndProductId(int customerId, int productId);

    void deleteByCustomerIdAndProductId(int customerId, int productId);
}
