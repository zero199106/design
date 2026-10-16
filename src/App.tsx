import CanvasView from "./canvas/CanvasView";
import Topbar from "./components/Topbar";
import LayersPanel from "./components/LayersPanel";
import PropertiesPanel from "./components/PropertiesPanel";

export default function App() {
  return (
    <div className="app">
      <Topbar />
      <div className="body">
        <LayersPanel />
        <CanvasView />
        <PropertiesPanel />
      </div>
    </div>
  );
}