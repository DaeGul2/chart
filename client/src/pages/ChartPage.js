import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import ChartSettingPanel from '../components/ChartSettingPanel';
import ChartPreviewPanel from '../components/ChartPreviewPanel'; // ✅ 추가

const ChartPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [sharedState, setSharedState] = useState({
    columns: [],
    rows: [], // ✅ 추가
    fileName: '',
    evaluationItems: [],
  });

  const handleChange = (_, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box p={3}>
      <Tabs value={tabIndex} onChange={handleChange}>
        <Tab label="데이터 및 차트 설정" />
        <Tab label="차트 미리보기" />
      </Tabs>
      {tabIndex === 0 && (
        <ChartSettingPanel sharedState={sharedState} setSharedState={setSharedState} />
      )}
      {tabIndex === 1 && (
        <ChartPreviewPanel sharedState={sharedState} />
      )}
    </Box>
  );
};

export default ChartPage;
