package com.smartexam.platform.repository;

import com.smartexam.platform.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByConditionType(String conditionType);
    Optional<Badge> findByConditionTypeAndConditionValue(String conditionType, String conditionValue);
}
