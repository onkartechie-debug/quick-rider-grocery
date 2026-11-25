package com.quickrider.security.jwt;

import com.quickrider.security.CustomUserDetailsService;
import com.quickrider.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Authenticates requests from the HttpOnly access-token cookie. The user is re-loaded from the
 * database so disabled accounts and role changes take effect immediately. An invalid or stale
 * cookie is cleared and the request continues anonymously (protected routes then return 401).
 */
@Component
@RequiredArgsConstructor
public class JwtCookieAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthCookieService cookieService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        Optional<String> token = cookieService.readAccessToken(request);
        if (token.isPresent() && SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<UserPrincipal> principal = jwtService.extractUserId(token.get())
                    .flatMap(userDetailsService::loadById)
                    .filter(UserPrincipal::isEnabled);

            if (principal.isPresent()) {
                UserPrincipal user = principal.get();
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(auth);
                SecurityContextHolder.setContext(context);
            } else {
                cookieService.clearAccessToken(response);
            }
        }
        chain.doFilter(request, response);
    }
}
