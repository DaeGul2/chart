import React, { useState } from "react";
import ExcelUploader from "./components/ExcelUploader";
import CanvasEditor from "./components/CanvasEditor";

const App = () => {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);

  return (
    <div>
      <h2>📊 리포트 커스터마이징 도구</h2>
      <ExcelUploader setColumns={setColumns} setData={setData} />
      {columns.length > 0 && <CanvasEditor columns={columns} data={data} />}
    </div>
  );
};

export default App;
