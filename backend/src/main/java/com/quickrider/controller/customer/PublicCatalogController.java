package com.quickrider.controller.customer;

import com.quickrider.dto.response.CategoryResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ProductResponse;
import com.quickrider.dto.response.ShopResponse;
import com.quickrider.service.ProductService;
import com.quickrider.service.ShopService;
import com.quickrider.util.PageUtils;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Read-only storefront endpoints, open to anonymous visitors so customers can browse before logging in. */
@Validated
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicCatalogController {

    private final ShopService shopService;
    private final ProductService productService;

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return productService.categories();
    }

    @GetMapping("/shops")
    public PageResponse<ShopResponse> shops(
            @RequestParam(required = false) @Pattern(regexp = "^$|^[0-9]{6}$", message = "Pincode must be 6 digits") String pincode,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Sort sort = Sort.by(Sort.Order.desc("rating"), Sort.Order.asc("name"));
        return shopService.discover(pincode, q, PageUtils.of(page, size, sort));
    }

    @GetMapping("/shops/{shopId}")
    public ShopResponse shop(@PathVariable Long shopId) {
        return shopService.publicGet(shopId);
    }

    @GetMapping("/shops/{shopId}/products")
    public PageResponse<ProductResponse> products(@PathVariable Long shopId,
                                                  @RequestParam(required = false) Long categoryId,
                                                  @RequestParam(required = false) String q,
                                                  @RequestParam(defaultValue = "false") boolean inStockOnly,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "40") int size) {
        return productService.publicList(shopId, categoryId, q, inStockOnly,
                PageUtils.of(page, size, Sort.by("name").ascending()));
    }
}
