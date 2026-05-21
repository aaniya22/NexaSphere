package org.nexasphere.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "collab_join_requests")
public class JoinRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id")
    private Long teamId;

    @Column(length = 2000)
    private String pitch;

    private String skills;
    private String github;

    // "PENDING", "ACCEPTED", "REJECTED"
    private String status = "PENDING";

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public String getPitch() { return pitch; }
    public void setPitch(String pitch) { this.pitch = pitch; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getGithub() { return github; }
    public void setGithub(String github) { this.github = github; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
