package com.tasf.b2b.api;

import com.tasf.b2b.domain.UsuarioEntity;
import com.tasf.b2b.repository.UsuarioRepository;
import com.tasf.b2b.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // ========================================
    // LOGIN — Público
    // ========================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            UsuarioEntity usuario = usuarioRepository.findByUsername(request.username())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String token = jwtService.generateToken(
                    usuario.getUsername(),
                    usuario.getRol().name(),
                    usuario.getAerolineaId()
            );

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", usuario.getUsername(),
                    "rol", usuario.getRol().name(),
                    "nombreCompleto", usuario.getNombreCompleto()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales inválidas"));
        }
    }

    // ========================================
    // REGISTRO — Solo ADMIN
    // ========================================
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody RegistroRequest request) {
        if (usuarioRepository.existsByUsername(request.username())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El username ya existe"));
        }

        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setUsername(request.username());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setNombreCompleto(request.nombreCompleto());
        usuario.setRol(UsuarioEntity.Rol.valueOf(request.rol()));
        usuario.setAerolineaId(request.aerolineaId());
        usuario.setActivo(true);

        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Usuario creado exitosamente",
                             "username", usuario.getUsername()));
    }

    // --- DTOs como records ---
    public record LoginRequest(String username, String password) {}
    public record RegistroRequest(String username, String password, String nombreCompleto,
                                  String rol, Long aerolineaId) {}
}
