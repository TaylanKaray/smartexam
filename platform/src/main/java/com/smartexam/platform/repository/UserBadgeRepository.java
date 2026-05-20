package com.smartexam.platform.repository;

import com.smartexam.platform.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserId(Long userId);
    boolean existsByUserIdAndBadgeConditionType(Long userId, String conditionType);
    boolean existsByUserIdAndBadgeConditionTypeAndBadgeConditionValue(Long userId, String conditionType, String conditionValue);
}
