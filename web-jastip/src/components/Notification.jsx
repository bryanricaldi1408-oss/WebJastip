import { For } from "solid-js";
import { notification } from "../store/WebStore";
import "../style/Notification.css";

export const Notification = () => {
  return (
    <div class="notification-container">
      <For each={notification()}>
        {(notif) => (
          <div class={`toast-box ${notif.type}`}>
            <p>{notif.message}</p>
          </div>
        )}
      </For>
    </div>
  );
};
