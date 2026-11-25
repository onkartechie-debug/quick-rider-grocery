package com.quickrider.service.impl;

import com.quickrider.dto.request.AddressRequest;
import com.quickrider.dto.response.AddressResponse;
import com.quickrider.entity.Address;
import com.quickrider.exception.BadRequestException;
import com.quickrider.exception.ResourceNotFoundException;
import com.quickrider.mapper.DtoMapper;
import com.quickrider.repository.AddressRepository;
import com.quickrider.repository.UserRepository;
import com.quickrider.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private static final int MAX_ADDRESSES = 10;

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> list(Long userId) {
        return addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId)
                .stream().map(DtoMapper::toAddress).toList();
    }

    @Override
    @Transactional
    public AddressResponse create(Long userId, AddressRequest request) {
        long existing = addressRepository.countByUserId(userId);
        if (existing >= MAX_ADDRESSES) {
            throw new BadRequestException("You can save up to " + MAX_ADDRESSES + " addresses");
        }
        boolean makeDefault = existing == 0 || Boolean.TRUE.equals(request.isDefault());
        if (makeDefault) {
            addressRepository.clearDefaultForUser(userId);
        }
        Address address = new Address();
        address.setUser(userRepository.getReferenceById(userId));
        apply(address, request);
        address.setDefaultAddress(makeDefault);
        return DtoMapper.toAddress(addressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressResponse update(Long userId, Long addressId, AddressRequest request) {
        owned(userId, addressId);
        if (Boolean.TRUE.equals(request.isDefault())) {
            // Bulk update clears the persistence context, so the address is re-loaded afterwards.
            addressRepository.clearDefaultForUser(userId);
        }
        Address address = owned(userId, addressId);
        apply(address, request);
        if (Boolean.TRUE.equals(request.isDefault())) {
            address.setDefaultAddress(true);
        }
        return DtoMapper.toAddress(address);
    }

    @Override
    @Transactional
    public AddressResponse makeDefault(Long userId, Long addressId) {
        owned(userId, addressId);
        addressRepository.clearDefaultForUser(userId);
        Address address = owned(userId, addressId);
        address.setDefaultAddress(true);
        return DtoMapper.toAddress(address);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long addressId) {
        Address address = owned(userId, addressId);
        boolean wasDefault = address.isDefaultAddress();
        addressRepository.delete(address);
        addressRepository.flush();
        if (wasDefault) {
            addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId)
                    .stream().findFirst()
                    .ifPresent(next -> next.setDefaultAddress(true));
        }
    }

    private Address owned(Long userId, Long addressId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Address", addressId));
    }

    private static void apply(Address address, AddressRequest r) {
        address.setLabel(StringUtils.hasText(r.label()) ? r.label().trim() : "Home");
        address.setLine1(r.line1().trim());
        address.setLine2(StringUtils.hasText(r.line2()) ? r.line2().trim() : null);
        address.setCity(r.city().trim());
        address.setPincode(r.pincode().trim());
    }
}
