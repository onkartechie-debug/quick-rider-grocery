package com.quickrider.service.impl;

import com.quickrider.dto.request.ProductRequest;
import com.quickrider.dto.request.StockUpdateRequest;
import com.quickrider.dto.response.CategoryResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ProductResponse;
import com.quickrider.entity.Category;
import com.quickrider.entity.Product;
import com.quickrider.entity.Shop;
import com.quickrider.exception.BadRequestException;
import com.quickrider.exception.ConflictException;
import com.quickrider.exception.ResourceNotFoundException;
import com.quickrider.mapper.DtoMapper;
import com.quickrider.repository.CategoryRepository;
import com.quickrider.repository.ProductRepository;
import com.quickrider.repository.ShopRepository;
import com.quickrider.repository.spec.ProductSpecifications;
import com.quickrider.service.ProductService;
import com.quickrider.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ShopRepository shopRepository;
    private final ShopService shopService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> shopkeeperList(Long ownerId, Long categoryId, String q, Pageable pageable) {
        Shop shop = shopService.requireShopOfOwner(ownerId);
        return PageResponse.of(
                productRepository.findAll(ProductSpecifications.filter(shop.getId(), categoryId, q, false, false), pageable),
                DtoMapper::toProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse shopkeeperGet(Long ownerId, Long productId) {
        return DtoMapper.toProduct(ownedProduct(ownerId, productId));
    }

    @Override
    @Transactional
    public ProductResponse create(Long ownerId, ProductRequest request) {
        Shop shop = shopService.requireShopOfOwner(ownerId);
        if (productRepository.existsByShopIdAndNameIgnoreCaseAndUnitIgnoreCase(
                shop.getId(), request.name().trim(), request.unit().trim())) {
            throw new ConflictException("A product with this name and unit already exists in your shop");
        }
        Product product = new Product();
        product.setShop(shop);
        apply(product, request);
        return DtoMapper.toProduct(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse update(Long ownerId, Long productId, ProductRequest request) {
        Product product = ownedProduct(ownerId, productId);
        if (productRepository.existsByShopIdAndNameIgnoreCaseAndUnitIgnoreCaseAndIdNot(
                product.getShop().getId(), request.name().trim(), request.unit().trim(), productId)) {
            throw new ConflictException("Another product with this name and unit already exists in your shop");
        }
        apply(product, request);
        return DtoMapper.toProduct(product);
    }

    @Override
    @Transactional
    public ProductResponse updateStock(Long ownerId, Long productId, StockUpdateRequest request) {
        Product product = ownedProduct(ownerId, productId);
        product.setStockQuantity(request.stockQuantity());
        if (request.available() != null) {
            product.setAvailable(request.available());
        }
        return DtoMapper.toProduct(product);
    }

    @Override
    @Transactional
    public void delete(Long ownerId, Long productId) {
        productRepository.delete(ownedProduct(ownerId, productId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> publicList(Long shopId, Long categoryId, String q,
                                                    boolean inStockOnly, Pageable pageable) {
        shopRepository.findByIdAndActiveTrue(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found or currently unavailable"));
        return PageResponse.of(
                productRepository.findAll(ProductSpecifications.filter(shopId, categoryId, q, true, inStockOnly), pageable),
                DtoMapper::toProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> categories() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream().map(DtoMapper::toCategory).toList();
    }

    /** Loads a product only if it belongs to the caller's shop; other shops' products look like 404. */
    private Product ownedProduct(Long ownerId, Long productId) {
        Shop shop = shopService.requireShopOfOwner(ownerId);
        return productRepository.findByIdAndShopId(productId, shop.getId())
                .orElseThrow(() -> ResourceNotFoundException.of("Product", productId));
    }

    private void apply(Product product, ProductRequest r) {
        Category category = categoryRepository.findById(r.categoryId())
                .orElseThrow(() -> new BadRequestException("Invalid category"));
        product.setCategory(category);
        product.setName(r.name().trim());
        product.setDescription(StringUtils.hasText(r.description()) ? r.description().trim() : null);
        product.setUnit(r.unit().trim());
        product.setPrice(r.price());
        product.setDiscountedPrice(r.discountedPrice());
        product.setStockQuantity(r.stockQuantity());
        product.setImageUrl(StringUtils.hasText(r.imageUrl()) ? r.imageUrl().trim() : null);
        product.setAvailable(r.available() == null || r.available());
    }
}
