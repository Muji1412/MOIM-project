package com.example.moim.repository;

import com.example.moim.entity.CalendarEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarRepository extends JpaRepository<CalendarEntity, Integer> {

    @Query("select c from CalendarEntity c where c.groups.groupNo = :groupNo")
    List<CalendarEntity> getCalendarsByGroupNo(@Param("groupNo") long groupNo);

}
