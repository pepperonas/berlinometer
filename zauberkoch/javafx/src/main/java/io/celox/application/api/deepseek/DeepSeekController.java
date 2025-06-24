package io.celox.application.api.deepseek;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/deepseek")
public class DeepSeekController {

    private final DeepSeekApiService deepSeekApiService;

    public DeepSeekController(DeepSeekApiService deepSeekApiService) {
        this.deepSeekApiService = deepSeekApiService;
    }

    @PostMapping("/query")
    public Mono<Map<String, Object>> queryDeepSeek(@RequestParam String input) {
        return deepSeekApiService.queryDeepSeek(input);
    }
}

