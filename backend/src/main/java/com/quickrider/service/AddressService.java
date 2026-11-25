package com.quickrider.service;

import com.quickrider.dto.request.AddressRequest;
import com.quickrider.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> list(Long userId);

    AddressResponse create(Long userId, AddressRequest request);

    AddressResponse update(Long userId, Long addressId, AddressRequest request);

    AddressResponse makeDefault(Long userId, Long addressId);

    void delete(Long userId, Long addressId);
}
