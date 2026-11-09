import { Plugin } from "@opencode/plugin/tui";
import { createSignal, Index, onCleanup } from "solid-js";
import { createState, render, step, TICK_MS } from "./scene.js";

const DEFAULT_WIDTH = 36;

function Team(props) {
  const [width, setWidth] = createSignal(DEFAULT_WIDTH);
  let state = createState();
  let sessionID;
  const [rows, setRows] = createSignal(render(step(state, "idle", DEFAULT_WIDTH)));

  const timer = setInterval(() => {
    if (props.sessionID !== sessionID) {
      sessionID = props.sessionID;
      state = createState();
    }
    const status = props.context.data.session.status(sessionID);
    step(state, status, width());
    setRows(render(state));
  }, TICK_MS);
  onCleanup(() => clearInterval(timer));

  return (
    <box
      flexDirection="column"
      flexShrink={0}
      onSizeChange={function () {
        const measured = this.width;
        if (measured > 0 && measured !== width()) queueMicrotask(() => setWidth(measured));
      }}
    >
      <Index each={rows()}>
        {(row) => (
          <text wrapMode="none" selectable={false} flexShrink={0}>
            {row().map((segment) => (
              <span style={{ fg: segment.fg, bg: segment.bg }}>{segment.text}</span>
            ))}
          </text>
        )}
      </Index>
    </box>
  );
}

export default Plugin.define({
  id: "koding88.pokemon",
  setup(context) {
    return context.ui.slot({
      prepend: "sidebar.footer",
      render: (props) => <Team context={context} sessionID={props.sessionID} />,
    });
  },
});
