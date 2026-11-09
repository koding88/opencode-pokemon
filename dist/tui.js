import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
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
  return (() => {
    var _el$ = _$createElement("box");
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "flexShrink", 0);
    _$setProp(_el$, "onSizeChange", function () {
      const measured = this.width;
      if (measured > 0 && measured !== width()) queueMicrotask(() => setWidth(measured));
    });
    _$insert(_el$, _$createComponent(Index, {
      get each() {
        return rows();
      },
      children: row => (() => {
        var _el$2 = _$createElement("text");
        _$setProp(_el$2, "wrapMode", "none");
        _$setProp(_el$2, "selectable", false);
        _$setProp(_el$2, "flexShrink", 0);
        _$insert(_el$2, () => row().map(segment => (() => {
          var _el$3 = _$createElement("span");
          _$insert(_el$3, () => segment.text);
          _$effect(_$p => _$setProp(_el$3, "style", {
            fg: segment.fg,
            bg: segment.bg
          }, _$p));
          return _el$3;
        })()));
        return _el$2;
      })()
    }));
    return _el$;
  })();
}
export default Plugin.define({
  id: "koding88.pokemon",
  setup(context) {
    return context.ui.slot({
      prepend: "sidebar.footer",
      render: props => _$createComponent(Team, {
        context: context,
        get sessionID() {
          return props.sessionID;
        }
      })
    });
  }
});
