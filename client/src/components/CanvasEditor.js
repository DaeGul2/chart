import React, { useState } from "react";
import { Rnd } from "react-rnd";
import GraphWidget from "./GraphWidget";

const CanvasEditor = ({ columns, data }) => {
  const [widgets, setWidgets] = useState([]);

  const addGraph = () => {
    setWidgets([
      ...widgets,
      {
        id: Date.now(),
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        type: "graph",
        config: {} // 추후 평가항목/컬럼/색상 등 설정 가능
      }
    ]);
  };

  return (
    <div>
      <button onClick={addGraph}>➕ 그래프 추가</button>
      <div
        style={{
          position: "relative",
          width: 1240,
          height: 1754,
          border: "2px dashed gray",
          marginTop: 20,
        }}
      >
        {widgets.map((w) => (
          <Rnd
            key={w.id}
            default={{
              x: w.x,
              y: w.y,
              width: w.width,
              height: w.height,
            }}
            bounds="parent"
            onDragStop={(e, d) =>
              setWidgets((prev) =>
                prev.map((item) =>
                  item.id === w.id ? { ...item, x: d.x, y: d.y } : item
                )
              )
            }
            onResizeStop={(e, direction, ref, delta, position) =>
              setWidgets((prev) =>
                prev.map((item) =>
                  item.id === w.id
                    ? {
                        ...item,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        ...position,
                      }
                    : item
                )
              )
            }
          >
            <GraphWidget columns={columns} data={data} />
          </Rnd>
        ))}
      </div>
    </div>
  );
};

export default CanvasEditor;
