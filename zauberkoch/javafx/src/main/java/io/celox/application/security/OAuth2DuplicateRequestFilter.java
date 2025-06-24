package io.celox.application.security;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@Component
public class OAuth2DuplicateRequestFilter extends OncePerRequestFilter {
    private final Set<String> processedAuthCodes = Collections.synchronizedSet(new HashSet<>());

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (uri.contains("/login/oauth2/code/")) {
            String code = request.getParameter("code");
            if (code != null) {
                if (processedAuthCodes.contains(code)) {
                    // Duplicate OAuth2 callback - redirect to login page
                    response.sendRedirect("/login");
                    return;
                }
                processedAuthCodes.add(code);
                // Add cleanup task to remove the code after a short delay
                new Timer().schedule(new TimerTask() {
                    @Override
                    public void run() {
                        processedAuthCodes.remove(code);
                    }
                }, 10000); // Remove after 10 seconds
            }
        }

        filterChain.doFilter(request, response);
    }
}
