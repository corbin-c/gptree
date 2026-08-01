import { useConversationTree } from "../hooks/useConversationTree";
import { usePanelState } from "../hooks/usePanelState";
import { SidePanel } from "./SidePanel";
import { ToggleButton } from "./ToggleButton";

export default function App() {
  const { tree, status, error } = useConversationTree();
  const panel = usePanelState();

  return (
    <>
      <ToggleButton isOpen={panel.isOpen} onClick={panel.toggle} />
      <SidePanel
        isOpen={panel.isOpen}
        width={panel.width}
        onResize={panel.setWidth}
        onClose={panel.toggle}
        tree={tree}
        status={status}
        error={error}
      />
    </>
  );
}
