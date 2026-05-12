package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.AuthResponse;
import com.jominsky.worldcupapp.dto.LoginRequest;
import com.jominsky.worldcupapp.dto.RegisterRequest;
import com.jominsky.worldcupapp.model.User;
import com.jominsky.worldcupapp.security.JwtUtil;
import com.jominsky.worldcupapp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(toAuthResponse(user, token));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = (User) auth.getPrincipal();
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(toAuthResponse(user, token));
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getDisplayName(), user.getRole().name());
    }
}
