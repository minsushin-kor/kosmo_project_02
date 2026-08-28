package com.petpulse.app.report.repository;

import com.petpulse.app.report.entity.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Modifying
    @Query("""
            delete from WeeklyReport report
            where report.pet.petId = :petId
              and report.startDate <= :recordDate
              and report.endDate >= :recordDate
            """)
    void deleteContainingRecordDate(
            @Param("petId") Long petId,
            @Param("recordDate") LocalDate recordDate);
}
