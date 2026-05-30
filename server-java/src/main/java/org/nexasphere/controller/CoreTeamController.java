package org.nexasphere.controller;

import jakarta.validation.Valid;
import org.nexasphere.model.entity.CoreTeamMemberEntity;
import org.nexasphere.repository.CoreTeamRepository;
import org.nexasphere.util.Sanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/admin/core-team")
@Tag(name = "Core Team Management", description = "Endpoints for managing the core team members")
public class CoreTeamController {

    private final CoreTeamRepository repo;
    private final Sanitizer sanitizer;

    public CoreTeamController(CoreTeamRepository repo, Sanitizer sanitizer) {
        this.repo = repo;
        this.sanitizer = sanitizer;
    }

    @GetMapping
    public Map<String, Object> getAll() {
        List<CoreTeamMemberEntity> members = repo.findAll();
        return Map.of("members", members);
    }

    @PostMapping
    public ResponseEntity<CoreTeamMemberEntity> add(@Valid @RequestBody CoreTeamMemberEntity member) {
        member.setId(null);
        member.setName(sanitizer.clean(member.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(member));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoreTeamMemberEntity> update(
            @PathVariable Long id,
            @Valid @RequestBody CoreTeamMemberEntity member) {

        return repo.findById(id).map(existing -> {
            if (member.getName() != null) {
                existing.setName(sanitizer.clean(member.getName()));
            }
            if (member.getRole() != null) {
                existing.setRole(member.getRole());
            }
            if (member.getBranch() != null) {
                existing.setBranch(member.getBranch());
            }
            if (member.getYear() != null) {
                existing.setYear(member.getYear());
            }
            if (member.getEmail() != null) {
                existing.setEmail(member.getEmail());
            }
            if (member.getLinkedin() != null) {
                existing.setLinkedin(member.getLinkedin());
            }
            if (member.getPhoto() != null) {
                existing.setPhoto(member.getPhoto());
            }

            CoreTeamMemberEntity saved = Objects.requireNonNull(
                    repo.save(existing), "saved member must not be null");
            return ResponseEntity.ok(saved);

        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        long safeId = Objects.requireNonNull(id, "id must not be null");
        if (!repo.existsById(safeId)) return ResponseEntity.notFound().build();
        repo.deleteById(safeId);
        return ResponseEntity.noContent().build();
    }
}
