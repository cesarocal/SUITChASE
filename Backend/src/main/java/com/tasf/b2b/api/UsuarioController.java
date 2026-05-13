package com.tasf.b2b.api;

import com.tasf.b2b.domain.UsuarioEntity;
import com.tasf.b2b.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<UsuarioEntity> getAll() {
        return usuarioRepository.findAll();
    }

    @GetMapping("/operarios")
    public List<UsuarioEntity> getOperarios() {
        return usuarioRepository.findByRol(UsuarioEntity.Rol.OPERARIO);
    }

    @PostMapping
    public UsuarioEntity create(@RequestBody UsuarioEntity usuario) {
        if (usuario.getPasswordHash() != null) {
            usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        } else {
            usuario.setPasswordHash(passwordEncoder.encode("password")); // default
        }
        return usuarioRepository.save(usuario);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioEntity> update(@PathVariable Long id, @RequestBody UsuarioEntity details) {
        return usuarioRepository.findById(id).map(usuario -> {
            usuario.setNombreCompleto(details.getNombreCompleto());
            usuario.setDni(details.getDni());
            usuario.setCorreo(details.getCorreo());
            usuario.setTelefono(details.getTelefono());
            usuario.setGenero(details.getGenero());
            usuario.setFechaNacimiento(details.getFechaNacimiento());
            usuario.setAeropuertoOaci(details.getAeropuertoOaci());
            usuario.setActivo(details.getActivo());
            if (details.getPasswordHash() != null && !details.getPasswordHash().isEmpty()) {
                usuario.setPasswordHash(passwordEncoder.encode(details.getPasswordHash()));
            }
            return ResponseEntity.ok(usuarioRepository.save(usuario));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (usuarioRepository.existsById(id)) {
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
