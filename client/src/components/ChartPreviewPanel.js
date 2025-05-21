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

// 도형 기본 속성
const DEFAULT_SHAPE = {
    shapeType: 'rectangle',   // 'rectangle' | 'circle'
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 1,
};

const ChartPreviewPanel = ({ sharedState, setSharedState }) => {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
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
        obj => obj.id === selectedId && ['text', 'mappedText', 'shape', 'image'].includes(obj.type)
    );

    const setCanvasObjects = updater => {
        const updated = typeof updater === 'function' ? updater(canvasObjects) : updater;
        setSharedState(prev => ({ ...prev, canvasObjects: updated }));
    };

    // 텍스트·맵핑·도형·이미지 공통 업데이트
    const updateObjectField = (field, value, id = selectedId) => {
        setCanvasObjects(prev =>
            prev.map(o => o.id === id ? { ...o, [field]: value } : o)
        );
    };

    const handlePaperChange = value => {
        setSharedState(prev => ({ ...prev, paperType: value }));
    };

    const addTextItem = () => {
        const newId = uuidv4();
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasObjects([
            ...canvasObjects,
            { id: newId, type: 'text', text: '텍스트를 입력하세요', x: width / 2 - 100, y: height / 2 - 20, fontSize: 16, bold: false, color: '#000000' }
        ]);
        setSelectedId(newId);
    };

    const addMappedTextItem = () => {
        const newId = uuidv4();
        const { width, height } = canvasRef.current.getBoundingClientRect();
        const column = sharedState.columns[0] || '';
        setCanvasObjects([
            ...canvasObjects,
            { id: newId, type: 'mappedText', column, x: width / 2 - 100, y: height / 2 - 20, fontSize: 16, bold: false, color: '#000000' }
        ]);
        setSelectedId(newId);
    };

    const addShapeItem = () => {
        const newId = uuidv4();
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasObjects(prev => [
            ...prev,
            {
                id: newId, type: 'shape',
                x: width / 2 - 50, y: height / 2 - 25,
                width: 100, height: 50,
                ...DEFAULT_SHAPE
            }
        ]);
        setSelectedId(newId);
    };

    const triggerImageUpload = () => {
        fileInputRef.current.click();
    };

    const handleImageUpload = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const src = reader.result;
            const newId = uuidv4();
            const { width, height } = canvasRef.current.getBoundingClientRect();
            setCanvasObjects(prev => [
                ...prev,
                {
                    id: newId, type: 'image',
                    x: width / 2 - 100, y: height / 2 - 100,
                    width: 200, height: 200,
                    src
                }
            ]);
            setSelectedId(newId);
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const handleMouseDown = (e, id) => {
        if (isExporting || e.target.classList.contains('react-resizable-handle')) return;
        e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const item = canvasObjects.find(o => o.id === id);
        const initX = item.x, initY = item.y;
        const onMouseMove = ev => {
            const dx = ev.clientX - startX, dy = ev.clientY - startY;
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

    const renderChartContent = chartObj => {
        const firstRow = rows[currentRowIndex];
        if (!firstRow) return <Typography>데이터 없음</Typography>;

        const { labels, scoreCol, avgCol, actualColor, avgColor } = chartObj.config;
        const data = labels.map((label, i) => ({
            항목: label,
            지원자: Number(firstRow[sharedState.columns.indexOf(scoreCol[i])]) || 0,
            평균: Number(firstRow[sharedState.columns.indexOf(avgCol[i])]) || 0,
        }));

        const maxScore = Math.max(...data.map(d => Math.max(d.지원자, d.평균)));
        const yDomainMax = Math.ceil(maxScore * 1.2 / 2) * 2;

        if (chartObj.chartType === 'bar') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 40, bottom: 50, left: 20 }} isAnimationActive={false}>
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
                    <RadarChart data={data} margin={{ top: 30, bottom: 30, left: 30, right: 30 }} isAnimationActive={false}>
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
                        <Radar name="지원자" dataKey="지원자" stroke={actualColor} fill={actualColor} fillOpacity={0.6} isAnimationActive={false} />
                        <Radar name="평균" dataKey="평균" stroke={avgColor} fill={avgColor} fillOpacity={0.3} isAnimationActive={false} />
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
            renderWithRowIndex: index => new Promise(resolve => {
                setCurrentRowIndex(index);
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
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
        const isSelected = obj.id === selectedId;
        const row = rows[rowIndex];

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
                        color: obj.color,
                        border: isSelected && !exporting ? '1px dashed #333' : 'none',
                        p: 0.5,
                        userSelect: 'none',
                        maxWidth: 300,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {!exporting && <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>}
                    {obj.text}
                </Box>
            );
        }

        if (obj.type === 'mappedText') {
            const content = row ? row[sharedState.columns.indexOf(obj.column)] || `[${obj.column}]` : `[${obj.column}]`;
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
                        color: obj.color,
                        border: isSelected && !exporting ? '1px dashed #333' : 'none',
                        p: 0.5,
                        userSelect: 'none',
                        maxWidth: 300,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {!exporting && <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>}
                    {content}
                </Box>
            );
        }

        if (obj.type === 'shape') {
            const isCircle = obj.shapeType === 'circle';
            return (
                <Box key={obj.id} position="absolute" top={obj.y} left={obj.x}>
                    {!exporting && <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>}
                    <ResizableBox
                        width={obj.width}
                        height={obj.height}
                        resizeHandles={exporting ? [] : ['se']}
                        onResizeStop={(e, { size }) => {
                            updateObjectField('width', size.width, obj.id);
                            updateObjectField('height', size.height, obj.id);
                        }}
                        minConstraints={[50, 50]}
                        style={{
                            position: 'relative',
                            cursor: exporting ? 'default' : 'move',
                            backgroundColor: obj.fillColor === 'none' ? 'transparent' : obj.fillColor,
                            borderRadius: isCircle ? '50%' : 0,
                            border: `${obj.strokeWidth}px solid ${obj.strokeColor}`,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            width: obj.width,
                            height: obj.height,
                        }}
                        onMouseDown={e => handleMouseDown(e, obj.id)}
                        onClick={e => {
                            if (!exporting) {
                                e.stopPropagation();
                                setSelectedId(obj.id);
                            }
                        }}
                    />
                </Box>
            );
        }


        if (obj.type === 'image') {
            return (
                <Box key={obj.id} position="absolute" top={obj.y} left={obj.x}>
                    {!exporting && <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>}
                    <ResizableBox
                        width={obj.width}
                        height={obj.height}
                        resizeHandles={exporting ? [] : ['se']}
                        onResizeStop={(e, { size }) => {
                            updateObjectField('width', size.width, obj.id);
                            updateObjectField('height', size.height, obj.id);
                        }}
                        minConstraints={[50, 50]}
                        style={{
                            position: 'relative',
                            cursor: exporting ? 'default' : 'move',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            width: obj.width,
                            height: obj.height,
                        }}
                        onMouseDown={e => handleMouseDown(e, obj.id)}
                        onClick={e => {
                            if (!exporting) {
                                e.stopPropagation();
                                setSelectedId(obj.id);
                            }
                        }}
                    >
                        <Box
                            component="img"
                            src={obj.src}
                            alt=""
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'fill', // 원본 이미지가 박스 크기에 맞게 늘어나도록
                                pointerEvents: 'none',
                                display: 'block',
                            }}
                        />
                    </ResizableBox>
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
                    {!exporting && <Box sx={deleteStyle} onClick={() => handleDeleteObject(obj.id)}>×</Box>}
                    <ResizableBox
                        width={obj.width}
                        height={obj.height}
                        resizeHandles={exporting ? [] : ['se']}
                        minConstraints={[100, 100]}
                        maxConstraints={[800, 800]}
                        style={{ border: '1px solid #aaa', background: '#fff', padding: 4, boxSizing: 'border-box' }}
                    >
                        <Box width="100%" height="100%">{renderChartContent(obj)}</Box>
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
                        <Button variant="contained" onClick={addShapeItem} fullWidth sx={{ mt: 1 }}>
                            🔲 도형 추가
                        </Button>
                        <Button variant="contained" onClick={triggerImageUpload} fullWidth sx={{ mt: 1 }}>
                            🖼️ 이미지 추가
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />

                        <Button variant="outlined" onClick={() => setModalOpen(true)} fullWidth sx={{ mt: 1 }}>
                            📊 그래프 추가
                        </Button>

                        {selectedItem && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>
                                    ✏️ 선택된 {
                                        selectedItem.type === 'mappedText' ? '맵핑 텍스트' :
                                            selectedItem.type === 'shape' ? '도형' :
                                                selectedItem.type === 'image' ? '이미지' :
                                                    '텍스트'
                                    } 설정
                                </Typography>

                                {selectedItem.type === 'text' && (
                                    <>
                                        <TextField
                                            fullWidth
                                            label="텍스트 내용"
                                            value={selectedItem.text}
                                            onChange={e => updateObjectField('text', e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        <Typography gutterBottom>글자 크기</Typography>
                                        <Slider value={selectedItem.fontSize} onChange={(_, v) => updateObjectField('fontSize', v)} min={8} max={48} />
                                        <Typography gutterBottom>글자 색상</Typography>
                                        <TextField
                                            type="color"
                                            label="글자색"
                                            value={selectedItem.color}
                                            onChange={e => updateObjectField('color', e.target.value)}
                                            fullWidth size="small" margin="dense" InputLabelProps={{ shrink: true }}
                                        />
                                        <FormControlLabel
                                            control={<Checkbox checked={selectedItem.bold} onChange={e => updateObjectField('bold', e.target.checked)} />}
                                            label="굵게"
                                        />
                                    </>
                                )}

                                {selectedItem.type === 'mappedText' && (
                                    <>
                                        <FormControl fullWidth sx={{ mb: 2 }} size="small">
                                            <InputLabel>엑셀 컬럼 선택</InputLabel>
                                            <Select
                                                value={selectedItem.column}
                                                label="엑셀 컬럼 선택"
                                                onChange={e => updateObjectField('column', e.target.value)}
                                            >
                                                {sharedState.columns.map((col, idx) => (
                                                    <MenuItem key={idx} value={col}>{col}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Typography gutterBottom>글자 크기</Typography>
                                        <Slider value={selectedItem.fontSize} onChange={(_, v) => updateObjectField('fontSize', v)} min={8} max={48} />
                                        <Typography gutterBottom>글자 색상</Typography>
                                        <TextField
                                            type="color"
                                            label="글자색"
                                            value={selectedItem.color}
                                            onChange={e => updateObjectField('color', e.target.value)}
                                            fullWidth size="small" margin="dense" InputLabelProps={{ shrink: true }}
                                        />
                                        <FormControlLabel
                                            control={<Checkbox checked={selectedItem.bold} onChange={e => updateObjectField('bold', e.target.checked)} />}
                                            label="굵게"
                                        />
                                    </>
                                )}

                                {selectedItem.type === 'shape' && (
                                    <>
                                        <Typography gutterBottom>도형 타입</Typography>
                                        <Select fullWidth size="small" value={selectedItem.shapeType} onChange={e => updateObjectField('shapeType', e.target.value)}>
                                            <MenuItem value="rectangle">직사각형</MenuItem>
                                            <MenuItem value="circle">원</MenuItem>
                                        </Select>
                                        <Typography gutterBottom>테두리 색상</Typography>
                                        <TextField type="color" value={selectedItem.strokeColor} onChange={e => updateObjectField('strokeColor', e.target.value)} fullWidth size="small" margin="dense" InputLabelProps={{ shrink: true }} />
                                        <Typography gutterBottom>채우기 색상</Typography>
                                        <TextField type="color" value={selectedItem.fillColor === 'none' ? '#ffffff' : selectedItem.fillColor} disabled={selectedItem.fillColor === 'none'} onChange={e => updateObjectField('fillColor', e.target.value)} fullWidth size="small" margin="dense" InputLabelProps={{ shrink: true }} />
                                        <FormControlLabel control={<Checkbox checked={selectedItem.fillColor === 'none'} onChange={e => updateObjectField('fillColor', e.target.checked ? 'none' : DEFAULT_SHAPE.fillColor)} />} label="채우기 없음" />
                                        <Typography gutterBottom>테두리 굵기</Typography>
                                        <Slider value={selectedItem.strokeWidth} min={1} max={10} onChange={(_, v) => updateObjectField('strokeWidth', v)} />
                                    </>
                                )}

                                {selectedItem.type === 'image' && (
                                    <>
                                        <Typography gutterBottom>이미지 변경</Typography>
                                        <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
                                            업로드
                                            <input type="file" hidden accept="image/*" onChange={e => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => updateObjectField('src', reader.result);
                                                reader.readAsDataURL(file);
                                            }} />
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={2} sx={{ p: 2, minHeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', bgcolor: '#f0f0f0', border: '1px solid #ccc' }}>
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
                            {canvasObjects.map(obj => renderCanvasObject(obj, currentRowIndex, isExporting))}
                        </Box>
                    </Paper>

                    <Box textAlign="center" mt={2}>
                        <Button onClick={() => setCurrentRowIndex(i => Math.max(i - 1, 0))} disabled={currentRowIndex === 0} sx={{ mr: 2 }}>
                            ◀ 이전
                        </Button>
                        <Typography display="inline">
                            [{currentRowIndex + 1} / {rows.length}]
                        </Typography>
                        <Button onClick={() => setCurrentRowIndex(i => Math.min(i + 1, rows.length - 1))} disabled={currentRowIndex === rows.length - 1} sx={{ ml: 2 }}>
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
