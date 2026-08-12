package com.petpulse.app.report.repository;

import com.petpulse.app.report.entity.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WeeklyReportRepository
        extends JpaRepository<WeeklyReport, Long> {

    List<WeeklyReport> findByPetPetIdOrderByCreatedAtDesc(Long petId);
}