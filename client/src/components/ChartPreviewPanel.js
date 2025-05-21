import React, { useState } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const paperSizes = {
  A4: { width: 210, height: 297 }, // mm
  A3: { width: 297, height: 420 },
  custom: null,
};

const mmToPx = (mm) => mm * 3.78;

const ChartPreviewPanel = () => {
  const [paperType, setPaperType] = useState('A4');
  const [canvasSize, setCanvasSize] = useState(paperSizes['A4']);

  const handlePaperChange = (value) => {
    setPaperType(value);
    if (value !== 'custom') {
      setCanvasSize(paperSizes[value]);
    }
  };

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom>
        🖼️ 캔버스 크기 설정
      </Typography>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>종이 크기</InputLabel>
        <Select
          value={paperType}
          label="종이 크기"
          onChange={(e) => handlePaperChange(e.target.value)}
        >
          <MenuItem value="A4">A4 (210 x 297mm)</MenuItem>
          <MenuItem value="A3">A3 (297 x 420mm)</MenuItem>
          <MenuItem value="custom" disabled>사용자 지정 (추후)</MenuItem>
        </Select>
      </FormControl>

      <Box
        mt={4}
        p={2}
        border="2px dashed #ccc"
        width="1000px"
        height="700px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgcolor="#f5f5f5"
        overflow="hidden"
        position="relative"
      >
        {canvasSize && (
          <Box
            bgcolor="white"
            border="1px solid #999"
            style={{
              width: `${mmToPx(canvasSize.width)}px`,
              height: `${mmToPx(canvasSize.height)}px`,
              transform: 'scale(0.7)', // 박스 안에 들어오도록 축소 (조정 가능)
              transformOrigin: 'top left',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChartPreviewPanel;
