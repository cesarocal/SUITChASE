package com.tasf.b2b.security;

import com.tasf.b2b.domain.UsuarioEntity;
import com.tasf.b2b.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        UsuarioEntity usuario = usuarioRepository.findByCorreo(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario o correo no encontrado: " + identifier));

        if (!usuario.getActivo()) {
            throw new UsernameNotFoundException("Usuario desactivado: " + identifier);
        }

        String principalName = usuario.getCorreo();

        return new User(
                principalName,
                usuario.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()))
        );
    }
}
