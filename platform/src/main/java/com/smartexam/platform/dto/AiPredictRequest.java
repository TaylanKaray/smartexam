package com.smartexam.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiPredictRequest {
    private int dogru;
    private int yanlis;
    private int sure;
    private int konuId;
}
