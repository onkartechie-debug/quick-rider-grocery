package com.quickrider.security;

import com.quickrider.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim())
                .map(UserPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
    }

    @Transactional(readOnly = true)
    public Optional<UserPrincipal> loadById(Long id) {
        return userRepository.findById(id).map(UserPrincipal::new);
    }
}
