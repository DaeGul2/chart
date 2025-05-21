// ChartPreviewPanel.js
import React, { useRef, useState } from 'react';
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
  Grid, Paper, Button, TextField, Slider, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import GraphConfigModal from './GraphConfigModal';
import { ResizableBox } from 'react-resizable';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LabelList
} from 'recharts';
import 'react-resizable/css/styles.css';
import { exportCanvasToPdf } from '../services/exportPdfService';

const paperSizes = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

const mmToPx = (mm) => mm * 3.78;

const ChartPreviewPanel = ({ sharedState, setSharedState }) => {
  const canvasRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const canvasObjects = sharedState.canvasObjects || [];
  const evaluationItems = sharedState.evaluationItems || [];
  const rows = sharedState.rows || [];
  const paperType = sharedState.paperType || 'A4';
  const canvasSize = paperSizes[paperType];

  const selectedItem = canvasObjects.find(
    obj => obj.id === selectedId && (obj.type === 'text' || obj.type === 'mappedText')
  );

  const setCanvasObjects = updater => {
    const updated = typeof updater === 'function' ? updater(canvasObjects) : updater;
    setSharedState(prev => ({ ...prev, canvasObjects: updated }));
  };

  const handlePaperChange = value => {
    setSharedState(prev => ({ ...prev, paperType: value }));
  };

  const addTextItem = () => {
    const newId = uuidv4();
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const newItem = {
      id: newId,
      type: 'text',
      text: '텍스트를 입력하세요',
      x: width / 2 - 100,
      y: height / 2 - 20,
      fontSize: 16,
      bold: false,
    };
    setCanvasObjects([...canvasObjects, newItem]);
    setSelectedId(newId);
  };

  const addMappedTextItem = () => {
    const newId = uuidv4();
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const column = sharedState.columns[0] || '';
    const newItem = {
      id: newId,
      type: 'mappedText',
      column,
      x: width / 2 - 100,
      y: height / 2 - 20,
      fontSize: 16,
      bold: false,
    };
    setCanvasObjects([...canvasObjects, newItem]);
    setSelectedId(newId);
  };

  const updateTextItem = (field, value) => {
    setCanvasObjects(prev =>
      prev.map(item =>
        item.id === selectedId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleMouseDown = (e, id) => {
    if (isExporting || e.target.classList.contains('react-resizable-handle')) return;
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const item = canvasObjects.find(o => o.id === id);
    const initX = item.x, initY = item.y;
    const onMouseMove = e => {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      setCanvasObjects(prev =>
        prev.map(o => o.id === id
          ? { ...o, x: initX + dx, y: initY + dy }
          : o
        )
      );
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleDeleteObject = id => {
    if (isExporting) return;
    setCanvasObjects(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleCreateChart = chartObj => {
    setCanvasObjects(prev => [...prev, chartObj]);
  };

  const renderChartContent = (chartObj) => {
  const firstRow = rows[currentRowIndex];
  if (!firstRow) return <Typography>데이터 없음</Typography>;

  const { labels, scoreCol, avgCol, actualColor, avgColor } = chartObj.config;
  const data = labels.map((label, i) => ({
    항목: label,
    지원자: Number(firstRow[sharedState.columns.indexOf(scoreCol[i])]) || 0,
    평균:   Number(firstRow[sharedState.columns.indexOf(avgCol[i])])   || 0,
  }));

  const maxScore = Math.max(...data.map(d => Math.max(d.지원자, d.평균)));
  const yDomainMax = Math.ceil(maxScore * 1.2 / 2) * 2;

  if (chartObj.chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 40, bottom: 50, left: 20 }}
          isAnimationActive={false}
        >
          <XAxis dataKey="항목" interval={0} angle={-30} textAnchor="end" />
          <YAxis domain={[0, yDomainMax]} />
          <Tooltip />
          <Legend layout="vertical" verticalAlign="top" align="left" />
          <Bar dataKey="지원자" fill={actualColor} isAnimationActive={false}>
            <LabelList dataKey="지원자" position="top" />
          </Bar>
          <Bar dataKey="평균" fill={avgColor} isAnimationActive={false}>
            <LabelList dataKey="평균" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartObj.chartType === 'radar') {
    const tickValues = Array.from({ length: yDomainMax / 2 + 1 }, (_, i) => i * 2);
    const displayTicks = tickValues.slice(0, -1);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          margin={{ top: 30, bottom: 30, left: 30, right: 30 }}
          isAnimationActive={false}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="항목" tick={{ fontSize: 14, dx: 6, dy: 6 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, yDomainMax]}
            tickCount={displayTicks.length}
            ticks={displayTicks}
            tick={{ fontSize: 12, fill: '#444' }}
            axisLine={{ stroke: '#888' }}
            tickLine={{ stroke: '#aaa' }}
          />
          <Radar
            name="지원자"
            dataKey="지원자"
            stroke={actualColor}
            fill={actualColor}
            fillOpacity={0.6}
            isAnimationActive={false}
          />
          <Radar
            name="평균"
            dataKey="평균"
            stroke={avgColor}
            fill={avgColor}
            fillOpacity={0.3}
            isAnimationActive={false}
          />
          <Legend layout="vertical" verticalAlign="top" align="left" />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return null;
};


  const handleExportPdf = async () => {
    setIsExporting(true);

    await exportCanvasToPdf({
      canvasContainerRef: canvasRef.current,
      rows,
      // 여기를 Promise 기반으로 바꿔서, setCurrentRowIndex → 두 번 RAF → resolve 시킵니다.
      renderWithRowIndex: (index) => new Promise(resolve => {
        setCurrentRowIndex(index);
        // React가 state 반영하고 DOM update 한 뒤 실제 paint 될 때까지 두 번 RAF
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
      onProgress: (cur, total) => {
        console.log(`[PDF] 렌더링 ${cur}/${total}`);
      },
    });

    setIsExporting(false);
  };

  const renderCanvasObject = (obj, rowIndex, exporting) => {
    const deleteStyle = {
      position: 'absolute',
      top: -10,
      right: -10,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      border: '1px solid #ccc',
      textAlign: 'center',
      lineHeight: '20px',
      cursor: 'pointer',
      zIndex: 3,
    };

    // 공통 draggable / selectable 조건
    const isSelected = obj.id === selectedId;
    const row = rows[rowIndex];

    // 일반 텍스트
    if (obj.type === 'text') {
      return (
        <Box
          key={obj.id}
          position="absolute"
          top={obj.y}
          left={obj.x}
          onMouseDown={e => handleMouseDown(e, obj.id)}
          onClick={e => {
            if (!exporting) {
              e.stopPropagation();
              setSelectedId(obj.id);
            }
          }}
          sx={{
            cursor: exporting ? 'default' : 'move',
            fontSize: obj.fontSize,
            fontWeight: obj.bold ? 'bold' : 'normal',
            border: isSelected && !exporting ? '1px dashed #333' : 'none',
            p: 0.5,
            userSelect: 'none',
            maxWidth: 300,
            whiteSpace: 'nowrap',
          }}
        >
          {!exporting && (
            <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>
          )}
          {obj.text}
        </Box>
      );
    }

    // 맵핑 텍스트
    if (obj.type === 'mappedText') {
      const content = row
        ? row[sharedState.columns.indexOf(obj.column)] || `[${obj.column}]`
        : `[${obj.column}]`;

      return (
        <Box
          key={obj.id}
          position="absolute"
          top={obj.y}
          left={obj.x}
          onMouseDown={e => handleMouseDown(e, obj.id)}
          onClick={e => {
            if (!exporting) {
              e.stopPropagation();
              setSelectedId(obj.id);
            }
          }}
          sx={{
            cursor: exporting ? 'default' : 'move',
            fontSize: obj.fontSize,
            fontWeight: obj.bold ? 'bold' : 'normal',
            border: isSelected && !exporting ? '1px dashed #333' : 'none',
            p: 0.5,
            userSelect: 'none',
            maxWidth: 300,
            whiteSpace: 'nowrap',
          }}
        >
          {!exporting && (
            <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>
          )}
          {content}
        </Box>
      );
    }

    // 차트
    if (obj.type === 'chart') {
      return (
        <Box
          key={obj.id}
          position="absolute"
          top={obj.y}
          left={obj.x}
          onMouseDown={e => handleMouseDown(e, obj.id)}
          onClick={e => {
            if (!exporting) {
              e.stopPropagation();
              setSelectedId(obj.id);
            }
          }}
          sx={{
            cursor: exporting ? 'default' : 'move',
            border: isSelected && !exporting ? '2px dashed #333' : 'none',
            zIndex: 2,
          }}
        >
          {!exporting && (
            <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>
          )}
          <ResizableBox
            width={obj.width}
            height={obj.height}
            resizeHandles={exporting ? [] : ['se']}
            minConstraints={[100, 100]}
            maxConstraints={[800, 800]}
            style={{ border: '1px solid #aaa', background: '#fff', padding: 4, boxSizing: 'border-box' }}
          >
            <Box width="100%" height="100%">
              {renderChartContent(obj)}
            </Box>
          </ResizableBox>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom>🖼️ 그래프 생성 에디터</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>📐 캔버스 설정</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>종이 크기</InputLabel>
              <Select
                value={paperType}
                label="종이 크기"
                onChange={e => handlePaperChange(e.target.value)}
              >
                <MenuItem value="A4">A4 (210 x 297mm)</MenuItem>
                <MenuItem value="A3">A3 (297 x 420mm)</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />
            <Button variant="contained" onClick={addTextItem} fullWidth>
              ➕ 텍스트 추가
            </Button>
            <Button variant="contained" onClick={addMappedTextItem} fullWidth sx={{ mt: 1 }}>
              🧲 맵핑 텍스트 추가
            </Button>
            <Button variant="outlined" onClick={() => setModalOpen(true)} fullWidth sx={{ mt: 1 }}>
              📊 그래프 추가
            </Button>

            {selectedItem && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  ✏️ 선택된 {selectedItem.type === 'mappedText' ? '맵핑 텍스트' : '텍스트'} 설정
                </Typography>

                {selectedItem.type === 'text' && (
                  <TextField
                    fullWidth
                    label="텍스트 내용"
                    value={selectedItem.text}
                    onChange={e => updateTextItem('text', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                )}

                {selectedItem.type === 'mappedText' && (
                  <FormControl fullWidth sx={{ mb: 2 }} size="small">
                    <InputLabel>엑셀 컬럼 선택</InputLabel>
                    <Select
                      value={selectedItem.column}
                      label="엑셀 컬럼 선택"
                      onChange={e => updateTextItem('column', e.target.value)}
                    >
                      {sharedState.columns.map((col, idx) => (
                        <MenuItem key={idx} value={col}>{col}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Typography gutterBottom>글자 크기</Typography>
                <Slider
                  value={selectedItem.fontSize}
                  onChange={(_, v) => updateTextItem('fontSize', v)}
                  min={8}
                  max={48}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedItem.bold}
                      onChange={e => updateTextItem('bold', e.target.checked)}
                    />
                  }
                  label="굵게"
                />
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{
            p: 2, minHeight: 700, display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden', bgcolor: '#f0f0f0', border: '1px solid #ccc',
          }}>
            <Box
              ref={canvasRef}
              bgcolor="white"
              border="1px solid #999"
              position="relative"
              style={{
                width: `${mmToPx(canvasSize.width)}px`,
                height: `${mmToPx(canvasSize.height)}px`,
                transform: 'scale(0.7)',
                transformOrigin: 'top left',
              }}
              onClick={() => setSelectedId(null)}
            >
              {canvasObjects.map(obj =>
                renderCanvasObject(obj, currentRowIndex, isExporting)
              )}
            </Box>
          </Paper>

          <Box textAlign="center" mt={2}>
            <Button
              onClick={() => setCurrentRowIndex(i => Math.max(i - 1, 0))}
              disabled={currentRowIndex === 0}
              sx={{ mr: 2 }}
            >
              ◀ 이전
            </Button>
            <Typography display="inline">
              [{currentRowIndex + 1} / {rows.length}]
            </Typography>
            <Button
              onClick={() => setCurrentRowIndex(i => Math.min(i + 1, rows.length - 1))}
              disabled={currentRowIndex === rows.length - 1}
              sx={{ ml: 2 }}
            >
              다음 ▶
            </Button>
          </Box>
        </Grid>
      </Grid>

      <GraphConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        evaluationItems={evaluationItems}
        onCreate={handleCreateChart}
      />

      <Button
        variant="contained"
        color="secondary"
        onClick={handleExportPdf}
        fullWidth
        sx={{ mt: 2 }}
      >
        📄 전체 PDF로 저장
      </Button>
    </Box>
  );
};

export default ChartPreviewPanel;
