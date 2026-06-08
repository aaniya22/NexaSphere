```java
package org.nexasphere.controller;

import jakarta.validation.Valid;
import org.nexasphere.model.entity.CollaborationTeamEntity;
import org.nexasphere.model.entity.JoinRequestEntity;
import org.nexasphere.service.crud.CollaborationService;
import org.owasp.encoder.Encode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collab")
@CrossOrigin(origins = "*")
public class CollaborationController {

    @Autowired
    private CollaborationService collaborationService;

    @GetMapping("/teams")
    public ResponseEntity<List<CollaborationTeamEntity>> getAllTeams() {
        return ResponseEntity.ok(collaborationService.getAllTeams());
    }

    @PostMapping("/teams")
    public ResponseEntity<CollaborationTeamEntity> createTeam(
            @Valid @RequestBody @NonNull CollaborationTeamEntity team) {

        // Sanitize user input fields
        if (team.getName() != null) {
            team.setName(Encode.forHtml(team.getName()));
        }

        if (team.getDescription() != null) {
            team.setDescription(Encode.forHtml(team.getDescription()));
        }

        return ResponseEntity.ok(collaborationService.createTeam(team));
    }

    @PostMapping("/requests")
    public ResponseEntity<JoinRequestEntity> submitJoinRequest(
            @Valid @RequestBody @NonNull JoinRequestEntity request) {

        // Sanitize user input fields
        if (request.getMessage() != null) {
            request.setMessage(Encode.forHtml(request.getMessage()));
        }

        return ResponseEntity.ok(collaborationService.submitJoinRequest(request));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<JoinRequestEntity> updateRequestStatus(
            @PathVariable @NonNull Long id,
            @RequestParam String status) {

        String safeStatus = Encode.forHtml(status);

        return collaborationService.updateRequestStatus(id, safeStatus)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
```
