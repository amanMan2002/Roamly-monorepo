package com.example.roamlyBackend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {
     private final SecretKey secretKey;
     private final long expiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs){
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expiration = expirationMs;
    }

//    public String generateToken(UserDetails user){
//        Date now = new Date();
//        return Jwts.builder()
//                .subject(user.getUsername())
//                .issuedAt(now)
//                .expiration(
//                        new Date(now.getTime() + expiration)
//                )
//                .signWith(secretKey)
//                .compact();
//    }
public String generateToken(UserDetails user, Long userId) {
    Date now = new Date();
    return Jwts.builder()
            .subject(user.getUsername())
            .claim("userId", userId)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + expiration))
            .signWith(secretKey)
            .compact();
}

    public String extractUsername(String token){
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(
            String token,
            UserDetails userDetails) {

        String username = extractUsername(token);

        return username.equals(userDetails.getUsername())
                && extractAllClaims(token)
                .getExpiration()
                .after(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
