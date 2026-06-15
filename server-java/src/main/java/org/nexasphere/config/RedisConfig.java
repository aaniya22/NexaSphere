package org.nexasphere.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Configures the shared RedisTemplate used for admin session persistence.
 *
 * <p>Sessions are stored under the key namespace {@code session:admin:{tokenHash}}
 * with a TTL of 8 hours. Both the Java backend and the Node.js backend read
 * from the same Redis instance, enabling stateless horizontal scaling without
 * cross-service HTTP calls for token validation.</p>
 *
 * <p>Uses {@link StringRedisSerializer} for both keys and values so that
 * session payloads are human-readable JSON strings — easily parseable from
 * any language runtime (Java, Node.js, Python, etc.).</p>
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer serializer = new StringRedisSerializer();
        template.setKeySerializer(serializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(serializer);
        template.setHashValueSerializer(serializer);

        template.afterPropertiesSet();
        return template;
    }
}
