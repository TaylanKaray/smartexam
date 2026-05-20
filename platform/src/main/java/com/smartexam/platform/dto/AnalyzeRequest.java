package com.smartexam.platform.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AnalyzeRequest {
    private Long userId;
    private String subject;
    private int dogru;
    private int yanlis;
    private int sure;
    private int konuId;
}
