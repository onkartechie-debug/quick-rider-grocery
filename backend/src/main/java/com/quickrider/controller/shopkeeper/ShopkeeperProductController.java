package com.quickrider.controller.shopkeeper;

import com.quickrider.dto.request.ProductRequest;
import com.quickrider.dto.request.StockUpdateRequest;
import com.quickrider.dto.response.CategoryResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ProductResponse;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.ProductService;
import com.quickrider.util.PageUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/shopkeeper")
@PreAuthorize("hasRole('SHOPKEEPER')")
@RequiredArgsConstructor
public class ShopkeeperProductController {

    private final ProductService productService;

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return productService.categories();
    }

    @GetMapping("/products")
    public PageResponse<ProductResponse> list(@CurrentUser UserPrincipal user,
                                              @RequestParam(required = false) Long categoryId,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return productService.shopkeeperList(user.getId(), categoryId, q,
                PageUtils.of(page, size, Sort.by("name").ascending()));
    }

    @GetMapping("/products/{productId}")
    public ProductResponse get(@CurrentUser UserPrincipal user, @PathVariable Long productId) {
        return productService.shopkeeperGet(user.getId(), productId);
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> create(@CurrentUser UserPrincipal user,
                                                  @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(user.getId(), request));
    }

    @PutMapping("/products/{productId}")
    public ProductResponse update(@CurrentUser UserPrincipal user, @PathVariable Long productId,
                                  @Valid @RequestBody ProductRequest request) {
        return productService.update(user.getId(), productId, request);
    }

    @PatchMapping("/products/{productId}/stock")
    public ProductResponse updateStock(@CurrentUser UserPrincipal user, @PathVariable Long productId,
                                       @Valid @RequestBody StockUpdateRequest request) {
        return productService.updateStock(user.getId(), productId, request);
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<Void> delete(@CurrentUser UserPrincipal user, @PathVariable Long productId) {
        productService.delete(user.getId(), productId);
        return ResponseEntity.noContent().build();
    }
}
