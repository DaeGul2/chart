import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  Box,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

const defaultColors = {
  actual: '#fdae6b', // 연주황
  average: '#bcbddc', // 연보라
};

const GraphConfigModal = ({ open, onClose, evaluationItems, onCreate }) => {
  const [chartType, setChartType] = useState('bar');
  const [order, setOrder] = useState(evaluationItems.map((e) => e.label));
  const [actualColor, setActualColor] = useState(defaultColors.actual);
  const [avgColor, setAvgColor] = useState(defaultColors.average);

  const radarDisabled = evaluationItems.length < 3;

  const handleCreate = () => {
    const selectedItems = order
      .map((label) => evaluationItems.find((e) => e.label === label))
      .filter(Boolean);

    const chartObject = {
      id: uuidv4(),
      type: 'chart',
      chartType,
      x: 150,
      y: 100,
      width: 400,
      height: 300,
      config: {
        labels: selectedItems.map((e) => e.label),
        scoreCol: selectedItems.map((e) => e.scoreCol),
        avgCol: selectedItems.map((e) => e.avgCol),
        actualColor,
        avgColor,
      },
    };

    onCreate(chartObject);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>그래프 설정</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>그래프 타입 선택</Typography>
        <RadioGroup
          row
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
        >
          <FormControlLabel value="bar" control={<Radio />} label="막대그래프" />
          <FormControlLabel
            value="radar"
            control={<Radio />}
            label="방사형 그래프"
            disabled={radarDisabled}
          />
        </RadioGroup>

        {chartType === 'bar' && (
          <Box mt={2}>
            <Typography>평가항목 순서</Typography>
            <FormControl fullWidth>
              <Select
                multiple
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {evaluationItems.map((item, i) => (
                  <MenuItem key={i} value={item.label}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box mt={3}>
          <Typography>색상 설정</Typography>
          <TextField
            type="color"
            label="실제 점수 색"
            value={actualColor}
            onChange={(e) => setActualColor(e.target.value)}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="color"
            label="평균 점수 색"
            value={avgColor}
            onChange={(e) => setAvgColor(e.target.value)}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleCreate} variant="contained">
          그래프 생성
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GraphConfigModal;
