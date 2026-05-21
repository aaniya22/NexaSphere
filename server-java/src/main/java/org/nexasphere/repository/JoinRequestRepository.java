package org.nexasphere.repository;

import org.nexasphere.model.entity.JoinRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequestEntity, Long> {
    List<JoinRequestEntity> findByTeamId(Long teamId);
}
