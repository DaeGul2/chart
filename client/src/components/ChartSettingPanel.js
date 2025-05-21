import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  Typography,
  IconButton,
  TextField,
} from '@mui/material';
import ExcelUploader from './ExcelUploader';
import DeleteIcon from '@mui/icons-material/Delete';

const ChartSettingPanel = ({ sharedState, setSharedState }) => {
  const [localItems, setLocalItems] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // 초기 상태 로드
  useEffect(() => {
    setLocalItems(sharedState.evaluationItems || []);
  }, [sharedState.evaluationItems]);

  const addEvaluationItem = () => {
    setLocalItems([
      ...localItems,
      { label: '', scoreCol: '', avgCol: '' },
    ]);
    setEditMode(true);
  };

  const updateItem = (index, field, value) => {
    const updated = [...localItems];
    updated[index][field] = value;

    // scoreCol 바꿀 때 label 기본값 자동 설정
    if (field === 'scoreCol' && (!updated[index].label || updated[index].label === '')) {
      updated[index].label = value;
    }

    setLocalItems(updated);
  };

  const removeItem = (index) => {
    const updated = [...localItems];
    updated.splice(index, 1);
    setLocalItems(updated);
  };

  const saveItems = () => {
    setSharedState((prev) => ({
      ...prev,
      evaluationItems: localItems,
    }));
    setEditMode(false);
  };

  const startEdit = () => {
    setEditMode(true);
  };

  return (
    <Box mt={3}>
      <ExcelUploader setSharedState={setSharedState} />
      {sharedState.columns.length > 0 && (
        <>
          <Box display="flex" gap={1} mt={2}>
            <Button variant="outlined" onClick={addEvaluationItem}>
              평가항목 추가
            </Button>
            {editMode ? (
              <Button variant="contained" onClick={saveItems}>
                저장
              </Button>
            ) : (
              <Button variant="outlined" onClick={startEdit}>
                수정
              </Button>
            )}
          </Box>

          <Stack spacing={2} mt={2}>
            {localItems.map((item, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <TextField
                  label="평가항목 이름"
                  value={item.label}
                  onChange={(e) => updateItem(idx, 'label', e.target.value)}
                  size="small"
                  disabled={!editMode}
                />
                <Select
                  value={item.scoreCol}
                  displayEmpty
                  onChange={(e) => updateItem(idx, 'scoreCol', e.target.value)}
                  size="small"
                  disabled={!editMode}
                >
                  <MenuItem value="" disabled>
                    지원자 점수 컬럼
                  </MenuItem>
                  {sharedState.columns.map((col, i) => (
                    <MenuItem key={i} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  value={item.avgCol}
                  displayEmpty
                  onChange={(e) => updateItem(idx, 'avgCol', e.target.value)}
                  size="small"
                  disabled={!editMode}
                >
                  <MenuItem value="" disabled>
                    전체 평균 컬럼
                  </MenuItem>
                  {sharedState.columns.map((col, i) => (
                    <MenuItem key={i} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
                {editMode && (
                  <IconButton onClick={() => removeItem(idx)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};

export default ChartSettingPanel;
