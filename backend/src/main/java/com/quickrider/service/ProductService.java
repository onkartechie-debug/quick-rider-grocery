package com.quickrider.service;

import com.quickrider.dto.request.ProductRequest;
import com.quickrider.dto.request.StockUpdateRequest;
import com.quickrider.dto.response.CategoryResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {

    // ----- Shopkeeper (always scoped to the caller's own shop) -----
    PageResponse<ProductResponse> shopkeeperList(Long ownerId, Long categoryId, String q, Pageable pageable);

    ProductResponse shopkeeperGet(Long ownerId, Long productId);

    ProductResponse create(Long ownerId, ProductRequest request);

    ProductResponse update(Long ownerId, Long productId, ProductRequest request);

    ProductResponse updateStock(Long ownerId, Long productId, StockUpdateRequest request);

    void delete(Long ownerId, Long productId);

    // ----- Public storefront -----
    PageResponse<ProductResponse> publicList(Long shopId, Long categoryId, String q, boolean inStockOnly, Pageable pageable);

    List<CategoryResponse> categories();
}
