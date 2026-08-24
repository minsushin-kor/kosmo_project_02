package com.petpulse.app.report.repository;

import com.petpulse.app.report.entity.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyReportRepository
        extends JpaRepository<WeeklyReport, Long> {

    List<WeeklyReport> findByPetPetIdOrderByCreatedAtDesc(Long petId);

    Optional<WeeklyReport> findByReportIdAndPetUserLoginId(
            Long reportId,
            String loginId);

    boolean existsByPetPetIdAndStartDateAndEndDate(
            Long petId,
            LocalDate startDate,
            LocalDate endDate);
}
