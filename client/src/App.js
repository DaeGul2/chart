import React from "react";
import { Container, Typography, Box, Paper } from "@mui/material";
import ChartPage from "./pages/ChartPage";

const App = () => {
  return (
    <Container
      disableGutters
      sx={{
        maxWidth: "1500px",
        margin: "0 auto",
        padding: 4,
      }}
    >
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 리포트 커스터마이징 도구
          </Typography>
          <Typography variant="body1" color="text.secondary">
            엑셀 데이터를 기반으로 차트를 설정하고 시각화하세요.
          </Typography>
        </Box>
        <ChartPage />
      </Paper>
    </Container>
  );
};

export default App;
