import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import * as XLSX from 'xlsx';

const ExcelUploader = ({ setSharedState }) => {
  const handleFile = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    const headers = json[0] || [];
    const rows = json.slice(1); // 첫 행 제외한 데이터

    setSharedState((prev) => ({
      ...prev,
      columns: headers,
      rows: rows, // ✅ 전체 데이터 추가
      fileName: file.name,
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <Box
      border="2px dashed #aaa"
      p={3}
      textAlign="center"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      mb={2}
    >
      <Typography>엑셀 파일을 여기에 드래그하거나 선택하세요</Typography>
      <Button variant="contained" component="label" sx={{ mt: 2 }}>
        파일 선택
        <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
      </Button>
    </Box>
  );
};

export default ExcelUploader;
