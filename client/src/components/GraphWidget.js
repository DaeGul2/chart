import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";

const GraphWidget = ({ columns, data }) => {
  // 임시용: 첫 2개의 컬럼을 기준으로 점수 비교용 데이터 만들기
  const chartData = data.map((row, idx) => ({
    항목: `지원자${idx + 1}`,
    실제점수: row[columns[0]],
    평균점수: row[columns[1]],
  }));

  return (
    <BarChart width={400} height={300} data={chartData}>
      <XAxis dataKey="항목" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="평균점수" fill="#8884d8" />
      <Line type="monotone" dataKey="실제점수" stroke="#f44336" />
    </BarChart>
  );
};

export default GraphWidget;
