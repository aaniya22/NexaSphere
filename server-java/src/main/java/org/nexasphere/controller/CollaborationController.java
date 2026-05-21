package org.nexasphere.controller;

import org.nexasphere.model.entity.CollaborationTeamEntity;
import org.nexasphere.model.entity.JoinRequestEntity;
import org.nexasphere.service.crud.CollaborationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collab")
@CrossOrigin(origins = "*") // Adjust based on security configuration
public class CollaborationController {

    @Autowired
    private CollaborationService collaborationService;

    @GetMapping("/teams")
    public ResponseEntity<List<CollaborationTeamEntity>> getAllTeams() {
        return ResponseEntity.ok(collaborationService.getAllTeams());
    }

    @PostMapping("/teams")
    public ResponseEntity<CollaborationTeamEntity> createTeam(@RequestBody CollaborationTeamEntity team) {
        return ResponseEntity.ok(collaborationService.createTeam(team));
    }

    @PostMapping("/requests")
    public ResponseEntity<JoinRequestEntity> submitJoinRequest(@RequestBody JoinRequestEntity request) {
        return ResponseEntity.ok(collaborationService.submitJoinRequest(request));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<JoinRequestEntity> updateRequestStatus(@PathVariable Long id, @RequestParam String status) {
        return collaborationService.updateRequestStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
