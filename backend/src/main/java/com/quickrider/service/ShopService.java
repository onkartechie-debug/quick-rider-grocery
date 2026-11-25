package com.quickrider.service;

import com.quickrider.dto.request.CreateShopRequest;
import com.quickrider.dto.request.ShopRequest;
import com.quickrider.dto.response.OwnerSummary;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ShopResponse;
import com.quickrider.entity.Shop;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ShopService {

    // ----- Admin -----
    PageResponse<ShopResponse> adminList(String q, Boolean active, Pageable pageable);

    ShopResponse adminGet(Long shopId);

    ShopResponse create(CreateShopRequest request);

    ShopResponse update(Long shopId, ShopRequest request);

    ShopResponse setActive(Long shopId, boolean active);

    List<OwnerSummary> availableShopkeepers();

    // ----- Public / customer -----
    PageResponse<ShopResponse> discover(String pincode, String q, Pageable pageable);

    ShopResponse publicGet(Long shopId);

    // ----- Shopkeeper -----
    ShopResponse myShop(Long ownerId);

    /** Resolves the shop managed by a shopkeeper, or throws 404 if none is assigned. */
    Shop requireShopOfOwner(Long ownerId);
}
