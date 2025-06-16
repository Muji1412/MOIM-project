package com.example.moim.controller;

import com.example.moim.entity.Group;
import com.example.moim.service.group.GroupService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(group));
    }

    @GetMapping("/{groupNo}")
    public ResponseEntity<Group> getGroup(@PathVariable Long groupNo) {
        return ResponseEntity.ok(groupService.getGroup(groupNo));
    }

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @PutMapping("/{groupNo}")
    public ResponseEntity<Group> updateGroup(@PathVariable Long groupNo, @RequestBody Group group) {
        return ResponseEntity.ok(groupService.updateGroup(groupNo, group));
    }

    @DeleteMapping("/{groupNo}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupNo) {
        groupService.deleteGroup(groupNo);
        return ResponseEntity.noContent().build();
    }
}

