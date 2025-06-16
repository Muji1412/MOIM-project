package com.example.moim.controller;

import com.example.moim.entity.Groups;
import com.example.moim.service.groups.GroupsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupsController {
    private final GroupsService groupsService;

    @PostMapping
    public ResponseEntity<Groups> createGroup(@RequestBody Groups groups) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupsService.createGroup(groups));
    }

    @GetMapping("/{groupNo}")
    public ResponseEntity<Groups> getGroup(@PathVariable Long groupNo) {
        return ResponseEntity.ok(groupsService.getGroup(groupNo));
    }

    @GetMapping
    public ResponseEntity<List<Groups>> getAllGroups() {
        return ResponseEntity.ok(groupsService.getAllGroups());
    }

    @PutMapping("/{groupNo}")
    public ResponseEntity<Groups> updateGroup(@PathVariable Long groupNo, @RequestBody Groups groups) {
        return ResponseEntity.ok(groupsService.updateGroup(groupNo, groups));
    }

    @DeleteMapping("/{groupNo}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupNo) {
        groupsService.deleteGroup(groupNo);
        return ResponseEntity.noContent().build();
    }
}

