package com.quickrider.controller.admin;

import com.quickrider.dto.request.CreateShopRequest;
import com.quickrider.dto.request.ShopRequest;
import com.quickrider.dto.request.ShopStatusRequest;
import com.quickrider.dto.response.OwnerSummary;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ShopResponse;
import com.quickrider.service.ShopService;
import com.quickrider.util.PageUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminShopController {

    private final ShopService shopService;

    @GetMapping("/shops")
    public PageResponse<ShopResponse> list(@RequestParam(required = false) String q,
                                           @RequestParam(required = false) Boolean active,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return shopService.adminList(q, active, PageUtils.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/shops/{shopId}")
    public ShopResponse get(@PathVariable Long shopId) {
        return shopService.adminGet(shopId);
    }

    @PostMapping("/shops")
    public ResponseEntity<ShopResponse> create(@Valid @RequestBody CreateShopRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shopService.create(request));
    }

    @PutMapping("/shops/{shopId}")
    public ShopResponse update(@PathVariable Long shopId, @Valid @RequestBody ShopRequest request) {
        return shopService.update(shopId, request);
    }

    @PatchMapping("/shops/{shopId}/status")
    public ShopResponse setStatus(@PathVariable Long shopId, @Valid @RequestBody ShopStatusRequest request) {
        return shopService.setActive(shopId, request.active());
    }

    /** Shopkeepers without a shop, for the "assign existing shopkeeper" option in the onboarding form. */
    @GetMapping("/shopkeepers/available")
    public List<OwnerSummary> availableShopkeepers() {
        return shopService.availableShopkeepers();
    }
}
