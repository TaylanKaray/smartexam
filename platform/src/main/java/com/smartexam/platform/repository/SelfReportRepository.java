package com.smartexam.platform.repository;

import com.smartexam.platform.entity.SelfReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SelfReportRepository extends JpaRepository<SelfReport, Long> {
}
