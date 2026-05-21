package org.nexasphere.repository;

import org.nexasphere.model.entity.CollaborationTeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollaborationTeamRepository extends JpaRepository<CollaborationTeamEntity, Long> {
}
