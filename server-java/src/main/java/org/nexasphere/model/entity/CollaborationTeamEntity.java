package org.nexasphere.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Entity
@Table(name = "collab_teams")
public class CollaborationTeamEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String hackathonName;
    
    @Column(length = 1000)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "collab_team_roles", joinColumns = @JoinColumn(name = "team_id"))
    @Column(name = "role")
    private List<String> vacantRoles;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "collab_team_tech", joinColumns = @JoinColumn(name = "team_id"))
    @Column(name = "tech")
    private List<String> techStack;

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getHackathonName() { return hackathonName; }
    public void setHackathonName(String hackathonName) { this.hackathonName = hackathonName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<String> getVacantRoles() { return vacantRoles; }
    public void setVacantRoles(List<String> vacantRoles) { this.vacantRoles = vacantRoles; }
    
    public List<String> getTechStack() { return techStack; }
    public void setTechStack(List<String> techStack) { this.techStack = techStack; }
}
