package com.quickrider.controller.customer;

import com.quickrider.dto.request.AddressRequest;
import com.quickrider.dto.response.AddressResponse;
import com.quickrider.security.CurrentUser;
import com.quickrider.security.UserPrincipal;
import com.quickrider.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer/addresses")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CustomerAddressController {

    private final AddressService addressService;

    @GetMapping
    public List<AddressResponse> list(@CurrentUser UserPrincipal user) {
        return addressService.list(user.getId());
    }

    @PostMapping
    public ResponseEntity<AddressResponse> create(@CurrentUser UserPrincipal user,
                                                  @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.create(user.getId(), request));
    }

    @PutMapping("/{addressId}")
    public AddressResponse update(@CurrentUser UserPrincipal user, @PathVariable Long addressId,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(user.getId(), addressId, request);
    }

    @PatchMapping("/{addressId}/default")
    public AddressResponse makeDefault(@CurrentUser UserPrincipal user, @PathVariable Long addressId) {
        return addressService.makeDefault(user.getId(), addressId);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> delete(@CurrentUser UserPrincipal user, @PathVariable Long addressId) {
        addressService.delete(user.getId(), addressId);
        return ResponseEntity.noContent().build();
    }
}
