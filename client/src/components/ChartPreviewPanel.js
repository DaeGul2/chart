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
import { Customized } from 'recharts'; // 꼭 import 해야 함

const paperSizes = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
};

const mmToPx = (mm) => mm * 3.78;

const ChartPreviewPanel = ({ sharedState, setSharedState }) => {
    const canvasRef = useRef(null);
    const [selectedId, setSelectedId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const canvasObjects = sharedState.canvasObjects || [];
    const evaluationItems = sharedState.evaluationItems || [];
    const rows = sharedState.rows || [];
    const paperType = sharedState.paperType || 'A4';
    const canvasSize = paperSizes[paperType];

    const selectedItem = canvasObjects.find(obj => obj.id === selectedId && obj.type === 'text');

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

    const updateTextItem = (field, value) => {
        setCanvasObjects(prev =>
            prev.map(item =>
                item.id === selectedId ? { ...item, [field]: value } : item
            )
        );
    };

    const handleMouseDown = (e, id) => {
        if (e.target.classList.contains('react-resizable-handle')) return; // ✅ 크기조절 핸들이면 무시

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
        setCanvasObjects(prev => prev.filter(o => o.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleCreateChart = chartObj => {
        setCanvasObjects(prev => [...prev, chartObj]);
    };

    const renderChartContent = (chartObj) => {
        const firstRow = rows[0];
        if (!firstRow) return <Typography>데이터 없음</Typography>;

        const { labels, scoreCol, avgCol, actualColor, avgColor } = chartObj.config;
        const data = labels.map((label, i) => ({
            항목: label,
            실제: Number(firstRow[sharedState.columns.indexOf(scoreCol[i])]) || 0,
            평균: Number(firstRow[sharedState.columns.indexOf(avgCol[i])]) || 0,
        }));

        const maxScore = Math.max(...data.map(d => Math.max(d.실제, d.평균)));
        const yDomainMax = Math.ceil(maxScore * 1.2 / 2) * 2; // 여유 있게 20% 증가, 짝수로 반올림

        if (chartObj.chartType === 'bar') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 40, bottom: 50, left: 20 }}
                    >
                        <XAxis
                            dataKey="항목"
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                        />
                        <YAxis domain={[0, yDomainMax]} />
                        <Tooltip />
                        <Legend layout="vertical" verticalAlign="top" align="left" />
                        <Bar dataKey="실제" fill={actualColor}>
                            <LabelList dataKey="실제" position="top" />
                        </Bar>
                        <Bar dataKey="평균" fill={avgColor}>
                            <LabelList dataKey="평균" position="top" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        if (chartObj.chartType === 'radar') {
            const tickValues = Array.from({ length: yDomainMax / 2 + 1 }, (_, i) => i * 2); // 0, 2, 4, ...
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                        data={data}
                        margin={{ top: 30, bottom: 30, left: 30, right: 30 }}
                    >
                        <PolarGrid />
                        <PolarAngleAxis
                            dataKey="항목"
                            tick={{ fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, yDomainMax]}
                            tickCount={tickValues.length}
                            ticks={tickValues}
                            tick={{ fontSize: 12 }}
                            axisLine={{ stroke: '#888' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <Radar name="실제" dataKey="실제" stroke={actualColor} fill={actualColor} fillOpacity={0.6} />
                        <Radar name="평균" dataKey="평균" stroke={avgColor} fill={avgColor} fillOpacity={0.3} />
                        <Legend layout="vertical" verticalAlign="top" align="left" />
                    </RadarChart>
                </ResponsiveContainer>
            );
        }

        return null;
    };


    const renderCanvasObject = obj => {
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

        if (obj.type === 'text') {
            return (
                <Box
                    key={obj.id}
                    position="absolute"
                    top={obj.y}
                    left={obj.x}
                    onMouseDown={e => handleMouseDown(e, obj.id)}
                    onClick={e => { e.stopPropagation(); setSelectedId(obj.id); }}
                    sx={{
                        cursor: 'move',
                        fontSize: obj.fontSize,
                        fontWeight: obj.bold ? 'bold' : 'normal',
                        border: obj.id === selectedId ? '1px dashed #333' : 'none',
                        p: 0.5,
                        userSelect: 'none',
                        maxWidth: 300,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>
                    {obj.text}
                </Box>
            );
        }

        if (obj.type === 'chart') {
            return (
                <Box
                    key={obj.id}
                    position="absolute"
                    top={obj.y}
                    left={obj.x}
                    onMouseDown={e => handleMouseDown(e, obj.id)}
                    onClick={e => { e.stopPropagation(); setSelectedId(obj.id); }}
                    sx={{
                        cursor: 'move',
                        border: obj.id === selectedId ? '2px dashed #333' : 'none',
                        zIndex: 2,
                    }}
                >
                    <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>
                    <ResizableBox
                        width={obj.width}
                        height={obj.height}
                        resizeHandles={['se']}
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
            <Typography variant="h6" gutterBottom>
                🖼️ 그래프 생성 에디터
            </Typography>
            <Grid container spacing={2}>
                {/* 좌측 설정 패널 */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>📐 캔버스 설정</Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>종이 크기</InputLabel>
                            <Select value={paperType} label="종이 크기" onChange={e => handlePaperChange(e.target.value)}>
                                <MenuItem value="A4">A4 (210 x 297mm)</MenuItem>
                                <MenuItem value="A3">A3 (297 x 420mm)</MenuItem>
                            </Select>
                        </FormControl>

                        <Divider sx={{ my: 2 }} />
                        <Button variant="contained" onClick={addTextItem} fullWidth>➕ 텍스트 추가</Button>
                        <Button variant="outlined" onClick={() => setModalOpen(true)} fullWidth sx={{ mt: 1 }}>
                            📊 그래프 추가
                        </Button>

                        {selectedItem && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>✏️ 선택된 텍스트 설정</Typography>
                                <TextField
                                    fullWidth
                                    label="텍스트 내용"
                                    value={selectedItem.text}
                                    onChange={e => updateTextItem('text', e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <Typography gutterBottom>글자 크기</Typography>
                                <Slider
                                    value={selectedItem.fontSize}
                                    onChange={(_, v) => updateTextItem('fontSize', v)}
                                    min={8}
                                    max={48}
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={selectedItem.bold} onChange={e => updateTextItem('bold', e.target.checked)} />}
                                    label="굵게"
                                />
                            </>
                        )}
                    </Paper>
                </Grid>

                {/* 우측 캔버스 */}
                <Grid item xs={12} md={8}>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2, minHeight: 700, display: 'flex',
                            justifyContent: 'center', alignItems: 'center',
                            overflow: 'hidden', bgcolor: '#f0f0f0', border: '1px solid #ccc',
                        }}
                    >
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
                            {canvasObjects.map(obj => renderCanvasObject(obj))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <GraphConfigModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                evaluationItems={evaluationItems}
                onCreate={handleCreateChart}
            />
        </Box>
    );
};

export default ChartPreviewPanel;
